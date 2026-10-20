"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPoint } from "@/lib/analytics/api";

/** A world map with a dot for every place visitors came from, bigger where there were more visits. Must be loaded with next/dynamic
 *  and ssr: false, because the map library needs the browser. */
export default function VisitorMap({ points }: { points: MapPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.visits));
  return (
    <MapContainer center={[10, 20]} zoom={2} minZoom={2} scrollWheelZoom={false} worldCopyJump className="h-full w-full rounded-2xl" aria-label="Map of where visitors are">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      {points.map((p) => (
        <CircleMarker key={`${p.lat},${p.lon}`} center={[p.lat, p.lon]} radius={6 + Math.round(18 * Math.sqrt(p.visits / max))} pathOptions={{ color: "#219b31", weight: 1, fillColor: "#2ec440", fillOpacity: 0.55 }}>
          <Popup>
            <p className="font-bold">{[p.city, p.country].filter(Boolean).join(", ") || "Unknown place"}</p>
            <p>
              {p.visits} visit{p.visits === 1 ? "" : "s"} from {p.unique} visitor{p.unique === 1 ? "" : "s"}
            </p>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
