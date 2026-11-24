import { z } from "zod";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import monthlySnapshot from "../data/colombia-monthly-2022.json";
import {
  fuelType,
  latestByStation,
  normalize,
  validPoint,
  type Fuel,
  type Observation,
} from "../lib/model";

const monthlyUrl = "https://www.datos.gov.co/d/gjy9-tpph";
const reportedUrl = "https://www.datos.gov.co/d/x6id-4v3g";
const geoUrl =
  "https://geo.upme.gov.co/server/rest/services/Capas_Hidrocarburos/estaciones_servicio/FeatureServer/6";
const price = z.coerce.number().finite().positive();
const monthlySchema = z.object({
  periodo: z.coerce.number().int().min(1900).max(2100),
  mes: z.coerce.number().int().min(1).max(12),
  codigo_municipio: z.coerce.string(),
  municipio: z.string(),
  nombre_comercial: z.string().min(1),
  bandera: z.string().optional(),
  direccion: z.string().min(1),
  producto: z.string(),
  precio: price,
});
const reportedSchema = z.object({
  municipiocodigo: z.string(),
  municipionombre: z.string(),
  agente: z.string().min(1),
  bandera: z.string().optional(),
  direccion: z.string().min(1),
  producto: z.string(),
  precio: price,
  fecharegistro: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
});
const id = (city: string, name: string, address: string) =>
  [city, normalize(name), normalize(address)].join("-");
export interface FuelDataProvider {
  getStations(
    cityCode: string,
    fuel: Fuel,
    kind: "monthly" | "reported",
  ): Promise<{ stations: Observation[]; warnings: string[] }>;
  getMetadata(): { country: string; currency: string; unit: string };
}
async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error("Fuente no disponible");
  return response.json();
}
export function parseMonthly(raw: unknown): Observation[] {
  if (!Array.isArray(raw)) throw new Error("Invalid monthly payload");
  return raw.flatMap((item) => {
    const parsed = monthlySchema.safeParse(item);
    if (!parsed.success) return [];
    const r = parsed.data,
      fuel = fuelType(r.producto);
    if (!fuel) return [];
    return [
      {
        id: id(r.codigo_municipio, r.nombre_comercial, r.direccion),
        name: r.nombre_comercial,
        address: r.direccion,
        city: r.municipio,
        cityCode: r.codigo_municipio,
        brand: r.bandera ?? "",
        fuel,
        price: r.precio,
        date: `${r.periodo}-${String(r.mes).padStart(2, "0")}`,
        kind: "monthly" as const,
        source: monthlyUrl,
      },
    ];
  });
}
export function parseReported(raw: unknown): Observation[] {
  if (!Array.isArray(raw)) throw new Error("Invalid reported payload");
  return raw.flatMap((item) => {
    const parsed = reportedSchema.safeParse(item);
    if (!parsed.success) return [];
    const r = parsed.data,
      fuel = fuelType(r.producto);
    if (!fuel) return [];
    const date = r.fecharegistro.slice(0, 10);
    if (
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date
    )
      return [];
    return [
      {
        id: id(r.municipiocodigo, r.agente, r.direccion),
        name: r.agente,
        address: r.direccion,
        city: r.municipionombre,
        cityCode: r.municipiocodigo,
        brand: r.bandera ?? "",
        fuel,
        price: r.precio,
        date,
        kind: "reported" as const,
        source: reportedUrl,
      },
    ];
  });
}
const geoSchema = z.object({
  features: z.array(
    z.object({
      attributes: z.object({
        nombre: z.string(),
        direccion: z.string(),
        cod_mpio: z.string(),
        ano_fuente: z.string().nullable().optional(),
      }),
      geometry: z.object({ x: z.number(), y: z.number() }),
    }),
  ),
  exceededTransferLimit: z.boolean().optional(),
});
async function enrich(stations: Observation[], cityCode: string) {
  const params = new URLSearchParams({
    where: `cod_mpio='${cityCode}'`,
    outFields: "nombre,direccion,cod_mpio,ano_fuente",
    outSR: "4326",
    f: "json",
    resultRecordCount: "2000",
  });
  const data = geoSchema.parse(await getJson(`${geoUrl}/query?${params}`));
  if (data.exceededTransferLimit)
    throw new Error("Cobertura geográfica parcial");
  const matches = new Map<string, typeof data.features>();
  for (const feature of data.features) {
    const a = feature.attributes,
      key = id(a.cod_mpio, a.nombre, a.direccion);
    matches.set(key, [...(matches.get(key) ?? []), feature]);
  }
  return stations.map((station) => {
    const candidates = matches.get(station.id);
    if (candidates?.length !== 1) return station;
    const f = candidates[0],
      point = { lat: f.geometry.y, lon: f.geometry.x };
    return validPoint(point)
      ? {
          ...station,
          point,
          locationSource: `UPME, año ${f.attributes.ano_fuente ?? "sin dato"}`,
        }
      : station;
  });
}
let nationalRows: Observation[] | undefined;
function reportedRows(): Observation[] {
  if (!nationalRows) {
    const bytes = readFileSync(
      join(process.cwd(), "data", "colombia-reported-2018.json.gz"),
    );
    nationalRows = parseReported(
      JSON.parse(gunzipSync(bytes).toString("utf8")),
    );
  }
  return nationalRows;
}
const monthlyRows = parseMonthly(monthlySnapshot);
export const colombiaProvider: FuelDataProvider = {
  getMetadata: () => ({ country: "CO", currency: "COP", unit: "galón" }),
  async getStations(cityCode, fuel, kind) {
    const warnings: string[] = [];
    let rows: Observation[];
    if (kind === "monthly") {
      rows = monthlyRows;
      warnings.push(
        "Copia oficial consultada el 24/11/2026. Solo contiene Bogotá, febrero de 2022.",
      );
    } else {
      rows = reportedRows();
      warnings.push(
        "Copia nacional oficial consultada el 24/11/2026; última fecha observada 13/05/2018.",
      );
    }
    let stations = latestByStation(
      rows.filter((r) => r.cityCode === cityCode && r.fuel === fuel),
    );
    if (process.env.UPME_GEOCODING === "true" && stations.length > 0) {
      try {
        stations = await enrich(stations, cityCode);
      } catch {
        warnings.push("Coordenadas UPME no disponibles.");
      }
    } else {
      warnings.push(
        "Coordenadas oficiales pendientes de autorización de reutilización; la búsqueda es municipal.",
      );
    }
    return { stations, warnings };
  },
};
