"""Read-only stop search and arrival board. All epochs are in seconds."""

import json
import sqlite3
import threading
import time
import urllib.request
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit
from zoneinfo import ZoneInfo

from google.transit import gtfs_realtime_pb2 as gtfs
from prepare import ROOT, CITIES

FRESH = 180
HORIZON = 5400


def fresh(stamp, now):
    return 0 < stamp <= now and now - stamp <= FRESH


class Updates:
    def __init__(self, url):
        self.url = url
        self.lock = threading.Lock()
        self.next_fetch = 0
        self.snapshot = (0, {}, "Sin consulta")

    def get(self):
        with self.lock:
            if time.monotonic() >= self.next_fetch:
                try:
                    with urllib.request.urlopen(self.url, timeout=8) as response:
                        payload = response.read(24_000_001)
                    if len(payload) > 24_000_000:
                        raise ValueError("Oversized feed")
                    feed = gtfs.FeedMessage.FromString(payload)
                    if not feed.IsInitialized() or feed.header.incrementality != 0:
                        raise ValueError("Expected full dataset")
                    updates = {}
                    for entity in feed.entity:
                        if entity.HasField("trip_update") and not entity.is_deleted:
                            u = entity.trip_update
                            updates[(u.trip.trip_id, u.trip.start_date)] = u
                    self.snapshot = (feed.header.timestamp, updates, "Recibido")
                except Exception:
                    self.snapshot = (0, {}, "Fuente temporalmente no disponible")
                self.next_fetch = time.monotonic() + 30
            return self.snapshot


def estimate(scheduled, stop, seq, update, header, now):
    label = "Programada"
    if (
        update is None
        or not fresh(header, now)
        or not fresh(update.timestamp or header, now)
    ):
        return scheduled, label
    if update.trip.schedule_relationship in (3, 7):
        return None
    if update.trip.schedule_relationship != 0:
        return scheduled, label
    for item in update.stop_time_update:
        match = (
            item.stop_sequence == seq
            if item.HasField("stop_sequence")
            else item.stop_id == stop
        )
        if match and (not item.stop_id or item.stop_id == stop):
            if item.schedule_relationship == 1:
                return None
            if item.schedule_relationship != 0:
                return scheduled, label
            if item.arrival.HasField("time"):
                return item.arrival.time, "Estimada · parada"
            if item.arrival.HasField("delay"):
                return scheduled + item.arrival.delay, "Estimada · parada"
    if not update.stop_time_update and update.HasField("delay"):
        return scheduled + update.delay, "Estimada · viaje"
    return scheduled, label


def board(db, stop, zone, snapshot, now):
    stamp, updates, status = snapshot
    today = datetime.fromtimestamp(now, zone).date()
    output = []
    for offset in (-1, 0, 1):
        date = today + timedelta(days=offset)
        key = date.strftime("%Y%m%d")
        midnight = (
            int(
                datetime.combine(date, datetime.min.time(), zone)
                .replace(hour=12)
                .timestamp()
            )
            - 43200
        )
        services = {
            s
            for s, days in db.execute(
                "SELECT id,days FROM calendar WHERE start<=? AND end>=?", (key, key)
            )
            if days[date.weekday()] == "1"
        }
        for s, k in db.execute("SELECT id,kind FROM exceptions WHERE date=?", (key,)):
            if k == "1":
                services.add(s)
            else:
                services.discard(s)
        if not services:
            continue
        rows = db.execute(
            """SELECT a.stop,a.trip,a.seq,a.t,t.service,r.label,r.destination
            FROM arrivals a JOIN trips t ON t.id=a.trip JOIN routes r ON r.id=t.route
            WHERE a.stop IN (SELECT id FROM stops WHERE parent=? UNION SELECT ?)
            AND a.t BETWEEN ? AND ?""",
            (stop, stop, now - midnight - 7200, now - midnight + HORIZON + 7200),
        )
        for platform, trip, seq, t, service, route, destination in rows:
            if service not in services:
                continue
            result = estimate(
                midnight + t, platform, seq, updates.get((trip, key)), stamp, now
            )
            if result and now <= result[0] <= now + HORIZON:
                output.append(
                    dict(
                        at=result[0],
                        kind=result[1],
                        route=route,
                        destination=destination,
                        platform=platform,
                    )
                )
    return dict(
        rows=sorted(output, key=lambda r: r["at"])[:60],
        feed=stamp,
        status=status,
        now=now,
    )


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = urlsplit(self.path)
        if path.path == "/wait.js":
            self.reply(
                200, "text/javascript; charset=utf-8", (ROOT / "wait.js").read_bytes()
            )
            return
        if path.path == "/":
            self.reply(
                200, "text/html; charset=utf-8", (ROOT / "index.html").read_bytes()
            )
            return
        if path.path not in ("/api/cities", "/api/stops", "/api/board"):
            self.send_error(404)
            return
        args = {k: v[0] for k, v in parse_qs(path.query).items()}
        try:
            if path.path == "/api/cities":
                obj = CITIES
            else:
                city = args.get("city", "bogota")
                cfg = CITIES[city]
                with sqlite3.connect(
                    (ROOT / (city + ".sqlite")).as_uri() + "?mode=ro", uri=True
                ) as db:
                    if path.path == "/api/stops":
                        query = args.get("q", "")[:100].strip()
                        obj = db.execute(
                            """SELECT id,name FROM stops WHERE instr(lower(name),lower(?))>0 OR id=? OR code=?
                            ORDER BY (id=? OR code=?) DESC, name,id LIMIT 60""",
                            (query, query, query, query, query),
                        ).fetchall()
                    else:
                        stop = args["stop"]
                        if not db.execute(
                            "SELECT 1 FROM stops WHERE id=?", (stop,)
                        ).fetchone():
                            raise KeyError(stop)
                        snapshot = self.server.feeds[city].get()
                        obj = board(
                            db,
                            stop,
                            ZoneInfo(cfg["timezone"]),
                            snapshot,
                            int(time.time()),
                        )
            self.reply(200, "application/json", json.dumps(obj).encode())
        except KeyError:
            self.send_error(400, "Unknown city or stop")
        except sqlite3.Error:
            self.send_error(503, "Prepare the city timetable first")

    def reply(self, status, kind, body):
        self.send_response(status)
        self.send_header("Content-Type", kind)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8765), Handler)
    server.feeds = {k: Updates(v["updates"]) for k, v in CITIES.items()}
    print("Intervalo: http://127.0.0.1:8765", flush=True)
    server.serve_forever()
