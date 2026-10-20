"use client";

import { useEffect } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPoint } from "@/lib/analytics/api";
import { TILE_OPTIONS } from "@/lib/maps/tiles";

/** Zooms the map to where the visitors are: all of them in view, or a close-up when there is only one place. */
function FitToPoints({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lon], 5);
      return;
    }
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lon] as [number, number])), { padding: [56, 56], maxZoom: 5 });
  }, [map, points]);
  return null;
}

/** The mouse wheel scrolls the page until the map is clicked, then zooms the map until the pointer leaves it. */
function WheelZoomOnClick() {
  const map = useMap();
  useMapEvents({
    click: () => map.scrollWheelZoom.enable(),
    mouseout: () => map.scrollWheelZoom.disable(),
  });
  return null;
}

/** A world map with a dot for every place visitors came from, bigger where there were more visits. Clicking a dot opens a card with
 *  a button that narrows the report to that place. Must be loaded with next/dynamic and ssr: false, because the map library needs the
 *  browser. */
export default function VisitorMap({ points, onPick }: { points: MapPoint[]; onPick?: (point: MapPoint) => void }) {
  const max = Math.max(1, ...points.map((p) => p.visits));
  return (
    <MapContainer
      center={[10, 20]}
      zoom={2}
      minZoom={2}
      maxBounds={[
        [-85, -180],
        [85, 180],
      ]}
      maxBoundsViscosity={1}
      scrollWheelZoom={false}
      className="h-full w-full rounded-2xl"
      aria-label="Map of where visitors are"
    >
      <TileLayer {...TILE_OPTIONS} noWrap />
      <FitToPoints points={points} />
      <WheelZoomOnClick />
      {points.map((p) => {
        const label = [p.city, p.country].filter(Boolean).join(", ") || "Unknown place";
        return (
          <CircleMarker key={`${p.lat},${p.lon}`} center={[p.lat, p.lon]} radius={7 + Math.round(17 * Math.sqrt(p.visits / max))} pathOptions={{ color: "#219b31", weight: 2, fillColor: "#2ec440", fillOpacity: 0.6 }}>
            <Tooltip direction="top">{`${label}: ${p.visits}`}</Tooltip>
            <Popup>
              <p className="font-bold">{label}</p>
              <p>
                {p.visits} view{p.visits === 1 ? "" : "s"} from {p.unique} visitor{p.unique === 1 ? "" : "s"}
              </p>
              {onPick && p.code && (
                <button type="button" onClick={() => onPick(p)} className="mt-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-[#2ec440]">
                  Show these visitors
                </button>
              )}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
