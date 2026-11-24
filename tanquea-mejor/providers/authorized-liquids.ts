import { readFileSync } from "node:fs";
import { z } from "zod";
import {
  latestByStation,
  validPoint,
  type Fuel,
  type Observation,
} from "../lib/model";

const officialUrl = z.url().refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && url.hostname.endsWith(".gov.co");
});
const rowSchema = z
  .object({
    stationId: z.string().trim().min(1),
    name: z.string().trim().min(1),
    address: z.string().trim().min(1),
    city: z.string().trim().min(1),
    cityCode: z.string().regex(/^\d{5}$/),
    brand: z.string().optional(),
    fuel: z.enum(["corriente", "extra", "diesel", "biodiesel"]),
    unit: z.literal("galón"),
    price: z.number().finite().positive(),
    date: z.string(),
    kind: z.enum(["reported", "monthly"]),
    source: officialUrl,
    point: z
      .object({ lat: z.number(), lon: z.number() })
      .refine(validPoint)
      .optional(),
    locationSource: z.string().min(1).optional(),
  })
  .refine((row) => {
    if (row.point && !row.locationSource) return false;
    const format =
      row.kind === "monthly"
        ? /^\d{4}-(0[1-9]|1[0-2])$/
        : /^\d{4}-(0[1-9]|1[0-2])-\d{2}$/;
    if (!format.test(row.date)) return false;
    const full = row.kind === "monthly" ? row.date + "-01" : row.date;
    const parsed = new Date(full);
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === full &&
      parsed.getTime() <= Date.now()
    );
  });
export function parseAuthorizedLiquids(raw: unknown): Observation[] {
  return z
    .array(rowSchema)
    .parse(raw)
    .map((row) => ({
      id: row.stationId,
      name: row.name,
      address: row.address,
      city: row.city,
      cityCode: row.cityCode,
      brand: row.brand ?? "",
      fuel: row.fuel,
      price: row.price,
      date: row.date,
      kind: row.kind,
      source: row.source,
      point: row.point,
      locationSource: row.locationSource,
    }));
}
export function selectCurrentLiquids(
  rows: Observation[],
  city: string,
  fuel: Fuel,
  year = new Date().getUTCFullYear(),
) {
  const candidates = rows.filter(
    (row) =>
      row.cityCode === city &&
      row.fuel === fuel &&
      row.date.startsWith(String(year) + "-"),
  );
  const latestMonth = candidates.reduce(
    (max, row) => (row.date.slice(0, 7) > max ? row.date.slice(0, 7) : max),
    "",
  );
  const period = candidates.filter((row) => row.date.startsWith(latestMonth));
  const kind = period.some((row) => row.kind === "reported")
    ? "reported"
    : "monthly";
  return latestByStation(period.filter((row) => row.kind === kind));
}
export function getAuthorizedLiquids(city: string, fuel: Fuel) {
  const path = process.env.AUTHORIZED_LIQUID_STATIONS_FILE;
  if (!path)
    return {
      stations: [],
      warnings: [
        "Sin precios individuales líquidos de 2026 verificables para esta vista. Consulta las referencias oficiales o el archivo histórico.",
      ],
    };
  try {
    const rows = parseAuthorizedLiquids(JSON.parse(readFileSync(path, "utf8")));
    const stations = selectCurrentLiquids(rows, city, fuel);
    return {
      stations,
      warnings: [
        "Exportación oficial configurada por el operador. Se comparan registros de la última ventana mensual con datos disponibles. Confirma el precio vigente.",
      ],
    };
  } catch {
    return {
      stations: [],
      warnings: [
        "La exportación de precios líquidos configurada no pasó la validación o no está disponible.",
      ],
    };
  }
}
