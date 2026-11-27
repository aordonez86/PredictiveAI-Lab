# Intervalo

A stop arrival board and passenger waiting-time experiment. The Spanish interface starts in Bogotá. Search by stop name or code, choose a platform or station, and inspect arrivals for the next 90 minutes. Refresh manually or leave the visible tab open for one-minute updates. The waiting-time experiment runs independently of the transit server. This is an independent implementation.

## Run locally

Use Python 3.12 with time-zone data, Node 22+ for the simulation tests, and about 2 GB of free working space for the Bogotá schedule import. From this directory:

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
python prepare.py bogota
python service.py
```

Open http://127.0.0.1:8765. To use an agency ZIP already downloaded, run `python prepare.py bogota /path/to/GTFS.zip`. Re-run preparation to refresh the timetable. The importer atomically replaces the indexed SQLite file. For the offline experiment alone, open index.html alongside wait.js. The static hosting of these files alone does not run the transit API.

## Data and predictions

[TRANSMILENIO S.A. open data portal](https://gtfs.transmilenio.gov.co/) provides the Bogotá schedule and realtime feed. See [the operator announcement](https://www.transmilenio.gov.co/comunicaciones/noticias-de-transmilenio/especiales-transmilenio/datos-abiertos-tiempo-real-transmilenio-conecta-operacion-sistema-tecnologia-ciudad) and [GTFS Realtime reference](https://gtfs.org/documentation/realtime/reference/). Only endpoint configuration ships in this repo. Review each operator’s reuse terms before redistribution. Software license pending maintainer selection.

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
