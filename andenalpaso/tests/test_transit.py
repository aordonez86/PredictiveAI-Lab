import sqlite3
import tempfile
import unittest
import zipfile
from pathlib import Path
from zoneinfo import ZoneInfo
from datetime import datetime
from google.transit import gtfs_realtime_pb2 as gtfs
from prepare import build
from service import estimate, board


class Predictions(unittest.TestCase):
    def setUp(self):
        self.u = gtfs.TripUpdate()
        self.u.trip.trip_id = "t"
        self.u.delay = 50
        self.u.timestamp = 1000

    def get(self, header=1000):
        return estimate(1100, "p", 2, self.u, header, 1000)

    def test_trip_delay(self):
        self.assertEqual(self.get(), (1150, "Estimada · viaje"))

    def test_stale_trip_or_header(self):
        self.assertEqual(self.get(700), (1100, "Programada"))
        self.u.timestamp = 600
        self.assertEqual(self.get(), (1100, "Programada"))

    def test_future_feed(self):
        self.assertEqual(self.get(1010), (1100, "Programada"))

    def test_cancelled(self):
        self.u.trip.schedule_relationship = 3
        self.assertIsNone(self.get())

    def test_stop_updates(self):
        v = self.u.stop_time_update.add(stop_sequence=2, stop_id="p")
        v.arrival.time = 1400
        self.assertEqual(self.get(), (1400, "Estimada · parada"))
        v.schedule_relationship = 1
        self.assertIsNone(self.get())
        v.schedule_relationship = 2
        self.assertEqual(self.get(), (1100, "Programada"))

    def test_calendar_and_parent(self):
        zone = ZoneInfo("America/Bogota")
        now = int(datetime(2026, 11, 28, 0, 5, tzinfo=zone).timestamp())
        tables = {
            "stops": "stop_id,stop_name,parent_station\ns,Estación,\np,Andén,s",
            "routes": "route_id,route_short_name,route_long_name\nr,R,Centro",
            "trips": "trip_id,route_id,service_id\nt,r,v",
            "stop_times": "trip_id,stop_id,stop_sequence,arrival_time\nt,p,2,24:10:00",
            "calendar_dates": "service_id,date,exception_type\nv,20261127,1",
        }
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "feed.zip"
            target = Path(tmp) / "db"
            with zipfile.ZipFile(src, "w") as z:
                for k, v in tables.items():
                    z.writestr(k + ".txt", v)
            build(src, target)
            with sqlite3.connect(target) as db:
                rows = board(db, "s", zone, (0, {}, "offline"), now)["rows"]
                self.assertEqual(board(db,"s",zone,(0,{},"offline"),now,"other")["rows"],[])
                self.assertEqual(
                    [(r["at"], r["platform"]) for r in rows], [(now + 300, "p")]
                )
                db.execute("UPDATE exceptions SET kind='2'")
                self.assertFalse(board(db, "s", zone, (0, {}, "offline"), now)["rows"])
