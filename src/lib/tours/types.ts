import type { TourGenerationStatus, TourProviderMode } from "./provider/types";

/**
 * Granular pipeline stage, additive to `status` (which stays the coarse
 * pending/ready/failed every existing UI already switches on — see
 * PropertyTourSection/SellerTourControl/TourWatchBadge). World Labs itself
 * only ever reports pending/done/error; downloading_assets and
 * storing_assets are OUR OWN post-generation steps (fetching the returned
 * asset URLs once, writing them into our own storage — see
 * src/lib/tours/assetStorage/ — so normal viewing never depends on World
 * Labs again). A record is only allowed to reach `status: "ready"` once
 * phase is "ready" too, i.e. once the assets required for viewing are
 * actually stored on our side — see assetPipeline.ts.
 */
export type TourPhase = "queued" | "generating" | "downloading_assets" | "storing_assets" | "ready" | "failed";

export interface TourScene {
  id: string;
  category: string;
  status: TourGenerationStatus;
  phase?: TourPhase;
  operationId?: string;
  worldId?: string;
  /** World Labs' own hosted viewer (world_marble_url). Kept only for
   *  debugging/admin preview/fallback — normal buyer viewing must never
   *  depend on this; see PropertyTourSection, which only ever links to it
   *  as a secondary "Open on World Labs" action. */
  viewerUrl?: string;
  /** Our own stored copy (see assetStorage) — never a World Labs URL. */
  thumbnailUrl?: string;
  /** Our own stored copy of the equirectangular panorama — the Pannellum
   *  preview/fallback viewer reads this. Our own stored copy, not World
   *  Labs'. */
  panoUrl?: string;
  /** Our own stored copy of the primary Gaussian-splat (.spz) file — what
   *  the real interactive 3D viewer (SplatViewer) loads. */
  spzUrl?: string;
  /** Raw World Labs URLs for every splat resolution the API returned
   *  (e.g. full + low-res), kept for reference/future use — NOT
   *  downloaded/re-hosted by default, only `spzUrl` above is. These are
   *  the original (possibly signed/expiring) World Labs links, so don't
   *  rely on them for normal viewing. */
  rawSpzUrls?: Record<string, string>;
  /** Our own stored copy of the collider mesh (GLB), if World Labs
   *  returned one — optional, best-effort. */
  colliderUrl?: string;
  /** AI-generated description of the world, if World Labs returned one. */
  caption?: string;
  semanticsMetadata?: { groundPlaneOffsetMeters?: number; metricScaleFactor?: number };
  error?: string;
  providerMode?: TourProviderMode;
  readyAt?: string;
}

export interface TourRecord {
  id: string;
  propertyId: string;
  status: TourGenerationStatus;
  phase?: TourPhase;
  scenes: TourScene[];
  /** Legacy single-scene fields retained while stored records and callers
   * migrate to `scenes`. New multi-scene records should use `scenes` as the
   * source of truth. */
  operationId?: string;
  worldId?: string;
  viewerUrl?: string;
  thumbnailUrl?: string;
  panoUrl?: string;
  spzUrl?: string;
  rawSpzUrls?: Record<string, string>;
  colliderUrl?: string;
  caption?: string;
  semanticsMetadata?: { groundPlaneOffsetMeters?: number; metricScaleFactor?: number };
  error?: string;
  providerMode?: TourProviderMode;
  requestedAt: string;
  readyAt?: string;
  updatedAt: string;
}

export interface TourStore {
  tours: Record<string, TourRecord>;
}

export function emptyTourStore(): TourStore {
  return { tours: {} };
}
