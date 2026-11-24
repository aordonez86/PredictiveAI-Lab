import { z } from "zod";
import { colombiaProvider } from "../../../providers/colombia";
import { demoStations } from "../../../providers/demo";
import { getAuthorizedLiquids } from "../../../providers/authorized-liquids";
import { getGncvStations } from "../../../providers/gncv";
const schema = z.object({
  city: z.string().regex(/^\d{5}$/),
  fuel: z.enum(["corriente", "extra", "diesel", "biodiesel", "gncv"]),
  kind: z.enum(["current", "auto", "monthly", "reported", "demo"]),
});
// Instance-wide limit protects the optional upstream provider without tracking users.
let windowStart = Date.now();
let requests = 0;
function allowRequest() {
  if (Date.now() - windowStart >= 60_000) {
    windowStart = Date.now();
    requests = 0;
  }
  requests += 1;
  return requests <= 120;
}
export async function GET(request: Request) {
  if (!allowRequest())
    return Response.json(
      { error: "Demasiadas solicitudes. Intenta más tarde." },
      {
        status: 429,
        headers: { "Retry-After": "60" },
      },
    );
  const url = new URL(request.url);
  const query = schema.safeParse(Object.fromEntries(url.searchParams));
  if (!query.success)
    return Response.json({ error: "Parámetros inválidos" }, { status: 400 });
  const { city, fuel, kind } = query.data;
  try {
    if (kind !== "demo" && fuel === "gncv")
      return Response.json(getGncvStations(city), {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    if (kind === "current")
      return Response.json(getAuthorizedLiquids(city, fuel));
    const requestedKind = kind === "auto" ? "monthly" : kind;
    let data =
      requestedKind === "demo"
        ? {
            stations: city === "11001" ? demoStations(fuel) : [],
            warnings: [
              "Simulación: estaciones, ubicaciones y precios ficticios.",
            ],
          }
        : await colombiaProvider.getStations(city, fuel, requestedKind);
    if (kind === "auto" && data.stations.length === 0) {
      data = await colombiaProvider.getStations(city, fuel, "reported");
      data.warnings.unshift(
        "Sin promedio mensual disponible: se consultaron los últimos registros individuales.",
      );
    }
    return Response.json(data, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return Response.json(
      { error: "No fue posible consultar la fuente. Intenta nuevamente." },
      { status: 503 },
    );
  }
}
