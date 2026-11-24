import { describe, expect, it } from "vitest";
import {
  distanceKm,
  estimateCost,
  fuelType,
  freshness,
  latestByStation,
  type Observation,
} from "../lib/model";
const station: Observation = {
  id: "A",
  name: "A",
  address: "A",
  city: "Bogotá",
  cityCode: "11001",
  brand: "",
  fuel: "corriente",
  price: 10000,
  date: "2022-02",
  kind: "monthly",
  source: "test",
};
describe("decision model", () => {
  it("calculates purchase and travel separately", () => {
    expect(
      estimateCost({
        quantity: 10,
        price: 15000,
        extraKm: 4,
        kmPerGallon: 40,
        referencePrice: 16000,
      }),
    ).toEqual({ purchase: 150000, travel: 1600, total: 151600 });
  });
  it("rejects zero consumption and negative values", () => {
    expect(() =>
      estimateCost({
        quantity: 10,
        price: 15000,
        extraKm: 4,
        kmPerGallon: 0,
        referencePrice: 16000,
      }),
    ).toThrow();
    expect(() =>
      estimateCost({
        quantity: 10,
        price: 15000,
        extraKm: -1,
        kmPerGallon: 40,
        referencePrice: 16000,
      }),
    ).toThrow();
  });
  it("measures geodesic distance and rejects invalid coordinates", () => {
    expect(distanceKm({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(
      111.195,
      2,
    );
    expect(() =>
      distanceKm({ lat: 200, lon: 0 }, { lat: 0, lon: 0 }),
    ).toThrow();
  });
});
describe("historical records", () => {
  it("retains only the latest comparable observation", () => {
    expect(
      latestByStation([
        station,
        { ...station, date: "2022-03", price: 11000 },
      ])[0].price,
    ).toBe(11000);
  });
  it("excludes conflicting same-date prices", () => {
    expect(latestByStation([station, { ...station, price: 12000 }])).toEqual(
      [],
    );
  });
  it("does not mix fuel grades or monthly and individual records", () => {
    expect(
      latestByStation([
        station,
        { ...station, fuel: "extra" },
        { ...station, kind: "reported" },
      ]),
    ).toHaveLength(3);
    expect(fuelType("GASOLINA CORRIENTE OXIGENADA")).toBe("corriente");
    expect(fuelType("BIODIESEL EXTRA")).toBe("biodiesel");
    expect(fuelType("GNCV")).toBeUndefined();
  });
  it("labels historical averages and simulated data distinctly", () => {
    expect(freshness(station)).toBe("Promedio histórico");
    expect(freshness({ ...station, kind: "demo" })).toBe("Demostración");
    expect(
      freshness(
        { ...station, kind: "reported", date: "2022-02-01" },
        new Date("2026-11-24"),
      ),
    ).toBe("Registro histórico");
  });
});
