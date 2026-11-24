import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { z } from "zod";
import { latestByStation, normalize, type Observation } from "../lib/model";

const source = "https://www.datos.gov.co/d/he3q-86dn";
const rowSchema = z.object({
  anio_precio: z.coerce.number().int().min(2000).max(2100),
  mes_precio: z.coerce.number().int().min(1).max(12),
  municipio_eds: z.string().min(1),
  nombre_comercial_eds: z.string().min(1),
  precio_promedio_publicado: z.coerce.number().finite().positive(),
  tipo_combustible: z.literal("GNCV"),
  codigo_municipio_dane: z.string().regex(/^\d{5}$/),
});
export function parseGncv(raw: unknown): Observation[] {
  if (!Array.isArray(raw)) throw new Error("Invalid GNCV payload");
  return raw.flatMap((item) => {
    const parsed = rowSchema.safeParse(item);
    if (!parsed.success) return [];
    const r = parsed.data;
    return [
      {
        id:
          "gncv-" +
          r.codigo_municipio_dane +
          "-" +
          normalize(r.nombre_comercial_eds),
        name: r.nombre_comercial_eds,
        address: "Dirección no publicada",
        city: r.municipio_eds,
        cityCode: r.codigo_municipio_dane,
        brand: "",
        fuel: "gncv" as const,
        price: r.precio_promedio_publicado,
        date: r.anio_precio + "-" + String(r.mes_precio).padStart(2, "0"),
        kind: "monthly" as const,
        source,
      },
    ];
  });
}
let observations: Observation[] | undefined;
export function getGncvStations(cityCode: string) {
  if (!observations) {
    const bytes = readFileSync(
      join(process.cwd(), "data", "colombia-gncv-2026.json.gz"),
    );
    observations = parseGncv(JSON.parse(gunzipSync(bytes).toString("utf8")));
  }
  const cityRows = observations.filter((r) => r.cityCode === cityCode);
  const period = cityRows.reduce((max, r) => (r.date > max ? r.date : max), "");
  return {
    stations: latestByStation(cityRows.filter((r) => r.date === period)),
    warnings: [
      "Fuente oficial GNCV: promedio mensual por estación; no es precio en tiempo real.",
      "Último mes disponible para el municipio: " + (period || "sin registros"),
      "Copia consultada el 24/11/2026. Noviembre puede estar incompleto.",
      "Las coordenadas de la fuente representan municipios, no estaciones; no se utilizan para calcular distancias.",
    ],
  };
}
