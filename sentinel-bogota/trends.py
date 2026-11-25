"""Citywide historical survey correlation, with no spatial prediction."""
import csv
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def load_history():
    with (ROOT / "data/city_survey_history.csv").open(encoding="utf-8") as stream:
        rows = [(int(r["year"]), float(r["victimization"]), float(r["perceived_increase"])) for r in csv.DictReader(stream)]
    if len({r[0] for r in rows}) != len(rows) or any(not 0 <= v <= 100 for r in rows for v in r[1:]):
        raise ValueError("Invalid survey history")
    return sorted(rows)

def correlation(rows):
    return statistics.correlation([r[1] for r in rows], [r[2] for r in rows])

def render_trends():
    rows = load_history()
    r = correlation(rows)
    def x(year): return 58 + (year - 2015) * 52
    def y(value): return 230 - value * 1.9
    lines = []
    for index, color in [(1, "#e6ae64"), (2, "#a7d0d2")]:
        points = " ".join(f"{x(row[0])},{y(row[index]):.2f}" for row in rows)
        lines.append(f'<polyline points="{points}" fill="none" stroke="{color}" stroke-width="2.2"/>')
        for row in rows:
            lines.append(f'<circle cx="{x(row[0])}" cy="{y(row[index]):.2f}" r="3" fill="{color}"><title>{row[0]}: {row[index]}%</title></circle>')
    grid = "".join(f'<line x1="58" y1="{y(v)}" x2="578" y2="{y(v)}" stroke="#29363d"/><text x="49" y="{y(v)+4}" text-anchor="end">{v}%</text>' for v in range(0,101,25))
    ticks = "".join(f'<text x="{x(year)}" y="251" text-anchor="middle">{year}</text>' for year in range(2015,2026,2))
    table = "".join(f'<tr><td>{year}</td><td>{v:.1f}%</td><td>{p:.1f}%</td></tr>' for year,v,p in rows)
    return f"""<h2 id="series">Series temporales</h2><section class="trend-panel"><div class="trend-top"><div><h3>Victimización y percepción</h3><p class="muted">Bogotá D.C. · EPV 2015–2025 · porcentajes</p></div><div class="correlation"><strong>{r:+.2f}</strong><small>Pearson · n={len(rows)} años</small></div></div>
<div class="chart-key"><span class="amber">■ Victimización</span><span class="cyan">■ Percibe aumento de inseguridad</span></div>
<svg class="trend-chart" viewBox="0 0 620 270" role="img" aria-label="Evolución histórica de victimización y percepción de inseguridad de 2015 a 2025" xmlns="http://www.w3.org/2000/svg">{grid}{ticks}{''.join(lines)}</svg>
<p class="muted">Asociación descriptiva de dos series de la misma encuesta. Once observaciones anuales, posible autocorrelación y cambios de cobertura. No permite inferir causalidad ni predecir hechos.</p>
<details><summary>Ver datos y fuente</summary><div class="table-wrap"><table><thead><tr><th>Año</th><th>Victimización</th><th>Percibe aumento</th></tr></thead><tbody>{table}</tbody></table></div><p><a href="https://bibliotecadigital.ccb.org.co/items/6bfdcdc8-8641-48ef-ac20-6e6fe6030f04">CCB · Encuesta de Percepción y Victimización 2025</a></p></details></section>"""
