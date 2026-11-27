"""Build a self-contained, offline HTML edition from the imported Bogotá feed."""
import json
import sqlite3
import sys
from datetime import date
from pathlib import Path
from prepare import ROOT


def render(target, snapshot_date):
    date.fromisoformat(snapshot_date)
    with sqlite3.connect((ROOT/"bogota.sqlite").as_uri()+"?mode=ro", uri=True) as db:
        rows = db.execute("""SELECT id,label,destination FROM routes
            WHERE label IN ('B74','B23','H15','K86','F32','D10')
            AND EXISTS(SELECT 1 FROM route_stops WHERE route=id)
            ORDER BY label,id""").fetchall()
        if not rows:
            raise ValueError("Selected route codes missing from this feed")
        stops = {r: db.execute("""SELECT id,name,code FROM stops JOIN route_stops
            ON stops.id=route_stops.stop WHERE route=? ORDER BY name,id""",(r,)).fetchall() for r,_,_ in rows}
    payload = dict(routes=rows, stops=stops, source="TransMilenio · GTFS importado "+snapshot_date+
                   " · extracto de rutas y paraderos · CC BY-SA 4.0")
    html=(ROOT/"index.html").read_text().replace("<!-- sample-data -->","<script>window.boardingSample="+
          json.dumps(payload).replace("<","\\u003c")+";</script>")
    for filename in ("wait.js","app.js"):
        html=html.replace(f'<script src="{filename}"></script>',"<script>"+(ROOT/filename).read_text()+"</script>")
    html=html.replace("</main>", """<footer><small>Extracto adaptado de
        <a href="https://datosabiertos.bogota.gov.co/dataset/especificacion-gtfs-general-transport-feed-specification-sitp">TransMilenio</a>
        bajo <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</small></footer></main>""")
    target.write_text(html)


if __name__=="__main__":
    render(Path(sys.argv[1]),sys.argv[2])
