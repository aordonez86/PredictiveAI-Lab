const el = id => document.getElementById(id);
const fmt = x => (100*x).toLocaleString("es-CO",{maximumFractionDigits:1})+" %";
const stamp = ms => new Date(ms).toISOString().replace(".000Z","Z");
let report;
function detail() {
  const r = report.rows[el("point").selectedIndex];
  el("log").replaceChildren();
  if (!r) {el("verdict").textContent="Sin episodios.";return;}
  el("verdict").textContent = r.interval ? "Primera reaparición observada entre "+stamp(r.interval[0])+" (excluido) y "+stamp(r.interval[1])+" (incluido)." :
    r.interrupted ? "Seguimiento interrumpido por otra limpieza. Duración indeterminada." : "Sin reaparición documentada hasta la última observación.";
  const entries = [stamp(r.start)+" · cierre limpio · "+r.source,
    ...r.visits.map(v=>v.hora+" · "+v.tipo+" · antes: "+v.antes+" · "+v.fuente)];
  for (const entry of entries) {const li=document.createElement("li");li.textContent=entry;el("log").append(li);}
}
function applyData(data) {
  report=analyze(data);
  el("origin").textContent=(data.origen==="sintetico"?"DEMOSTRACIÓN · datos sintéticos":"Bitácora importada · origen operativo declarado por el usuario")+" · corte "+data.corte;
  const {n,seen,positive,bounds}=report;
  el("summary").textContent=n+" puntos con siete días cumplidos · "+seen+" con estado conocido · "+positive+" con residuos observados.";
  el("bounds").textContent=bounds ? "Entre los observados: "+(seen?fmt(positive/seen):"sin observaciones")+". Entre todos los elegibles: "+fmt(bounds[0])+" a "+fmt(bounds[1])+" según el estado de los faltantes." : "El corte todavía no incluye episodios elegibles.";
  el("point").replaceChildren(...report.rows.map(r=>new Option(r.id,r.id)));
  detail();
}
function calc() {
  try {const costs=["prevention","inspection","trip"].map(id=>el(id).valueAsNumber);
    el("result").textContent=breakEven(...costs)+" despachos extraordinarios evitados cubrirían el costo adicional.";}
  catch(e){el("result").textContent=e.message;}
}
function reset(){el("editor").value=JSON.stringify(demo,null,2);applyData(demo);el("error").textContent="";el("file").value="";}
function submit(){try{if(el("editor").value.length>2000000)throw Error("Máximo 2 MB.");applyData(JSON.parse(el("editor").value));el("error").textContent="Bitácora aplicada.";}
  catch(e){el("error").textContent="Se conserva la bitácora anterior. "+e.message;}}
el("file").onchange=async()=>{try{const f=el("file").files[0];if(!f)return;if(f.size>2000000)throw Error("Máximo 2 MB.");el("editor").value=await f.text();submit();}catch(e){el("error").textContent=e.message;}};
el("apply").onclick=submit;el("reset").onclick=reset;el("point").onchange=detail;
for(const id of ["prevention","inspection","trip"])el(id).oninput=calc;
reset();calc();
