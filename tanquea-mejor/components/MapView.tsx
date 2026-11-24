"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { unitForFuel, type Observation, type Point } from "../lib/model";
export default function MapView({
  stations,
  origin,
}: {
  stations: Observation[];
  origin?: Point;
}) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current);
    const points: L.LatLngTuple[] = [];
    for (const s of stations) {
      if (!s.point) continue;
      const point: L.LatLngTuple = [s.point.lat, s.point.lon];
      points.push(point);
      const tooltip = document.createElement("span");
      tooltip.textContent =
        s.name +
        " · $" +
        s.price.toLocaleString("es-CO") +
        " / " +
        unitForFuel(s.fuel);
      L.circleMarker(point, {
        radius: 7,
        color: "#173b35",
        fillColor: "#b9df6a",
        fillOpacity: 1,
      })
        .bindTooltip(tooltip)
        .addTo(map);
    }
    if (origin) {
      const p: L.LatLngTuple = [origin.lat, origin.lon];
      points.push(p);
      L.circleMarker(p, { radius: 8, color: "#1a66cc" })
        .bindTooltip("Tu ubicación")
        .addTo(map);
    }
    if (points.length)
      map.fitBounds(points, { padding: [25, 25], maxZoom: 15 });
    else map.setView([4.65, -74.08], 11);
    const tileUrl = process.env.NEXT_PUBLIC_TILE_URL;
    if (tileUrl)
      L.tileLayer(tileUrl, {
        attribution:
          process.env.NEXT_PUBLIC_TILE_ATTRIBUTION ?? "Proveedor de mapa",
        maxZoom: 19,
      }).addTo(map);
    return () => {
      map.remove();
    };
  }, [stations, origin]);
  return (
    <div
      ref={container}
      className="map"
      aria-label="Mapa de coordenadas disponibles"
      role="region"
    />
  );
}
