"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { PlotCoordinates } from "@/lib/build/types";

const markerIcon = L.divIcon({
  className: "build-plot-marker",
  html: `<div class="w-5 h-5 rounded-full bg-[#2ec440] border-2 border-white shadow-md"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function ClickHandler({ onPick }: { onPick: (coords: PlotCoordinates) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

interface PlotMapPickerProps {
  coordinates: PlotCoordinates | null;
  onChange: (coords: PlotCoordinates) => void;
}

const KIGALI_CENTER: [number, number] = [-1.9578, 30.0626];

/**
 * Simple site-picker map for the Build brief. Reuses the project's existing
 * Leaflet setup (tiles, marker style) but intentionally skips the property
 * search controls (draw/pan-search/radius) from PropertiesMap, which don't
 * fit a single-plot picker. Callers must load this via next/dynamic with
 * `ssr: false` — Leaflet touches `window` at import time.
 */
export default function PlotMapPicker({ coordinates, onChange }: PlotMapPickerProps) {
  const center: [number, number] = coordinates ? [coordinates.lat, coordinates.lng] : KIGALI_CENTER;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 relative z-0">
      <MapContainer center={center} zoom={coordinates ? 16 : 12} scrollWheelZoom className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <ClickHandler onPick={onChange} />
        {coordinates && (
          <Marker
            position={[coordinates.lat, coordinates.lng]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const latlng = e.target.getLatLng();
                onChange({ lat: latlng.lat, lng: latlng.lng });
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
