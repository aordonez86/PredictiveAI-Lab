"""Build a stop-indexed SQLite timetable from an agency GTFS ZIP."""

import csv
import io
import json
import os
import sqlite3
import sys
import tempfile
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CITIES = json.loads((ROOT / "cities.json").read_text())


def records(archive, table):
    with archive.open(table + ".txt") as stream:
        yield from csv.DictReader(
            io.TextIOWrapper(stream, encoding="utf-8-sig", newline="")
        )


def seconds(value):
    h, m, s = map(int, value.split(":"))
    if h < 0 or not 0 <= m < 60 or not 0 <= s < 60:
        raise ValueError("Invalid GTFS time")
    return h * 3600 + m * 60 + s


def build(source, target):
    with tempfile.NamedTemporaryFile(dir=target.parent, delete=False) as temp:
        path = temp.name
    try:
        with zipfile.ZipFile(source) as z, sqlite3.connect(path) as db:
            db.executescript("""
                CREATE TABLE stops(id TEXT PRIMARY KEY,name TEXT,parent TEXT,code TEXT);
                CREATE TABLE arrivals(stop TEXT,trip TEXT,seq INTEGER,t INTEGER);
                CREATE TABLE trips(id TEXT PRIMARY KEY,route TEXT,service TEXT);
                CREATE TABLE routes(id TEXT PRIMARY KEY,label TEXT,destination TEXT);
                CREATE TABLE calendar(id TEXT,start TEXT,end TEXT,days TEXT);
                CREATE TABLE exceptions(id TEXT,date TEXT,kind TEXT);
            """)
            db.executemany(
                "INSERT INTO stops VALUES(?,?,?,?)",
                (
                    (
                        s["stop_id"],
                        s["stop_name"],
                        s.get("parent_station", ""),
                        s.get("stop_code", ""),
                    )
                    for s in records(z, "stops")
                ),
            )
            db.executemany(
                "INSERT INTO routes VALUES(?,?,?)",
                (
                    (
                        r["route_id"],
                        r["route_short_name"] or r["route_id"],
                        r["route_long_name"],
                    )
                    for r in records(z, "routes")
                ),
            )
            freq = (
                {r["trip_id"] for r in records(z, "frequencies")}
                if "frequencies.txt" in z.namelist()
                else set()
            )
            db.executemany(
                "INSERT INTO trips VALUES(?,?,?)",
                (
                    (r["trip_id"], r["route_id"], r["service_id"])
                    for r in records(z, "trips")
                    if r["trip_id"] not in freq
                ),
            )
            if "calendar.txt" in z.namelist():
                days = (
                    "monday tuesday wednesday thursday friday saturday sunday".split()
                )
                db.executemany(
                    "INSERT INTO calendar VALUES(?,?,?,?)",
                    (
                        (
                            r["service_id"],
                            r["start_date"],
                            r["end_date"],
                            "".join(r[d] for d in days),
                        )
                        for r in records(z, "calendar")
                    ),
                )
            if "calendar_dates.txt" in z.namelist():
                db.executemany(
                    "INSERT INTO exceptions VALUES(?,?,?)",
                    (
                        (r["service_id"], r["date"], r["exception_type"])
                        for r in records(z, "calendar_dates")
                    ),
                )
            db.executemany(
                "INSERT INTO arrivals VALUES(?,?,?,?)",
                (
                    (
                        r["stop_id"],
                        r["trip_id"],
                        int(r["stop_sequence"]),
                        seconds(r["arrival_time"]),
                    )
                    for r in records(z, "stop_times")
                    if r["arrival_time"]
                    and r.get("pickup_type") != "1"
                    and r["trip_id"] not in freq
                ),
            )
            db.execute("CREATE INDEX arrivals_by_stop ON arrivals(stop,t)")
        os.replace(path, target)
    finally:
        Path(path).unlink(missing_ok=True)


if __name__ == "__main__":
    city = sys.argv[1] if len(sys.argv) > 1 else "bogota"
    cfg = CITIES[city]
    target = ROOT / (city + ".sqlite")
    if len(sys.argv) > 2:
        build(sys.argv[2], target)
    else:
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "gtfs.zip"
            urllib.request.urlretrieve(cfg["schedule"], source)
            build(source, target)
    print(target)
