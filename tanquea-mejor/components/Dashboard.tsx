"use client";
import { useEffect, useMemo, useState } from "react";
import {
  distanceKm,
  estimateCost,
  freshness,
  fuels,
  type Fuel,
  type Observation,
  type Point,
} from "../lib/model";
import dynamic from "next/dynamic";
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <p>Cargando mapa…</p>,
});
const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
import cities from "../data/municipalities.json";
type Result = { stations: Observation[]; warnings: string[] };
export default function Dashboard() {
  const [city, setCity] = useState("11001"),
    [fuel, setFuel] = useState<Fuel>("corriente"),
    [kind, setKind] = useState("auto");
  const [result, setResult] = useState<Result>({ stations: [], warnings: [] }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [origin, setOrigin] = useState<Point>(),
    [locationMessage, setLocationMessage] = useState("");
  const [lat, setLat] = useState(""),
    [lon, setLon] = useState("");
  const [quantity, setQuantity] = useState("10"),
    [efficiency, setEfficiency] = useState(""),
    [refPrice, setRefPrice] = useState("");
  const [radius, setRadius] = useState("10"),
    [sort, setSort] = useState("price"),
    [search, setSearch] = useState("");
  const [page, setPage] = useState(1),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/stations?" + new URLSearchParams({ city, fuel, kind }), {
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setResult(data);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message || "Error de red");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [city, fuel, kind, retry]);
  function resetResults() {
    setLoading(true);
    setError("");
    setResult({ stations: [], warnings: [] });
    setPage(1);
    setSort("price");
  }
  function locate() {
    if (!navigator.geolocation) {
      setLocationMessage("Geolocalización no disponible.");
      return;
    }
    setLocationMessage("Solicitando permiso…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setOrigin({ lat: p.coords.latitude, lon: p.coords.longitude });
        setPage(1);
        setLocationMessage("Ubicación activa durante esta sesión.");
      },
      () =>
        setLocationMessage(
          "Ubicación denegada o no disponible. Usa búsqueda municipal o coordenadas manuales.",
        ),
      { timeout: 10000 },
    );
  }
  const rows = useMemo(() => {
    const q = Number(quantity),
      r = Number(efficiency),
      ref = Number(refPrice);
    return result.stations
      .filter((s) =>
        (s.name + " " + s.address + " " + s.brand)
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
      .map((station) => {
        const km =
          origin && station.point
            ? distanceKm(origin, station.point)
            : undefined;
        const cost =
          km !== undefined &&
          [q, r, ref].every(Number.isFinite) &&
          q > 0 &&
          r > 0 &&
          ref > 0
            ? estimateCost({
                quantity: q,
                price: station.price,
                extraKm: km * 2,
                kmPerGallon: r,
                referencePrice: ref,
              })
            : undefined;
        return { station, km, cost };
      })
      .filter(
        (x) =>
          x.km === undefined ||
          x.km <= Math.max(1, Math.min(100, Number(radius) || 10)),
      )
      .sort((a, b) => {
        if (sort === "distance")
          return (
            (a.km ?? Infinity) - (b.km ?? Infinity) ||
            a.station.price - b.station.price
          );
        if (sort === "total")
          return (
            (a.cost?.total ?? Infinity) - (b.cost?.total ?? Infinity) ||
            a.station.price - b.station.price
          );
        return a.station.price - b.station.price;
      });
  }, [result, origin, quantity, efficiency, refPrice, radius, sort, search]);
  const lowest = rows.reduce<(typeof rows)[number] | undefined>(
    (best, row) =>
      !best || row.station.price < best.station.price ? row : best,
    undefined,
  );
  const mapped = rows.filter((r) => r.station.point).map((r) => r.station);
  const totalReady = rows.some((r) => r.cost);
  const comparable = rows.filter((r) => r.cost && r.km !== undefined);
  const closest = comparable.reduce<(typeof rows)[number] | undefined>(
    (best, row) => (!best || row.km! < best.km! ? row : best),
    undefined,
  );
  const bestCost = comparable.reduce<(typeof rows)[number] | undefined>(
    (best, row) => (!best || row.cost!.total < best.cost!.total ? row : best),
    undefined,
  );
  return (
    <main>
      <header>
        <div className="brand">
          <span className="logo">T</span>
          <div>
            tanquea<span>mejor</span>
            <small>INTELIGENCIA DE COMBUSTIBLE</small>
          </div>
        </div>
        <div className="country">COLOMBIA · COP/GALÓN</div>
      </header>
      <section className="hero">
        <div className="eyebrow">MOVILIDAD INTELIGENTE</div>
        <h1>
          Cada galón.
          <br />
          <em>Cada kilómetro.</em>
        </h1>
        <p>
          Encuentra precios históricos de combustible y compara el costo de
          desplazarte. Consulta siempre el precio actual con la estación.
        </p>
      </section>
      <section className="panel filters" aria-label="Filtros">
        <label>
          Municipio
          <select
            value={city}
            disabled={kind === "demo"}
            onChange={(e) => {
              resetResults();
              setCity(e.target.value);
            }}
          >
            {cities.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Combustible
          <select
            value={fuel}
            onChange={(e) => {
              resetResults();
              setFuel(e.target.value as Fuel);
            }}
          >
            {Object.entries(fuels).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fuente
          <select
            value={kind}
            onChange={(e) => {
              resetResults();
              setKind(e.target.value);
              if (e.target.value === "demo") setCity("11001");
            }}
          >
            <option value="auto">Último histórico disponible</option>
            <option value="monthly">Promedio mensual · 2022</option>
            <option value="reported">Último registro · hasta 2018</option>
            <option value="demo">Demostración ficticia</option>
          </select>
        </label>
        <button onClick={locate} className="primary">
          Usar mi ubicación
        </button>
      </section>
      <div className="notice" role="status">
        <strong>
          {kind === "demo"
            ? "Modo demostración"
            : "Datos históricos · no son precios actuales"}
        </strong>
        <span>
          {kind === "auto"
            ? "Se prioriza el último promedio mensual disponible; si no hay datos, se buscan registros individuales históricos."
            : kind === "monthly"
              ? "Promedios de febrero de 2022. La cobertura comprobada es Bogotá."
              : kind === "reported"
                ? "Última observación individual disponible por estación; registros hasta mayo de 2018."
                : "Los precios y las estaciones de este modo se han simulado."}
        </span>
      </div>
      <section className="grid">
        <div>
          <div className="section-title">
            <div>
              <p className="eyebrow">RESULTADOS</p>
              <h2>{loading ? "Buscando…" : rows.length + " estaciones"}</h2>
            </div>
            <select
              aria-label="Ordenar estaciones"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="price">Menor precio histórico</option>
              <option value="distance" disabled={!origin || !mapped.length}>
                Menor distancia
              </option>
              <option value="total" disabled={!totalReady}>
                Menor costo estimado
              </option>
            </select>
          </div>
          <input
            className="search"
            aria-label="Buscar estación o dirección"
            placeholder="Buscar por estación, marca o dirección"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {error && (
            <div role="alert" className="empty">
              {error}{" "}
              <button
                onClick={() => {
                  resetResults();
                  setRetry((n) => n + 1);
                }}
              >
                Reintentar
              </button>
            </div>
          )}
          {!loading && !error && !rows.length && (
            <div className="empty">
              No hay datos comparables para estos filtros. Prueba otra ciudad o
              fuente.
            </div>
          )}
          {lowest && (
            <div className="summary">
              <span>MENOR PRECIO REGISTRADO DISPONIBLE</span>
              <strong>
                {currency.format(lowest.station.price)}
                <small> / gal</small>
              </strong>
              <p>
                {lowest.station.name} · {lowest.station.date}
              </p>
            </div>
          )}
          {bestCost && closest && (
            <div className="summary">
              <span>
                MENOR COSTO ESTIMADO ENTRE ESTACIONES GEORREFERENCIADAS
              </span>
              <strong>{currency.format(bestCost.cost!.total)}</strong>
              <p>
                {bestCost.station.name} · ahorro estimado frente a la más
                cercana:{" "}
                {currency.format(closest.cost!.total - bestCost.cost!.total)}
              </p>
            </div>
          )}
          <div className="station-list">
            {rows
              .slice((page - 1) * 12, page * 12)
              .map(({ station: s, km, cost }) => (
                <article key={s.id} className="station">
                  <div className="station-top">
                    <div>
                      <span className="tag">{freshness(s)}</span>
                      <h3>{s.name}</h3>
                      <p>
                        {s.brand || "Marca no informada"} · {s.address}
                      </p>
                    </div>
                    <div className="price">
                      {currency.format(s.price)}
                      <small>/ gal</small>
                    </div>
                  </div>
                  <div className="station-meta">
                    <span>Fecha: {s.date}</span>
                    <span>
                      {s.kind === "demo"
                        ? "Confianza: simulación"
                        : s.kind === "monthly"
                          ? "Confianza actual: baja (promedio histórico)"
                          : "Confianza actual: baja (registro histórico)"}
                    </span>
                    <span>
                      {km === undefined
                        ? "Distancia no verificada"
                        : km.toFixed(1) + " km en línea recta"}
                    </span>
                    {s.kind !== "demo" && (
                      <a href={s.source} target="_blank" rel="noreferrer">
                        Fuente oficial ↗
                      </a>
                    )}
                    {s.kind === "demo" && <span>Fuente: simulación</span>}
                  </div>
                  {cost && (
                    <div className="cost">
                      Compra {currency.format(cost.purchase)} + desplazamiento{" "}
                      {currency.format(cost.travel)} ={" "}
                      <strong>{currency.format(cost.total)}</strong>
                    </div>
                  )}
                  {s.locationSource && <small>{s.locationSource}</small>}
                  {s.kind !== "demo" && (
                    <p>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={
                          "https://www.google.com/maps/search/?api=1&query=" +
                          encodeURIComponent(
                            s.name +
                              " " +
                              s.address +
                              " " +
                              s.city +
                              " Colombia",
                          )
                        }
                      >
                        Buscar dirección en Maps ↗
                      </a>
                    </p>
                  )}
                </article>
              ))}
          </div>
          {rows.length > 12 && (
            <nav aria-label="Paginación" className="pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </button>
              <span>
                {page} / {Math.ceil(rows.length / 12)}
              </span>
              <button
                disabled={page * 12 >= rows.length}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </button>
            </nav>
          )}
        </div>
        <aside>
          <div className="panel map-panel">
            <h2>Mapa de estaciones</h2>
            {mapped.length ? (
              <MapView stations={mapped} origin={origin} />
            ) : (
              <div className="map-empty">
                <span>◎</span>
                <p>Sin coordenadas verificadas</p>
                <small>Las direcciones históricas siguen disponibles.</small>
              </div>
            )}
            <p className="muted">
              Las distancias son aproximaciones en línea recta. Las estaciones
              sin coordenadas se mantienen visibles y no se incluyen en las
              comparaciones por distancia.
            </p>
            <p role="status">{locationMessage}</p>
            <details>
              <summary>Ubicación manual</summary>
              <div className="coordinates">
                <label>
                  Latitud
                  <input
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    type="number"
                    step="any"
                  />
                </label>
                <label>
                  Longitud
                  <input
                    value={lon}
                    onChange={(e) => setLon(e.target.value)}
                    type="number"
                    step="any"
                  />
                </label>
              </div>
              <button
                onClick={() => {
                  const a = Number(lat),
                    b = Number(lon);
                  if (
                    lat &&
                    lon &&
                    Number.isFinite(a) &&
                    Number.isFinite(b) &&
                    Math.abs(a) <= 90 &&
                    Math.abs(b) <= 180
                  ) {
                    setOrigin({ lat: a, lon: b });
                    setPage(1);
                    setLocationMessage("Ubicación manual activa.");
                  } else setLocationMessage("Coordenadas inválidas.");
                }}
              >
                Aplicar
              </button>
            </details>
            {origin && (
              <button
                onClick={() => {
                  setOrigin(undefined);
                  setLocationMessage("Ubicación eliminada.");
                }}
              >
                Eliminar ubicación
              </button>
            )}
            <label>
              Radio de estaciones con coordenadas (km)
              <input
                type="number"
                min="1"
                max="100"
                value={radius}
                onChange={(e) => {
                  setRadius(e.target.value);
                  setPage(1);
                }}
              />
            </label>
          </div>
          <div className="panel vehicle">
            <h2>Mi vehículo</h2>
            <p className="muted">
              Simula el costo histórico con tus propios supuestos.
            </p>
            <label>
              Galones a comprar
              <input
                type="number"
                min="1"
                step="0.5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
            <label>
              Rendimiento (km/galón)
              <input
                type="number"
                min="1"
                placeholder="Ej. 35"
                value={efficiency}
                onChange={(e) => setEfficiency(e.target.value)}
              />
            </label>
            <label>
              Precio de referencia (COP/galón)
              <input
                type="number"
                min="1"
                placeholder="Tu precio de referencia"
                value={refPrice}
                onChange={(e) => setRefPrice(e.target.value)}
              />
            </label>
            <p className="muted">
              Costo = galones × precio + (2 × distancia / rendimiento) × precio
              de referencia. Ida y vuelta en línea recta, sin peajes ni tráfico.
            </p>
          </div>
          <div className="panel">
            <h2>Calidad de datos</h2>
            {result.warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
            <p>
              La fuente oficial respalda el registro histórico, pero no
              garantiza el precio ni disponibilidad actual.
            </p>
          </div>
        </aside>
      </section>
      <footer>
        Tanquea Mejor · Colombia · Datos históricos con atribución
      </footer>
    </main>
  );
}
