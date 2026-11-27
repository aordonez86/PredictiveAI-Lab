# Andén al Paso

Choose a Bogotá bus route by code or destination, filter its boarding stops by name or code, and see the next 90 minutes of service. Passengers can report a delay, crowding at the stop, a full vehicle or an obstructed access.

**Try it without installation.** Download [muestra.html](muestra.html) and open it in a browser. Select B74 toward Portal Norte, pick a stop and submit a practice observation. This single file contains a small dated extract of real boarding stops. Practice reports last only in the current tab. The connected edition below supports the full imported network, live-feed queries and shared reports.

## Run locally

Use Python 3.12 with time-zone data, Node 22+ for the simulation tests, and about 2 GB of free working space for the Bogotá schedule import. From this directory:

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
python prepare.py bogota
python service.py
```

Open http://127.0.0.1:8765. To use an agency ZIP already downloaded, run `python prepare.py bogota /path/to/GTFS.zip`. Re-run preparation to refresh the timetable. The importer atomically replaces the indexed SQLite file. After upgrading from the earlier stop-only edition, import the schedule again to build the route-to-stop index. To regenerate the offline edition, run `python sample.py muestra.html YYYY-MM-DD` with the actual import date.

## Data and predictions

[TRANSMILENIO S.A. open data portal](https://gtfs.transmilenio.gov.co/) provides the Bogotá schedule and realtime feed. See [the operator announcement](https://www.transmilenio.gov.co/comunicaciones/noticias-de-transmilenio/especiales-transmilenio/datos-abiertos-tiempo-real-transmilenio-conecta-operacion-sistema-tecnologia-ciudad) and [GTFS Realtime reference](https://gtfs.org/documentation/realtime/reference/). The [municipal catalog](https://datosabiertos.bogota.gov.co/dataset/especificacion-gtfs-general-transport-feed-specification-sitp) identifies the schedule license as [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The offline extract selects and reorganizes route and boarding-stop records from TRANSMILENIO S.A. under the same license. Review each operator’s reuse terms before redistribution. Software license pending maintainer selection.

Calendar exceptions, station children and previous service-day times past midnight are supported. The board joins trip ID and service date. A full snapshot is cached per city for 30 seconds per process. A 180-second freshness rule applies to feed and trip timestamps (using the header if the trip timestamp is absent). Known fresh cancellations and skipped stops are suppressed. Explicit stop arrival epochs or delays take precedence. A trip-level delay is applied only when there are no stop updates. Each row is labeled scheduled or estimated. With unavailable or stale updates the board uses the static timetable. A scheduled row cannot guarantee actual operation or space on board.

The first release omits frequency-only services, added trips, inferred downstream delay propagation and predictions lacking a compatible scheduled trip and service date. It searches scheduled candidates within two hours either side of the display window, returns at most 60 upcoming rows, and does not estimate ETAs from vehicle positions. Direction labels currently use the route long name. There is no journey planner or vehicle map.

## Waiting-time experiment

For repeated headways h and uniformly timed passenger arrivals, expected wait is sum(h²)/(2 sum(h)). The wait CDF is sum(min(w,h))/sum(h). Bisection yields the 90th percentile. The independent Monte Carlo comparison samples 20,000 passengers with seed 42. With 10/10-minute headways, mean wait is 5 minutes and P90 is 9. With 2/18-minute headways the mean is 8.2 and P90 is 16. Corresponding sampled means are 4.980 and 8.159 minutes. This synthetic experiment assumes all passengers board the next vehicle, and does not measure Bogotá passenger outcomes.

## Verification and extension

```sh
python -m unittest discover -s tests
node --test tests/wait.test.js
```

On 27 November 2026 we imported 8,336 stop records from the official ZIP, decoded a full snapshot with 78,167 trip updates and zero stop-time updates, and exercised the HTTP search and board with Portal Suba (ID 3000). The response returned the configured cap of 60 entries. Coverage and freshness vary with the feed.

To add another compatible network, add its label, attribution, IANA timezone and authorized HTTPS schedule and trip-update URLs to cities.json, run prepare.py with its key and restart the server. Client requests select only registered cities. The tests exercise a second synthetic network with an overnight service and calendar exception. Bogotá is the only real network verified. For multiple production instances, share a feed poller/cache, schedule imports, monitor feed age and serve behind a production HTTP server. The bundled server is for local evaluation.


## Community observations and API

A signed anonymous browser cookie identifies repeat observations during its 30-minute lifetime. Reports are scoped to city, route ID and boarding stop ID. Each browser contributes one observation per category and selection, with up to 12 active observations. Counts represent browser observations, not verified passengers. Each observation expires individually. A transaction removes expired rows on the next read or write. No account, free text or location permission is required. The demo server does not log request paths. Clearing cookies or restarting the server can bypass repeat-vote protection. Before operating a public service, add gateway rate limits, HTTPS, moderation operations and a scheduled purge.

| Method | Endpoint | Parameters or JSON body |
|---|---|---|
| GET | /api/routes | city |
| GET | /api/route-stops | city, route |
| GET | /api/board | city, stop, optional route |
| GET | /api/alerts | city, route, stop |
| POST | /api/alerts | city, route, stop, kind |

## Regional coverage reviewed on 2026-11-27

| Network | Published evidence | Integration decision |
|---|---|---|
| Bogotá, Colombia | [TransMilenio GTFS](https://gtfs.transmilenio.gov.co/) | Enabled. The imported file yielded 1,062 route IDs with boarding stops and 65,391 distinct route/stop pairs. |
| Cali, Colombia | [Metro Cali open data](https://indicadores-y-metas-del-pdm-2020-2023-metrocali.hub.arcgis.com/) and [2025 schedule service](https://services9.arcgis.com/8rJ42n9yWry0I4K4/arcgis/rest/services/GTFS/FeatureServer) | Best next pilot. Validate calendar coverage and map ArcGIS variants, runs and stops before enabling departure times. |
| Medellín, Colombia | [Municipal transport observatory](https://www.medellin.gov.co/es/secretaria-de-movilidad/observatorio-de-movilidad/componente-de-transporte-publico/) | Route information identified. Reusable stop-level predictions remain unverified. |
| Cuenca, Ecuador | Municipal [routes](https://cuencaendatos.cuenca.gob.ec/es/dataset/rutas-de-transporte-publico) (March 2025) and [stops](https://cuencaendatos.cuenca.gob.ec/es/dataset/paradas-de-transporte-publico) (April 2025) | Suitable for a dated directory after verifying identifiers and reuse terms. Timetables and operating updates remain unverified. |
| Panama City and San Miguelito, Panama | [MiBus operator announcement](https://www.mibus.com.pa/noticia/mibus-maps-panama/) | The operator offers real-time locations and arrivals in its own app. An authorized reusable feed for this project remains unverified. |
