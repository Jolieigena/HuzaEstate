// Server-only — downloads a completed generation's assets and stores them
// permanently via the active asset storage backend (see assetStorage/),
// so normal viewing never touches World Labs again. Used by
// src/app/api/tours/status/route.ts once a generation is confirmed done.

import { getActiveAssetStorage } from "./assetStorage";
import { filenameFor } from "./assetFilenames";
import type { TourGenerationResult } from "./provider/types";

export interface PipelineAssets {
  spzUrl?: string;
  panoUrl?: string;
  thumbnailUrl?: string;
  colliderUrl?: string;
}

/** World Labs' spz_urls is an open dictionary — confirmed from a real
 *  generation to come back keyed like {"100k": ..., "150k": ..., "500k":
 *  ..., "full_res": ...} (splat count per tier). Their own export docs
 *  describe the ~500k tier as the deliberate "lighter compute" option for
 *  real-time applications, as opposed to full resolution (~2M splats,
 *  confirmed ~28MB in practice) which is meant for offline/high-fidelity
 *  use, not a snappy first paint in a browser viewer — so prefer 500k by
 *  name first. This is one observed response, not a documented contract,
 *  so it still degrades gracefully: next-largest numbered tier below
 *  full_res, then full_res itself, then just the first entry. */
export function pickPrimarySpzSourceUrl(spzUrls: Record<string, string> | undefined | null): string | undefined {
  if (!spzUrls) return undefined;
  const entries = Object.entries(spzUrls).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0);
  if (entries.length === 0) return undefined;
  if (entries.length === 1) return entries[0][1];

  const midTier = entries.find(([key]) => /^500k$/i.test(key));
  if (midTier) return midTier[1];

  const numbered = entries
    .map(([key, url]) => ({ url, count: Number(/(\d+)\s*k/i.exec(key)?.[1] ?? NaN) }))
    .filter((e) => !Number.isNaN(e.count))
    .sort((a, b) => b.count - a.count);
  if (numbered.length > 0) return numbered[0].url;

  const full = entries.find(([key]) => /full/i.test(key));
  return (full ?? entries[0])[1];
}

/**
 * Downloads whichever assets a completed generation actually returned and
 * stores each one exactly once, under a filename that preserves the real
 * source extension (World Labs' thumbnail/panorama come back as .webp/.png,
 * not .jpg — see assetFilenames.ts). Best-effort per optional asset (pano,
 * thumbnail, collider) — a failure there is swallowed so one missing extra
 * doesn't take down an otherwise-viewable tour. The SPZ download failing is
 * NOT swallowed the same way; the caller decides whether that's fatal,
 * since "ready" must mean something is actually stored to view (see
 * status/route.ts).
 */
export async function downloadAndStoreTourAssets(propertyId: string, result: TourGenerationResult): Promise<PipelineAssets> {
  const storage = getActiveAssetStorage();
  const assets: PipelineAssets = {};

  const primarySpzSource = pickPrimarySpzSourceUrl(result.spzUrls);
  if (primarySpzSource) {
    const stored = await storage.storeFromUrl(propertyId, filenameFor("splat", primarySpzSource), primarySpzSource);
    assets.spzUrl = stored.url;
  }

  if (result.panoUrl) {
    try {
      const stored = await storage.storeFromUrl(propertyId, filenameFor("panorama", result.panoUrl), result.panoUrl);
      assets.panoUrl = stored.url;
    } catch {
      // best-effort — the splat viewer (or, lacking that, the World Labs
      // fallback link) still lets someone view the tour without a panorama
    }
  }

  if (result.thumbnailUrl) {
    try {
      const stored = await storage.storeFromUrl(propertyId, filenameFor("thumbnail", result.thumbnailUrl), result.thumbnailUrl);
      assets.thumbnailUrl = stored.url;
    } catch {
      // best-effort, see above
    }
  }

  if (result.colliderUrl) {
    try {
      const stored = await storage.storeFromUrl(propertyId, filenameFor("collider", result.colliderUrl), result.colliderUrl);
      assets.colliderUrl = stored.url;
    } catch {
      // optional asset — never blocks the tour
    }
  }

  return assets;
}
