import { describe, expect, it } from "vitest";
import { cityReference, compareQuotes } from "../lib/reference";
import { unitForFuel } from "../lib/model";
import { getGncvStations, parseGncv } from "../providers/gncv";
import { GET } from "../app/api/stations/route";

describe("2026 official sources", () => {
  it("uses the official November reference without mixing units", () => {
    expect(cityReference("11001", "corriente")?.price).toBe(16331);
    expect(cityReference("76001", "diesel")?.price).toBe(11763);
    expect(cityReference("11001", "extra")).toBeUndefined();
    expect(cityReference("11001", "gncv")).toBeUndefined();
    expect(unitForFuel("gncv")).toBe("m³");
    expect(unitForFuel("corriente")).toBe("galón");
  });
  it("does not pretend historical liquid prices are current", async () => {
    const response = await GET(
      new Request(
        "https://local/api/stations?city=11001&fuel=corriente&kind=current",
      ),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).stations).toEqual([]);
  });
  it("selects only the latest official GNCV period and discards municipal coordinates", () => {
    const result = getGncvStations("11001");
    expect(result.stations.length).toBeGreaterThan(0);
    expect(
      result.stations.every(
        (s) =>
          s.fuel === "gncv" && s.date === "2026-11" && s.point === undefined,
      ),
    ).toBe(true);
    expect(parseGncv([{ precio_promedio_publicado: -1 }])).toEqual([]);
  });
  it("isolates GNCV from the liquid archive", async () => {
    const response = await GET(
      new Request(
        "https://local/api/stations?city=11001&fuel=gncv&kind=current",
      ),
    );
    const result = await response.json();
    expect(result.stations.length).toBeGreaterThan(0);
    expect(
      result.stations.every((r: { fuel: string }) => r.fuel === "gncv"),
    ).toBe(true);
  });
});
describe("current quote model", () => {
  it("computes the monetary savings and break-even additional distance", () => {
    const result = compareQuotes({
      quantity: 10,
      baseline: 16331,
      candidate: 15831,
      extraKm: 5,
      efficiency: 40,
      travelPrice: 16000,
    });
    expect(result).toEqual({
      grossSavings: 5000,
      travelCost: 2000,
      netSavings: 3000,
      maxExtraKm: 12.5,
    });
  });
  it("rejects invalid and negative inputs", () => {
    expect(() =>
      compareQuotes({
        quantity: 0,
        baseline: 16000,
        candidate: 15100,
        extraKm: 3,
        efficiency: 40,
        travelPrice: 16000,
      }),
    ).toThrow();
    expect(() =>
      compareQuotes({
        quantity: 10,
        baseline: 16000,
        candidate: 15100,
        extraKm: -3,
        efficiency: 40,
        travelPrice: 16000,
      }),
    ).toThrow();
  });
  it("never suggests additional travel when the alternative is more expensive", () => {
    expect(
      compareQuotes({
        quantity: 10,
        baseline: 16000,
        candidate: 16200,
        extraKm: 0,
        efficiency: 40,
        travelPrice: 16000,
      }).maxExtraKm,
    ).toBe(0);
  });
});

import {
  parseAuthorizedLiquids,
  selectCurrentLiquids,
} from "../providers/authorized-liquids";
describe("authorized liquid observations", () => {
  const valid = {
    stationId: "test-1",
    name: "Estación de prueba",
    address: "Prueba",
    city: "Bogotá",
    cityCode: "11001",
    fuel: "corriente",
    unit: "galón",
    price: 16000,
    date: "2026-10-01",
    kind: "reported",
    source: "https://sicom.gov.co",
  };
  it("validates identity, unit and official source before selecting a period", () => {
    const rows = parseAuthorizedLiquids([
      valid,
      { ...valid, stationId: "old", date: "2022-02-01" },
      { ...valid, stationId: "other", date: "2026-09-01" },
    ]);
    expect(
      selectCurrentLiquids(rows, "11001", "corriente", 2026).map((x) => x.id),
    ).toEqual(["test-1"]);
    expect(() => parseAuthorizedLiquids([{ ...valid, unit: "m³" }])).toThrow();
    expect(() =>
      parseAuthorizedLiquids([{ ...valid, source: "https://example.com" }]),
    ).toThrow();
    expect(() =>
      parseAuthorizedLiquids([{ ...valid, point: { lat: 4.6, lon: -74 } }]),
    ).toThrow();
  });
});
