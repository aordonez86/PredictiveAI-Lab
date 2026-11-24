import { describe, expect, it } from "vitest";
import {
  parseMonthly,
  parseReported,
  colombiaProvider,
} from "../providers/colombia";
import { GET } from "../app/api/stations/route";
describe("data providers", () => {
  it("validates source schema and excludes unknown fuel", () => {
    expect(parseMonthly([{ precio: -1 }, { producto: "GNCV" }])).toEqual([]);
    expect(parseReported([{ precio: 0 }])).toEqual([]);
  });
  it("loads the verified historical snapshot", async () => {
    const result = await colombiaProvider.getStations(
      "11001",
      "corriente",
      "monthly",
    );
    expect(result.stations.length).toBe(325);
    expect(Math.min(...result.stations.map((s) => s.price))).toBe(8595);
    expect(
      result.stations.every(
        (s) => s.date === "2022-02" && s.kind === "monthly",
      ),
    ).toBe(true);
  });
  it("returns empty rather than inventing monthly prices for Cali", async () => {
    expect(
      (await colombiaProvider.getStations("76001", "corriente", "monthly"))
        .stations,
    ).toEqual([]);
  });
  it("automatically retrieves the national historical fallback for Cali", async () => {
    const response = await GET(
      new Request(
        "https://local/api/stations?city=76001&fuel=corriente&kind=auto",
      ),
    );
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.stations.length).toBeGreaterThan(0);
    expect(
      result.stations.every(
        (s: { kind: string; cityCode: string }) =>
          s.kind === "reported" && s.cityCode === "76001",
      ),
    ).toBe(true);
  });
  it("validates API input and isolates demo", async () => {
    const invalid = await GET(
      new Request(
        "https://local/api/stations?city=bad&fuel=corriente&kind=monthly",
      ),
    );
    expect(invalid.status).toBe(400);
    const demo = await GET(
      new Request(
        "https://local/api/stations?city=11001&fuel=corriente&kind=demo",
      ),
    );
    expect(
      (await demo.json()).stations.every(
        (s: { kind: string }) => s.kind === "demo",
      ),
    ).toBe(true);
  });
});
