// The map pictures (tiles) every map on the site draws on. One place, so changing provider never means editing the maps.
//
// The default is OpenStreetMap's own tile server: free and needs no key, but it is run by volunteers and asks sites to keep their use
// modest (https://operations.osmfoundation.org/policies/tiles/). The site is allowed to use it as long as it shows the credit
// below and the browser sends the site's address as the referrer, which Leaflet does for the layers that use TILE_OPTIONS.
//
// To use a provider with a key (MapTiler, Mapbox, Stadia Maps, Thunderforest, Geoapify...), set these when building the frontend:
//   NEXT_PUBLIC_MAP_TILE_URL=https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=YOUR_KEY
//   NEXT_PUBLIC_MAP_ATTRIBUTION=&copy; MapTiler &copy; OpenStreetMap contributors
// The key is public in the browser by design, so restrict it to the site's domain in the provider's dashboard.

export const MAP_TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const MAP_ATTRIBUTION = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Props for every TileLayer. The referrer is sent so the tile server can see which site the map is on. */
export const TILE_OPTIONS = {
  url: MAP_TILE_URL,
  attribution: MAP_ATTRIBUTION,
  maxZoom: 19,
  referrerPolicy: "origin",
} as const;
