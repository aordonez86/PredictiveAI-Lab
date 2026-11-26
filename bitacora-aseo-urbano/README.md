# Bitácora de Aseo Urbano

An independent, offline decision-support prototype for a possible Bogotá sanitation pilot. A supervisor can review a cleanup episode, distinguish scheduled service from extra trips, inspect gaps in seven-day follow-up and calculate how many avoided extra trips would cover the cost of prevention. The Spanish interface opens with five fictional points. The demo uses synthetic records and has no operator affiliation.

## Run in 30 seconds

Open **index.html** directly in a modern browser. All scripts, styles and example records are embedded. Choose DEMO-03 to see why a scheduled cleanup interrupts follow-up. Change the cost per trip from COP 80,000 to COP 60,000 to move the illustrative threshold from three to four trips. Expand the final panel to import a JSON file, edit records, or restore the example. Edits live in the tab until refresh. Keep original records separately.

## Reproduce

Use Python 3.12 and Node.js 24. From this project directory run:

```sh
python3 build.py
node --test tests/model.test.js
```

The build uses standard libraries and produces a single index.html with no network requests. The pure functions in src/model.js validate records and calculate indicators. src/ui.js renders outputs as text. examples/demo.json is the editable input. src/page.html holds layout and styles. CI rebuilds the artifact and checks it against the committed copy.

For the optional end-to-end check, install Playwright in a Python virtual environment, then run:

```sh
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
python tests/browser.py
```

On systems with a browser installed, set CHROMIUM_PATH to its executable. To serve the app locally use `python3 -m http.server 8000 --bind 127.0.0.1` and visit localhost:8000. For static hosting, serve only the generated index.html. Never commit internal logs.

## Measured fixture results

At the synthetic cutoff of 20 November 2026, four points have reached day seven. Two have usable observations at that instant and one contains waste. Observed prevalence is 1/2. Across all four eligible points the missing-data bounds are 1/4 to 3/4. These are logical bounds, not statistical confidence intervals. DEMO-01 has one extraordinary dispatch. The break-even calculation measures a requirement, not savings achieved.

Read [the data contract and pilot protocol](docs/method.md) for assumptions, exact timing, limitations, sources and replication. The software license is pending maintainer selection. Source publications remain under their respective owners’ terms.
