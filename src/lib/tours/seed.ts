import type { TourStore, TourRecord } from "./types";

export function seedToursIfEmpty(store: TourStore): TourStore {
  if (Object.keys(store.tours).length > 0) {
    return store;
  }

  const generateMockTour = (propertyId: string): TourRecord => ({
    id: `tour_mock_${propertyId}`,
    propertyId,
    status: "ready",
    phase: "ready",
    spzUrl: "/test-splat.spz",
    panoUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop",
    providerMode: "mock",
    requestedAt: new Date().toISOString(),
    readyAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return {
    tours: {
      "tour_mock_prop-1": generateMockTour("prop-1"),
      "tour_mock_prop-2": generateMockTour("prop-2"),
      "tour_mock_prop-3": generateMockTour("prop-3"),
      "tour_mock_prop-4": generateMockTour("prop-4"),
      "tour_mock_prop-5": generateMockTour("prop-5"),
    }
  };
}
