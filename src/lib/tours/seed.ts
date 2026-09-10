import type { TourStore, TourRecord } from "./types";

import { mockProperties } from "@/lib/data";

export function seedToursIfEmpty(store: TourStore): TourStore {
  let modified = false;

  const generateMockTour = (propertyId: string): TourRecord => ({
    id: `tour_mock_${propertyId}`,
    propertyId,
    status: "ready",
    phase: "ready",
    spzUrl: "/test-splat.spz",
    panoUrl: `/api/tours/asset?propertyId=${propertyId}&file=panorama.jpg`, // use valid local asset logic or fallback
    thumbnailUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop",
    providerMode: "mock",
    requestedAt: new Date().toISOString(),
    readyAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Ensure ALL mock properties have a mock tour if they don't have a valid one
  for (const prop of mockProperties) {
    const existing = store.tours[prop.id];
    // If it doesn't exist, OR it failed but has no assets (user cancelled before the fix)
    if (!existing || (existing.status === 'failed' && !existing.spzUrl)) {
      store.tours[prop.id] = generateMockTour(prop.id);
      modified = true;
    }
  }

  // Also fix the panoUrl for the mock tours to ensure they display the unsplash image instead of 404
  Object.values(store.tours).forEach(t => {
     if (t.providerMode === 'mock') {
        t.panoUrl = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop";
     }
  });

  return store;
}
