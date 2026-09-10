import { localFsTourAssetStorage } from "./localFs";
import { vercelBlobTourAssetStorage } from "./vercelBlob";
import type { TourAssetStorage } from "./types";

/**
 * Resolves the active persistent storage backend for generated tour assets
 * (SPZ splats, panoramas, thumbnails, collider meshes) — mirrors
 * src/lib/tours/provider/index.ts's getActiveTourProvider: real storage
 * activates automatically once BLOB_READ_WRITE_TOKEN is set, otherwise
 * everything falls back to the local filesystem so tour generation still
 * works out of the box in dev. See localFs.ts for why that fallback is NOT
 * safe for production.
 */
export function getActiveAssetStorage(): TourAssetStorage {
  if (process.env.BLOB_READ_WRITE_TOKEN) return vercelBlobTourAssetStorage;
  return localFsTourAssetStorage;
}

export * from "./types";
