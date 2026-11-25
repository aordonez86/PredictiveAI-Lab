"""Build a self-contained dashboard of verified citywide indicators."""
from __future__ import annotations

import csv
import html
import math
from datetime import date
from pathlib import Path
from locality_view import render
from trends import render_trends

ROOT = Path(__file__).resolve().parent
SOURCES = {
    "CCB": "https://www.ccb.org.co/de-interes/comunicados/bogota-mejoro-en-indicadores-de-victimizacion-y-percepcion-de-seguridad-en-2025",
    "SDSCJ": "https://bogota.gov.co/mi-ciudad/seguridad/2026-10/en-bogota-varios-delitos-siguen-disminuyendo-lea-y-conozca-cuales-son",
}

def load_indicators(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as stream:
        rows = list(csv.DictReader(stream))
    seen = set()
    for row in rows:
        start = date.fromisoformat(row["period_start"] + "-01")
        end = date.fromisoformat(row["period_end"] + "-01")
        published = date.fromisoformat(row["published"])
        key = tuple(row[k] for k in ("indicator", "period_start", "period_end", "source"))
        value = float(row["value"])
        if key in seen or start > end or end > published or not math.isfinite(value):
            raise ValueError(f"Invalid or duplicate observation: {key}")
        if row["source"] not in SOURCES or row["unit"] not in {"percent", "relative_change"}:
            raise ValueError("Unknown source or unit")
        if row["unit"] == "percent" and not 0 <= value <= 100:
            raise ValueError("Invalid survey percentage")
        if row["unit"] == "relative_change" and (value < -100 or not row["comparison"]):
            raise ValueError("Invalid relative change")
        row["value"] = value
        seen.add(key)
    return rows

def survey_changes(rows: list[dict]) -> list[tuple[str, float, float, float]]:
    result = []
    indicators = sorted({r["indicator"] for r in rows if r["unit"] == "percent"})
    for indicator in indicators:
        subset = [r for r in rows if r["indicator"] == indicator and r["unit"] == "percent"]
        by_year = {r["period_start"]: r for r in subset if r["period_end"] == r["period_start"][:4] + "-12"}
        if "2024-01" in by_year and "2025-01" in by_year:
            a, b = by_year["2024-01"]["value"], by_year["2025-01"]["value"]
            result.append((indicator, a, b, round(b-a, 2)))
    return result

def build(rows: list[dict]) -> str:
    esc = html.escape
    cards = "".join(f'<article><h3>{esc(indicator)}</h3><p class="number">{b:.1f}%</p><p>2024: {a:.1f}% · Cambio: {delta:+.1f} pp</p><div class="track"><span style="width:{b}%"></span></div></article>' for indicator,a,b,delta in survey_changes(rows))
    changes = "".join(f'<tr><td>{esc(r["indicator"])}</td><td>{r["value"]:+g}%</td><td>{esc(r["period_start"])} – {esc(r["period_end"])}</td></tr>' for r in rows if r["unit"] == "relative_change")
    return f"""<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sentinel Bogotá</title><style>{(ROOT / "dashboard.css").read_text(encoding="utf-8")}</style><main>
<header><div><h1>Sentinel Bogotá</h1><p>Observatorio de seguridad ciudadana</p></div><div class="date">FUENTES CONSULTADAS<br>25 NOV 2026</div></header><nav aria-label="Secciones"><a href="#territorio">Territorio</a><a href="#resumen">Indicadores</a><a href="#series">Series</a><a href="#metodo">Metodología</a></nav>
{render()}
<h2 id="resumen">Encuesta de percepción y victimización</h2><div class="cards">{cards}</div><p>Fuente: <a href="{SOURCES["CCB"]}">CCB, encuesta 2025 (publicada el 17/02/2026)</a>. Las diferencias se expresan en puntos porcentuales. La cobertura de 2025 incorporó Sumapaz.</p>
<h2>Variación de delitos registrados en toda Bogotá</h2><section class="table-wrap"><table><thead><tr><th>Indicador</th><th>Cambio relativo</th><th>Periodo</th></tr></thead><tbody>{changes}</tbody></table><p>Comparación enero–septiembre de 2026 frente a los mismos meses de 2025. Fuente: <a href="{SOURCES["SDSCJ"]}">SDSCJ / Portal Bogotá, 15/10/2026</a>.</p></section>
{render_trends()}
<h2 id="metodo">Cómo interpretar los indicadores</h2><section><p>Las denuncias y las estimaciones de encuestas reflejan fenómenos de medición distintos. Las variaciones publicadas no demuestran causalidad. Los datos pueden revisarse; las cifras de periodos diferentes requieren comparabilidad documentada.</p><p>Los intervalos de confianza y las tasas poblacionales requieren denominadores y documentación estadística adicional.</p></section><footer>Sentinel Bogotá · Proyecto 002 · MVP 0.3.0</footer></main></html>"""

if __name__ == "__main__":
    rows = load_indicators(ROOT / "data" / "indicators.csv")
    output = ROOT / "dist" / "index.html"
    output.parent.mkdir(exist_ok=True)
    output.write_text(build(rows), encoding="utf-8")
    print(f"{len(rows)} observations validated. Report: {output}")
