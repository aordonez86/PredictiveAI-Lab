import type { Fuel, Observation } from "../lib/model";
export function demoStations(fuel: Fuel): Observation[] {
  return [0, 1, 2].map((n) => ({
    id: "demo-" + n,
    name: "Estación de ejemplo " + (n + 1),
    address: "Ubicación ficticia de demostración",
    city: "Bogotá",
    cityCode: "11001",
    brand: "Demo",
    fuel,
    price: fuel === "gncv" ? 3800 - n * 100 : 16000 - n * 300,
    date: "2026-11-24",
    kind: "demo",
    source: "Datos sintéticos",
    point: { lat: 4.65 + n * 0.012, lon: -74.08 + n * 0.008 },
    locationSource: "Coordenadas ficticias",
  }));
}
