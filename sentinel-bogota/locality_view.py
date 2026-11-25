"""Historical survey visualization at administrative locality scale."""
import csv
import html
import json
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = "https://bibliotecadigital.ccb.org.co/items/6bfdcdc8-8641-48ef-ac20-6e6fe6030f04"
GEOMETRY = "https://datosabiertos.bogota.gov.co/dataset/localidad-bogota-d-c"

def key(name):
    return "".join(c for c in unicodedata.normalize("NFD", name.upper()) if not unicodedata.combining(c)).strip()

def load_localities():
    with (ROOT / "data/locality_perception.csv").open(encoding="utf-8") as stream:
        records = {}
        for row in csv.DictReader(stream):
            k = key(row["locality"])
            if k in records:
                raise ValueError("Duplicate locality")
            values = {year: float(row[year]) if row[year] else None for year in ("2024", "2025")}
            if any(v is not None and not 0 <= v <= 100 for v in values.values()):
                raise ValueError("Invalid survey value")
            records[k] = {"name":row["locality"], **values}
    return records

def render():
    records = load_localities()
    shapes = json.loads((ROOT / "data/localities.json").read_text())
    points = [p for f in shapes for r in f["rings"] for p in r]
    minx,maxx = min(p[0] for p in points),max(p[0] for p in points)
    miny,maxy = min(p[1] for p in points),max(p[1] for p in points)
    scale = min(480/(maxx-minx),700/(maxy-miny))
    def point(p):
        return f"{20+(p[0]-minx)*scale:.2f},{20+(maxy-p[1])*scale:.2f}"
    paths=[]
    for shape in shapes:
        k=key(shape["name"])
        if k == "CANDELARIA":
            k = "LA CANDELARIA"
        if k not in records:
            raise ValueError("Unmatched locality: "+k)
        d=" ".join("M"+" L".join(point(p) for p in ring)+" Z" for ring in shape["rings"])
        paths.append(f'<path d="{d}" data-locality="{html.escape(k)}" tabindex="0" role="button" fill="#1c272c" stroke="#0b1114" stroke-width="1.2"><title>{html.escape(records[k]["name"])}</title></path>')
    options="".join(f'<option value="{html.escape(k)}">{html.escape(v["name"])}</option>' for k,v in sorted(records.items()))
    payload=json.dumps(records,ensure_ascii=False).replace("</","<\\/")
    return f"""

<h2 id="territorio">Percepción por localidad</h2>
<section><p>Porcentaje de encuestados que consideran seguro su barrio, según la localidad donde residen. Encuesta CCB 2024 y 2025. Selecciona dos localidades para comparar sus resultados históricos.</p>
<div class="territory-grid"><div><label class="control">Año del mapa<select id="map-year"><option>2025</option><option>2024</option></select></label>
<div class="map-shell"><svg viewBox="0 0 {40+(maxx-minx)*scale:.1f} {40+(maxy-miny)*scale:.1f}" xmlns="http://www.w3.org/2000/svg" aria-label="Mapa de localidades de Bogotá, percepción histórica" fill-rule="evenodd">{''.join(paths)}</svg></div>
<div class="legend"><span style="background:#263c47">0–24%</span><span style="background:#426273">25–49%</span><span style="background:#759a9c">50–74%</span><span style="background:#b4d1c7;color:#10191c">75–100%</span><span style="background:#1c272c">Sin dato</span></div><p class="subtle">Límites administrativos: SDP / Datos Abiertos Bogotá, CC BY 4.0. Geometría simplificada. Escala fija entre años.</p></div>
<div><label class="control">Localidad A<select id="locality-a">{options}</select></label><label class="control">Localidad B<select id="locality-b">{options}</select></label><div id="territory-comparison" class="comparison" aria-live="polite"></div><p id="territory-difference" aria-live="polite"></p>
<h3>Consulta de barrio</h3><label class="control">Barrio que deseas consultar<input id="neighborhood" placeholder="Escribe el nombre del barrio"></label><p id="neighborhood-status" class="subtle" aria-live="polite">Los datos de la encuesta están desagregados por localidad. No hay una estimación verificable por barrio.</p>
<p class="subtle">El mapa representa una opinión encuestada de 2024–2025, con datos agregados; no mide la probabilidad de un incidente ni la seguridad de una dirección concreta. Sumapaz aparece sin dato en esta tabla comparativa.</p>
<p><a href="{SOURCE}">Informe CCB por localidad, EPV 2025</a> · <a href="{GEOMETRY}">Fuente de límites administrativos</a></p></div></div>
</section>
<script>
const localityData={payload};
const year=document.getElementById("map-year"), a=document.getElementById("locality-a"), b=document.getElementById("locality-b");
a.value="USAQUEN";b.value="SUBA";
const color=v=>v===null?"#1c272c":v<25?"#263c47":v<50?"#426273":v<75?"#759a9c":"#b4d1c7";
const fmt=v=>v===null?"Sin dato":v.toLocaleString("es-CO",{{minimumFractionDigits:1,maximumFractionDigits:1}})+"%";
function updateTerritory(){{
 document.querySelectorAll("path[data-locality]").forEach(p=>{{const r=localityData[p.dataset.locality];p.setAttribute("fill",color(r[year.value]));p.querySelector("title").textContent=r.name+" · "+fmt(r[year.value]);}});
 const target=document.getElementById("territory-comparison");target.replaceChildren();
 for(const key of [a.value,b.value]){{const r=localityData[key];const card=document.createElement("article");const title=document.createElement("h3");title.textContent=r.name;const value=document.createElement("strong");value.textContent=fmt(r[year.value]);const detail=document.createElement("p");detail.textContent="2024: "+fmt(r["2024"])+" · 2025: "+fmt(r["2025"]);card.append(title,value,detail);target.append(card);}}
 const x=localityData[a.value][year.value], y=localityData[b.value][year.value];document.getElementById("territory-difference").textContent=x===null||y===null?"Comparación no disponible.":"Diferencia A − B: "+(x-y).toFixed(1)+" puntos porcentuales.";
}}
for(const item of [year,a,b])item.addEventListener("change",updateTerritory);
document.querySelectorAll("path[data-locality]").forEach(p=>{{const choose=()=>{{a.value=p.dataset.locality;updateTerritory();}};p.addEventListener("click",choose);p.addEventListener("keydown",e=>{{if(e.key==="Enter"||e.key===" "){{e.preventDefault();choose();}}}});}});
document.getElementById("neighborhood").addEventListener("input",e=>{{document.getElementById("neighborhood-status").textContent=e.target.value?"Sin indicador de encuesta verificable para "+e.target.value+". Consulta el dato agregado de su localidad cuando conozcas su ubicación administrativa.":"No hay estimación verificable por barrio.";}});updateTerritory();
</script>"""
