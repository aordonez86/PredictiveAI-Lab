"use client";
import { useState } from "react";
import {
  cityReference,
  compareQuotes,
  daneSource,
  upmeSource,
} from "../lib/reference";
import { unitForFuel, type Fuel } from "../lib/model";
const format = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default function ReferencePanel({
  city,
  fuel,
}: {
  city: string;
  fuel: Fuel;
}) {
  const reference = cityReference(city, fuel);
  const unit = unitForFuel(fuel);
  const [baseline, setBaseline] = useState("");
  const [candidate, setCandidate] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [extraKm, setExtraKm] = useState("");
  const [efficiency, setEfficiency] = useState("");
  const [travelPrice, setTravelPrice] = useState("");
  const base = baseline || String(reference?.price ?? "");
  const travel = travelPrice || base;
  let result: ReturnType<typeof compareQuotes> | undefined;
  if ([base, candidate, quantity, extraKm, efficiency, travel].every(Boolean)) {
    try {
      result = compareQuotes({
        baseline: Number(base),
        candidate: Number(candidate),
        quantity: Number(quantity),
        extraKm: Number(extraKm),
        efficiency: Number(efficiency),
        travelPrice: Number(travel),
      });
    } catch {
      /* invalid inputs are not calculated */
    }
  }
  return (
    <section className="reference-grid">
      <div className="panel reference">
        <p className="eyebrow">MERCADO COLOMBIANO</p>
        <h2>Referencia oficial de precios</h2>
        {reference ? (
          <>
            <div className="reference-value">
              {format.format(reference.price)} <small>/ {unit}</small>
            </div>
            <p>Referencia CREG · vigencia desde {reference.validFrom}</p>
            <a href={reference.source} target="_blank" rel="noreferrer">
              Circular 371 de 2026 ↗
            </a>
          </>
        ) : (
          <p>
            No hay referencia CREG de noviembre para este municipio y
            combustible.
          </p>
        )}
        <p className="muted">
          Valor de referencia municipal; el precio en surtidor puede variar. No
          identifica una estación.
        </p>
        <div className="reference-links">
          <a href={upmeSource} target="_blank" rel="noreferrer">
            UPME · estadísticas por ciudad ↗
          </a>
          <a href={daneSource} target="_blank" rel="noreferrer">
            DANE · IPC de combustibles, octubre 2026 (+0,55 % mensual) ↗
          </a>
          <a
            href="https://sicom.gov.co/index.php/boletin-estadistico"
            target="_blank"
            rel="noreferrer"
          >
            SICOM · boletín estadístico oficial ↗
          </a>
        </div>
      </div>
      <div className="panel quote">
        <p className="eyebrow">DECISIÓN PERSONALIZADA</p>
        <h2>¿Vale la pena desviarse?</h2>
        <p>
          Introduce un precio confirmado y la distancia adicional total de tu
          ruta.
        </p>
        <div className="quote-inputs">
          <label>
            Precio alternativo actual (COP/{unit})
            <input
              type="number"
              min="1"
              value={candidate}
              onChange={(e) => setCandidate(e.target.value)}
              placeholder="Precio confirmado"
            />
          </label>
          <label>
            Precio habitual (COP/{unit})
            <input
              type="number"
              min="1"
              value={base}
              onChange={(e) => setBaseline(e.target.value)}
              placeholder="Precio confirmado"
            />
          </label>
          <label>
            Cantidad ({unit})
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
          <label>
            Rendimiento (km/{unit})
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={efficiency}
              onChange={(e) => setEfficiency(e.target.value)}
              placeholder="Ej. 35"
            />
          </label>
          <label>
            Distancia adicional (km)
            <input
              type="number"
              min="0"
              step="0.1"
              value={extraKm}
              onChange={(e) => setExtraKm(e.target.value)}
            />
          </label>
          <label>
            Combustible del trayecto (COP/{unit})
            <input
              type="number"
              min="1"
              value={travel}
              onChange={(e) => setTravelPrice(e.target.value)}
            />
          </label>
        </div>
        {reference && !baseline && (
          <p className="muted">
            Precio habitual inicial: referencia municipal CREG. Modifícalo por
            el precio real de tu estación.
          </p>
        )}
        {result ? (
          <div className="quote-result" role="status">
            <strong>{format.format(result.netSavings)}</strong>
            <span>ahorro neto estimado</span>
            <p>
              Ahorro bruto {format.format(result.grossSavings)} · desplazamiento{" "}
              {format.format(result.travelCost)}
            </p>
            <p>
              Desvío máximo rentable: {result.maxExtraKm.toFixed(1)} km
              adicionales.
            </p>
          </div>
        ) : (
          <p className="muted">
            Completa los seis campos con valores válidos para calcular el
            ahorro.
          </p>
        )}
      </div>
    </section>
  );
}
