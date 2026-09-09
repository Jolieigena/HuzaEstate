import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

// Server-only (uses node:fs) — never import this from client code or a
// Client Component; only src/app/api/tours/* route handlers should touch it.
//
// World Labs' panorama URLs may be signed/expiring and are hosted off our
// domain. Once a tour is ready we download the panorama once and cache it
// on our own filesystem, so buyers view it from HuzaEstate rather than
// hotlinking World Labs, and it keeps working even if the original URL
// later expires. This is a plain filesystem cache — fine for this
// prototype/single-instance app; a production deployment on serverless
// infra would swap this one file for real object storage (S3/R2/etc.)
// without any caller needing to change.
const CACHE_DIR = path.join(process.cwd(), ".tour-asset-cache");

function panoPath(propertyId: string): string {
  // propertyId is always one of our own generated ids (prop-N / seller-<uuid>),
  // never free-text user input, so this can't be used for path traversal.
  return path.join(CACHE_DIR, `${propertyId}-pano.jpg`);
}

export async function readCachedPano(propertyId: string): Promise<Buffer | null> {
  try {
    return await readFile(panoPath(propertyId));
  } catch {
    return null;
  }
}

async function isCached(propertyId: string): Promise<boolean> {
  try {
    await stat(panoPath(propertyId));
    return true;
  } catch {
    return false;
  }
}

/** Downloads the panorama from World Labs into our cache if it isn't
 *  already there. Idempotent and safe to call on every status poll. */
export async function ensurePanoCached(propertyId: string, sourceUrl: string): Promise<void> {
  if (await isCached(propertyId)) return;

  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Failed to download panorama (HTTP ${res.status}).`);
  const buffer = Buffer.from(await res.arrayBuffer());

  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(panoPath(propertyId), buffer);
}
