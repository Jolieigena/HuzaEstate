import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StoredAsset, TourAssetStorage } from "./types";
import { isKnownTourAssetFilename } from "../assetFilenames";
import { resolveTourStoragePath } from "../storagePaths";

// DEVELOPMENT-ONLY FALLBACK. This writes to the local filesystem
// (process.cwd()/.tour-asset-cache), which is NOT durable on serverless
// hosting — most serverless platforms (Vercel included) reset the
// filesystem between invocations/deploys, so anything written here can
// vanish. This exists purely so tour generation works out of the box in
// local dev without any cloud credentials configured. In production, set
// BLOB_READ_WRITE_TOKEN (see ../assetStorage/vercelBlob.ts) so
// getActiveAssetStorage() switches to real persistent storage instead —
// see src/lib/tours/assetStorage/index.ts.
const CACHE_DIR = path.join(process.cwd(), ".tour-asset-cache");

function targetPath(propertyId: string, filename: string): string {
  if (!isKnownTourAssetFilename(filename)) throw new Error("Unknown tour asset filename.");
  return resolveTourStoragePath(CACHE_DIR, propertyId, filename);
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export const localFsTourAssetStorage: TourAssetStorage = {
  id: "local_fs",
  mode: "local-dev",

  async storeFromUrl(propertyId, filename, sourceUrl): Promise<StoredAsset> {
    const target = targetPath(propertyId, filename);

    if (!(await exists(target))) {
      const res = await fetch(sourceUrl);
      if (!res.ok) throw new Error(`Failed to download ${filename} (HTTP ${res.status}).`);
      const buffer = Buffer.from(await res.arrayBuffer());
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, buffer);
    }

    return {
      url: `/api/tours/asset?propertyId=${encodeURIComponent(propertyId)}&file=${encodeURIComponent(filename)}`,
      path: target,
    };
  },
};

/** Read-back used only by the /api/tours/asset serving route. */
export async function readLocalTourAsset(propertyId: string, filename: string): Promise<Buffer | null> {
  try {
    return await readFile(targetPath(propertyId, filename));
  } catch {
    return null;
  }
}
