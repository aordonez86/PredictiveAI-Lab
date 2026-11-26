"use strict";
const DAY = 86400000;
const clean = "limpio", waste = "residuos", unknown = "desconocido";
const dispatch = "extraordinaria";
const visitTypes = ["inspeccion", "programada", dispatch];
function instant(value) {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value))
    throw Error("Use fechas UTC con segundos (AAAA-MM-DDThh:mm:ssZ).");
  const ms = Date.parse(value);
  if (!Number.isFinite(ms) || new Date(ms).toISOString().replace(".000Z", "Z") !== value)
    throw Error("Fecha de calendario inválida.");
  return ms;
}
function requireLabel(value, name) {
  if (typeof value !== "string" || !value.trim() || value.length > 120)
    throw Error("Revise el campo " + name + " (1–120 caracteres).");
}
function analyze(data) {
  if (!data || data.version !== 1 || !["sintetico", "operativo"].includes(data.origen))
    throw Error("Se requieren version 1 y origen sintetico u operativo.");
  const cutoff = instant(data.corte);
  if (!Array.isArray(data.casos) || data.casos.length > 1000) throw Error("Máximo 1000 casos.");
  const ids = new Set();
  const rows = data.casos.map(c => {
    requireLabel(c?.punto, "punto");
    if (ids.has(c.punto)) throw Error("Se admite un episodio por punto en cada lote.");
    ids.add(c.punto);
    requireLabel(c.fuente, "fuente del cierre limpio");
    const start = instant(c.cierre);
    if (start > cutoff || !Array.isArray(c.visitas) || c.visitas.length > 500)
      throw Error("Revise el cierre y la lista de visitas.");
    let previous = start, lastClean = start, active = true, interval = null, interrupted = false;
    let daySeven = null, extra = 0;
    for (const v of c.visitas) {
      const time = instant(v.hora);
      if (time <= previous || time > cutoff) throw Error("Las visitas deben ser posteriores, únicas, ordenadas y anteriores o iguales al corte.");
      previous = time;
      if (!visitTypes.includes(v.tipo) || ![clean, waste, unknown].includes(v.antes))
        throw Error("Tipo de visita o estado previo desconocido.");
      requireLabel(v.fuente, "fuente de visita");
      if (v.tipo === dispatch) extra++;
      if (!active) continue;
      if (time === start + 7 * DAY && v.antes !== unknown) daySeven = v.antes;
      if (!interval && v.antes === waste) interval = [lastClean, time];
      if (v.antes === clean) lastClean = time;
      if (v.tipo !== "inspeccion") {
        interrupted = !interval;
        active = false;
      }
    }
    return {id:c.punto, start, interval, interrupted, daySeven, extra,
      eligible:cutoff >= start + 7 * DAY, visits:c.visitas, source:c.fuente};
  });
  const eligible = rows.filter(r => r.eligible);
  const n = eligible.length, seen = eligible.filter(r => r.daySeven !== null).length;
  const positive = eligible.filter(r => r.daySeven === waste).length;
  return {rows, n, seen, positive, bounds:n ? [positive/n, (positive+n-seen)/n] : null};
}
function breakEven(prevention, inspection, trip) {
  const costs = [prevention, inspection, trip];
  if (!costs.every(x => Number.isSafeInteger(x) && x >= 0 && x <= 1e12) || trip === 0)
    throw Error("Ingrese costos enteros en COP entre 0 y un billón y un costo por despacho mayor que cero.");
  return Math.ceil((prevention + inspection) / trip);
}
if (typeof module !== "undefined") module.exports = {analyze, breakEven, instant, DAY};
