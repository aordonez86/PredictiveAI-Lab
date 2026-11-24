export type Fuel = "corriente" | "extra" | "diesel" | "biodiesel";
export type Point = { lat: number; lon: number };
export type Observation = {
  id: string;
  name: string;
  address: string;
  city: string;
  cityCode: string;
  brand: string;
  fuel: Fuel;
  price: number;
  date: string;
  kind: "monthly" | "reported" | "demo";
  source: string;
  point?: Point;
  locationSource?: string;
};
export const fuels: Record<Fuel, string> = {
  corriente: "Gasolina corriente",
  extra: "Gasolina extra",
  diesel: "Diésel",
  biodiesel: "Biodiésel extra",
};
export function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}
export function fuelType(product: string): Fuel | undefined {
  const name = normalize(product);
  if (
    [
      "GASOLINACORRIENTE",
      "GASOLINACORRIENTEOXIGENADA",
      "GASOLINAMOTORCORRIENTE",
    ].includes(name)
  )
    return "corriente";
  if (
    ["GASOLINAEXTRA", "GASOLINAEXTRAOXIGENADA", "GASOLINAMOTOREXTRA"].includes(
      name,
    )
  )
    return "extra";
  if (["ACPMDIESEL", "ACPM", "DIESEL"].includes(name)) return "diesel";
  if (name === "BIODIESELEXTRA") return "biodiesel";
}
export function validPoint(p: Point) {
  return (
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lon) &&
    Math.abs(p.lat) <= 90 &&
    Math.abs(p.lon) <= 180
  );
}
export function distanceKm(a: Point, b: Point) {
  if (!validPoint(a) || !validPoint(b)) throw new Error("Invalid coordinates");
  const rad = Math.PI / 180;
  const v =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) *
      Math.cos(b.lat * rad) *
      Math.sin(((b.lon - a.lon) * rad) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, v)));
}
export function latestByStation(rows: Observation[]) {
  const result = new Map<string, Observation>();
  const conflicting = new Set<string>();
  for (const row of rows) {
    const key = [row.id, row.fuel, row.kind].join("|");
    const old = result.get(key);
    if (!old || row.date > old.date) {
      result.set(key, row);
      conflicting.delete(key);
    } else if (row.date === old.date && row.price !== old.price)
      conflicting.add(key);
  }
  return [...result]
    .filter(([key]) => !conflicting.has(key))
    .map(([, row]) => row);
}
export function daysOld(date: string, now = new Date()) {
  const value = Date.parse(date);
  return Number.isFinite(value) && value <= now.getTime()
    ? Math.floor((now.getTime() - value) / 86400000)
    : null;
}
export function freshness(row: Observation, now = new Date()) {
  if (row.kind === "demo") return "Demostración";
  if (row.kind === "monthly") return "Promedio histórico";
  const age = daysOld(row.date, now);
  return age === null
    ? "Fecha inválida"
    : age <= 7
      ? "Registro reciente"
      : "Registro histórico";
}
export type CostInput = {
  quantity: number;
  price: number;
  extraKm: number;
  kmPerGallon: number;
  referencePrice: number;
};
export function estimateCost(input: CostInput) {
  const { quantity, price, extraKm, kmPerGallon, referencePrice } = input;
  if (
    ![quantity, price, extraKm, kmPerGallon, referencePrice].every(
      Number.isFinite,
    ) ||
    quantity <= 0 ||
    price <= 0 ||
    extraKm < 0 ||
    kmPerGallon <= 0 ||
    referencePrice <= 0
  )
    throw new Error("Invalid cost inputs");
  const purchase = quantity * price,
    travel = (extraKm / kmPerGallon) * referencePrice;
  return { purchase, travel, total: purchase + travel };
}
