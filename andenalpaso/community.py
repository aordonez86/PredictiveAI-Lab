"""Anonymous service observations scoped to a route and boarding stop."""
from contextlib import closing
import sqlite3

KINDS = {"Demora", "Bus lleno", "Acceso obstruido", "Paradero congestionado"}
TTL = 1800


def reports(path, route, stop, now, kind=None, voter=None):
    with closing(sqlite3.connect(path)) as db, db:
        db.execute("""CREATE TABLE IF NOT EXISTS votes (
            route TEXT, stop TEXT, kind TEXT, voter TEXT, at INTEGER,
            PRIMARY KEY(route, stop, kind, voter))""")
        db.execute("BEGIN IMMEDIATE")
        db.execute("DELETE FROM votes WHERE at <= ?", (now-TTL,))
        if kind is not None:
            if kind not in KINDS or not voter:
                raise ValueError
            existing = db.execute("SELECT 1 FROM votes WHERE route=? AND stop=? AND kind=? AND voter=?",
                                  (route,stop,kind,voter)).fetchone()
            if not existing:
                if db.execute("SELECT count(*) FROM votes WHERE voter=?", (voter,)).fetchone()[0] >= 12:
                    raise OverflowError
                db.execute("INSERT INTO votes VALUES(?,?,?,?,?)", (route,stop,kind,voter,now))
        return [dict(kind=k,count=n,expires=t+TTL) for k,n,t in db.execute(
            """SELECT kind,count(*),max(at) FROM votes WHERE route=? AND stop=?
               GROUP BY kind ORDER BY max(at) DESC,kind""", (route,stop))]
