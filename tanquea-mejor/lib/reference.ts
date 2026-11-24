import type { Fuel } from "./model";

export const cregSource =
  "https://gestornormativo.creg.gov.co/gestor/entorno/docs/originales/Circular_CREG_371_2026/Circular_CREG_371_2026.pdf";
export const upmeSource =
  "https://www.upme.gov.co/simec/hidrocarburos/combustibles-liquidos/informacion-de-precios-mensuales-en-estaciones-de-servicio/";
export const daneSource =
  "https://www.dane.gov.co/files/operaciones/IPC/oct2026/bol-IPC-oct2026.pdf";

// Circular 371 de 2026, anexo de las trece ciudades principales, COP/galón.
const prices: Record<string, readonly [number, number]> = {
  "11001": [16331, 11616],
  "05001": [16251, 11641],
  "76001": [16339, 11763],
  "08001": [15964, 11291],
  "13001": [15921, 11256],
  "23001": [16171, 11506],
  "68001": [16089, 11364],
  "50001": [16431, 11716],
  "66001": [16276, 11703],
  "17001": [16304, 11688],
  "73001": [16245, 11607],
  "52001": [13920, 10529],
  "54001": [14281, 9486],
};
export function cityReference(city: string, fuel: Fuel) {
  const row = prices[city];
  if (!row || (fuel !== "corriente" && fuel !== "diesel")) return undefined;
  return {
    price: row[fuel === "corriente" ? 0 : 1],
    validFrom: "2026-11-01",
    source: cregSource,
  };
}

export type QuoteInput = {
  quantity: number;
  baseline: number;
  candidate: number;
  extraKm: number;
  efficiency: number;
  travelPrice: number;
};
export function compareQuotes(input: QuoteInput) {
  const { quantity, baseline, candidate, extraKm, efficiency, travelPrice } =
    input;
  if (
    ![quantity, baseline, candidate, extraKm, efficiency, travelPrice].every(
      Number.isFinite,
    ) ||
    quantity <= 0 ||
    baseline <= 0 ||
    candidate <= 0 ||
    extraKm < 0 ||
    efficiency <= 0 ||
    travelPrice <= 0
  )
    throw new Error("Invalid quote");
  const grossSavings = quantity * (baseline - candidate);
  const travelCost = (extraKm / efficiency) * travelPrice;
  return {
    grossSavings,
    travelCost,
    netSavings: grossSavings - travelCost,
    maxExtraKm: Math.max(0, (grossSavings * efficiency) / travelPrice),
  };
}
