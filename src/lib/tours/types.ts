import type { TourGenerationStatus, TourProviderMode } from "./provider/types";

export interface TourRecord {
  propertyId: string;
  status: TourGenerationStatus;
  operationId?: string;
  worldId?: string;
  viewerUrl?: string;
  thumbnailUrl?: string;
  /** Same-origin URL (/api/tours/panorama?propertyId=...) once we've
   *  downloaded and cached World Labs' panorama ourselves — see
   *  src/lib/tours/assetStorage.ts. Undefined until then. */
  panoUrl?: string;
  error?: string;
  providerMode?: TourProviderMode;
  requestedAt: string;
  readyAt?: string;
}

export interface TourStore {
  tours: Record<string, TourRecord>;
}

export function emptyTourStore(): TourStore {
  return { tours: {} };
}
