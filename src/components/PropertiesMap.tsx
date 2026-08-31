import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Rectangle, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Property } from '@/lib/data';
import Link from 'next/link';
import Image from 'next/image';
import L from 'leaflet';

// Create custom glowing price marker
const createPriceIcon = (price: number) => {
  const formattedPrice = price >= 1000000 
    ? `$${(price / 1000000).toFixed(1)}M` 
    : `$${(price / 1000).toFixed(0)}k`;

  return L.divIcon({
    className: 'custom-price-marker',
    html: `
      <div class="relative flex flex-col items-center justify-end w-[60px] h-[50px] transform transition-transform hover:scale-110">
        <div class="bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-md border border-white/20 whitespace-nowrap mb-0.5 z-10 relative">
          ${formattedPrice}
        </div>
        <div class="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
          <div class="absolute w-5 h-5 bg-[#2ec440] opacity-30 rounded-full"></div>
          <div class="relative w-2 h-2 bg-[#2ec440] rounded-full shadow-sm"></div>
        </div>
      </div>
    `,
    iconSize: [60, 50],
    iconAnchor: [30, 40],
    popupAnchor: [0, -40]
  });
};

// Marker for a click-to-search point
const createPointIcon = () =>
  L.divIcon({
    className: 'custom-point-marker',
    html: `<div class="w-4 h-4 rounded-full bg-[#2ec440] border-2 border-white shadow-md"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

// Wraps a control so clicks/scrolls inside it never reach the underlying Leaflet map.
// (React's synthetic onClick fires too late to stop Leaflet's own native container
// listener, which is attached directly via addEventListener — this uses Leaflet's
// own DomEvent utility, which is the mechanism its built-in controls rely on.)
function MapOverlayControl({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      L.DomEvent.disableClickPropagation(ref.current);
      L.DomEvent.disableScrollPropagation(ref.current);
    }
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}

// Component to dynamically fit bounds when properties change
function MapUpdater({ properties, viewMode, disableAutoPan }: { properties: Property[], viewMode?: 'map' | 'grid', disableAutoPan?: boolean }) {
  const map = useMap();
  
  useEffect(() => {
    if (viewMode === 'map') {
      setTimeout(() => {
        map.invalidateSize();
      }, 50);
    }
  }, [viewMode, map]);

  useEffect(() => {
    if (properties.length > 0 && viewMode === 'map' && !disableAutoPan) {
      const validProps = properties.filter(p => p.lat && p.lng);
      if (validProps.length > 0) {
        const bounds = L.latLngBounds(validProps.map(p => [p.lat!, p.lng!]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [properties, map, viewMode, disableAutoPan]);
  
  return null;
}

// Handles Map drawing, panning, and click-to-search filters
function MapInteractions({
  mode, setMode, drawnBounds, setDrawnBounds, onBoundingBoxChange,
  pointCenter, setPointCenter, radiusKm, setRadiusKm, onPointSearchChange,
}: any) {
  const map = useMap();
  const [startPt, setStartPt] = useState<L.LatLng | null>(null);
  const [endPt, setEndPt] = useState<L.LatLng | null>(null);

  const modeRef = React.useRef(mode);
  const startPtRef = React.useRef(startPt);
  const endPtRef = React.useRef(endPt);
  const radiusKmRef = React.useRef(radiusKm);
  const onBoundingBoxChangeRef = React.useRef(onBoundingBoxChange);
  const onPointSearchChangeRef = React.useRef(onPointSearchChange);

  React.useEffect(() => { modeRef.current = mode; }, [mode]);
  React.useEffect(() => { startPtRef.current = startPt; }, [startPt]);
  React.useEffect(() => { endPtRef.current = endPt; }, [endPt]);
  React.useEffect(() => { radiusKmRef.current = radiusKm; }, [radiusKm]);
  React.useEffect(() => { onBoundingBoxChangeRef.current = onBoundingBoxChange; }, [onBoundingBoxChange]);
  React.useEffect(() => { onPointSearchChangeRef.current = onPointSearchChange; }, [onPointSearchChange]);

  React.useEffect(() => {
    const notifyBounds = (b: L.LatLngBounds | null) => {
      if (!b) {
        if (onBoundingBoxChangeRef.current) onBoundingBoxChangeRef.current(null);
      } else {
        if (onBoundingBoxChangeRef.current) onBoundingBoxChangeRef.current({
          minLat: b.getSouth(), maxLat: b.getNorth(), minLng: b.getWest(), maxLng: b.getEast()
        });
      }
    };

    const handleMoveEnd = () => {
      if (modeRef.current === 'pan') {
        notifyBounds(map.getBounds());
      }
    };

    const handleMouseDown = (e: any) => {
      if (modeRef.current === 'draw') {
        setStartPt(e.latlng);
        setEndPt(e.latlng);
        setDrawnBounds(null);
        notifyBounds(null);
      }
    };

    const handleMouseMove = (e: any) => {
      if (modeRef.current === 'draw' && startPtRef.current) {
        setEndPt(e.latlng);
      }
    };

    const handleMouseUp = () => {
      if (modeRef.current === 'draw' && startPtRef.current && endPtRef.current) {
        const b = L.latLngBounds(startPtRef.current, endPtRef.current);
        setDrawnBounds(b);
        setStartPt(null);
        setEndPt(null);
        setMode('none');
        notifyBounds(b);
      }
    };

    const handleClick = (e: any) => {
      // A plain click on the map background (not while drawing or panning-search,
      // and not on a marker/popup/control — those stop propagation before this fires)
      // drops a search point right where the user clicked.
      if (modeRef.current === 'none') {
        setPointCenter(e.latlng);
        setDrawnBounds(null);
        notifyBounds(null);
        if (onPointSearchChangeRef.current) {
          onPointSearchChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng, radiusKm: radiusKmRef.current });
        }
      }
    };

    map.on('moveend', handleMoveEnd);
    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);
    map.on('click', handleClick);

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
      map.off('click', handleClick);
    };
  }, [map, setDrawnBounds, setMode, setPointCenter]);

  // Keep the point search in sync if the radius changes after a point is dropped
  React.useEffect(() => {
    if (pointCenter && onPointSearchChange) {
      onPointSearchChange({ lat: pointCenter.lat, lng: pointCenter.lng, radiusKm });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointCenter, radiusKm]);

  const notifyBoundsImmediate = (b: L.LatLngBounds | null) => {
    if (!b) {
      if (onBoundingBoxChange) onBoundingBoxChange(null);
    } else {
      if (onBoundingBoxChange) onBoundingBoxChange({
        minLat: b.getSouth(), maxLat: b.getNorth(), minLng: b.getWest(), maxLng: b.getEast()
      });
    }
  };

  const clearPointSearch = () => {
    setPointCenter(null);
    if (onPointSearchChange) onPointSearchChange(null);
  };

  useEffect(() => {
    if (mode === 'draw') {
      map.getContainer().style.cursor = 'crosshair';
      map.dragging.disable();
    } else {
      map.getContainer().style.cursor = '';
      map.dragging.enable();
    }
  }, [mode, map]);

  return (
    <>
      {/* Search as I move */}
      <MapOverlayControl className="absolute top-4 left-1/2 -translate-x-1/2 z-[400]">
        <label className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md cursor-pointer border border-slate-100 hover:bg-slate-50 transition-colors">
          <input
            type="checkbox"
            checked={mode === 'pan'}
            onChange={(e) => {
              if (e.target.checked) {
                setMode('pan');
                setDrawnBounds(null);
                clearPointSearch();
                notifyBoundsImmediate(map.getBounds());
              } else {
                setMode('none');
                notifyBoundsImmediate(null);
              }
            }}
            className="accent-[#2ec440] w-4 h-4 cursor-pointer"
          />
          <span className="text-[13px] font-bold text-slate-700 whitespace-nowrap">Search as I move map</span>
        </label>
      </MapOverlayControl>

      {/* Hint + radius selector for click-to-search */}
      <MapOverlayControl className="absolute top-16 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 bg-white px-3 py-2 rounded-full shadow-md border border-slate-100">
        {pointCenter ? (
          <>
            <span className="text-[12px] font-bold text-slate-700">Within</span>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="text-[12px] font-bold text-[#2ec440] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={1}>1 km</option>
              <option value={3}>3 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
            </select>
            <button onClick={clearPointSearch} className="text-slate-400 hover:text-red-500 transition-colors ml-1" title="Clear location search">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </>
        ) : (
          <span className="text-[12px] font-bold text-slate-500 whitespace-nowrap">Click anywhere on the map to search that area</span>
        )}
      </MapOverlayControl>

      {/* Draw Button */}
      <MapOverlayControl className="absolute top-28 left-4 z-[400] flex flex-col gap-2">
        <button
          onClick={() => {
            if (mode === 'draw') {
              setMode('none');
            } else {
              setMode('draw');
              setDrawnBounds(null);
              clearPointSearch();
              notifyBoundsImmediate(null);
            }
          }}
          className={`w-[42px] h-[42px] rounded-full shadow-md flex items-center justify-center transition-all ${mode === 'draw' ? 'bg-[#2ec440] text-white' : 'bg-white text-slate-700 hover:text-slate-900'}`}
          title="Draw Area"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
        </button>
        {drawnBounds && mode !== 'draw' && (
          <button
            onClick={() => {
              setDrawnBounds(null);
              notifyBoundsImmediate(null);
            }}
            className="w-[42px] h-[42px] bg-white text-red-500 rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition-all"
            title="Clear Area"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        )}
      </MapOverlayControl>

      {/* Drawing visuals */}
      {startPt && endPt && mode === 'draw' && (
        <Rectangle bounds={L.latLngBounds(startPt, endPt)} pathOptions={{ color: '#2ec440', weight: 2, fillOpacity: 0.2 }} />
      )}
      {drawnBounds && (
        <Rectangle bounds={drawnBounds} pathOptions={{ color: '#2ec440', weight: 2, fillOpacity: 0.1 }} />
      )}

      {/* Point-search visuals */}
      {pointCenter && (
        <>
          <Circle center={pointCenter} radius={radiusKm * 1000} pathOptions={{ color: '#2ec440', weight: 2, fillOpacity: 0.12 }} />
          <Marker position={pointCenter} icon={createPointIcon()} />
        </>
      )}
    </>
  );
}

// Custom UI Controls
function CustomMapControls() {
  const map = useMap();
  return (
    <>
      {/* Top Left: Expand */}
      <MapOverlayControl className="absolute top-4 left-4 z-[400]">
        <button
          onClick={() => {
            const el = document.getElementById('map-container');
            if (el) {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                el.requestFullscreen();
              }
            }
          }}
          className="w-[42px] h-[42px] bg-white rounded-full shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 hover:scale-105 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path></svg>
        </button>
      </MapOverlayControl>

      {/* Top Right: Layers */}
      <MapOverlayControl className="absolute top-4 right-4 z-[400]">
        <button className="w-[42px] h-[42px] bg-white rounded-full shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 hover:scale-105 transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
        </button>
      </MapOverlayControl>

      {/* Bottom Right: Locate & Zoom */}
      <MapOverlayControl className="absolute bottom-6 right-4 z-[400] flex flex-col gap-3">
        <button 
          onClick={() => {
            map.locate().on("locationfound", function (e) {
              map.flyTo(e.latlng, map.getZoom());
            });
          }}
          className="w-[42px] h-[42px] bg-white rounded-full shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 hover:scale-105 transition-all"
        >
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><circle cx="12" cy="12" r="3"></circle><circle cx="12" cy="12" r="7"></circle><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3M12 19v3M2 12h3M19 12h3"></path></svg>
        </button>
        <div className="bg-white rounded-[24px] shadow-md flex flex-col overflow-hidden w-[42px]">
          <button onClick={() => map.zoomIn()} className="w-[42px] h-[42px] flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"></path></svg>
          </button>
          <button onClick={() => map.zoomOut()} className="w-[42px] h-[42px] flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14"></path></svg>
          </button>
        </div>
      </MapOverlayControl>
    </>
  );
}

interface PropertiesMapProps {
  properties: Property[];
  viewMode?: 'map' | 'grid';
  onBoundingBoxChange?: (bbox: any) => void;
  onPointSearchChange?: (point: { lat: number; lng: number; radiusKm: number } | null) => void;
}

export default function PropertiesMap({ properties, viewMode = 'map', onBoundingBoxChange, onPointSearchChange }: PropertiesMapProps) {
  const [mounted, setMounted] = useState(false);
  const [mapId, setMapId] = useState(0);

  // Interaction states
  const [interactionMode, setInteractionMode] = useState<'none' | 'pan' | 'draw'>('none');
  const [drawnBounds, setDrawnBounds] = useState<L.LatLngBounds | null>(null);
  const [pointCenter, setPointCenter] = useState<L.LatLng | null>(null);
  const [radiusKm, setRadiusKm] = useState(3);

  useEffect(() => {
    setMounted(true);
    setMapId(prev => prev + 1);
    return () => setMounted(false);
  }, []);

  // Default to Kigali center
  const defaultCenter: [number, number] = [-1.9578, 30.0626];
  const validProperties = properties.filter(p => p.lat !== undefined && p.lng !== undefined);

  if (!mounted) {
    return <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl"></div>;
  }

  return (
    <div id="map-container" className="w-full h-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 z-0 relative bg-[#f2f4f1]">
      <MapContainer 
        key={mapId}
        center={defaultCenter} 
        zoom={12} 
        scrollWheelZoom={true} 
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapUpdater properties={properties} viewMode={viewMode} disableAutoPan={interactionMode !== 'none' || drawnBounds !== null || pointCenter !== null} />
        <CustomMapControls />
        <MapInteractions
          mode={interactionMode}
          setMode={setInteractionMode}
          drawnBounds={drawnBounds}
          setDrawnBounds={setDrawnBounds}
          onBoundingBoxChange={onBoundingBoxChange}
          pointCenter={pointCenter}
          setPointCenter={setPointCenter}
          radiusKm={radiusKm}
          setRadiusKm={setRadiusKm}
          onPointSearchChange={onPointSearchChange}
        />

        {validProperties.map((property) => (
          <Marker 
            key={property.id} 
            position={[property.lat!, property.lng!]}
            icon={createPriceIcon(property.price)}
          >
            <Popup className="property-popup">
              <Link href={`/properties/${property.id}`} className="block w-[340px] no-underline shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-2xl bg-white p-3 hover:-translate-y-1 transition-transform">
                <div className="flex gap-4">
                  {/* Left: Image */}
                  <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0">
                    <Image 
                      src={property.imageUrl} 
                      alt={property.title} 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                  
                  {/* Right: Info */}
                  <div className="flex flex-col justify-center flex-1 py-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#2ec440]"></div>
                        <span className="text-[11px] font-bold text-[#2ec440] capitalize">For {property.type}</span>
                      </div>
                      <button className="w-7 h-7 bg-white border border-slate-100 rounded-full flex items-center justify-center text-gray-400 hover:text-[#2ec440] hover:border-[#2ec440]/30 shadow-sm transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                      </button>
                    </div>
                    
                    <div className="font-black text-slate-900 text-[18px] tracking-tight mb-2">${property.price.toLocaleString()}</div>
                    
                    <div className="flex items-center gap-2 text-slate-600 text-[11px] font-bold mb-1 w-full overflow-hidden">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        {property.bedrooms} bed
                      </div>
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        {property.bathrooms} bath
                      </div>
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                        {property.sqm} sqft
                      </div>
                    </div>
                    
                    <div className="text-[11px] text-slate-400 font-medium truncate mt-1">{property.location}, {property.city}</div>
                  </div>
                </div>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          padding: 0;
          background: transparent;
          box-shadow: none;
        }
        .leaflet-popup-content {
          margin: 0;
          width: 340px !important;
        }
        .leaflet-popup-tip-container {
          display: none;
        }
        /* Hide default leaflet controls if any leak through */
        .leaflet-control-zoom {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
