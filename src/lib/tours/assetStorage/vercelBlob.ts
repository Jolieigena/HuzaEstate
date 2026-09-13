import { put } from "@vercel/blob";
import { contentTypeForFilename, isKnownTourAssetFilename } from "../assetFilenames";
import { assertPropertyId } from "../validation";
import type { StoredAsset, TourAssetStorage } from "./types";

// Real persistent storage. Activates automatically once BLOB_READ_WRITE_TOKEN
// is set (see index.ts) — nothing else in this file needs configuring beyond
// that env var. Get the token by adding a Blob store to this project in the
// Vercel dashboard (Storage tab) and pulling env vars with `vercel env pull`,
// or by setting it manually for other hosts that proxy the same API.
export const vercelBlobTourAssetStorage: TourAssetStorage = {
  id: "vercel_blob",
  mode: "vercel-blob",

  async storeFromUrl(propertyId, filename, sourceUrl): Promise<StoredAsset> {
    assertPropertyId(propertyId);
    if (!isKnownTourAssetFilename(filename)) throw new Error("Unknown tour asset filename.");
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error(`Failed to download ${filename} (HTTP ${res.status}).`);
    const buffer = Buffer.from(await res.arrayBuffer());

    const blob = await put(`property-tours/${propertyId}/${filename}`, buffer, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: contentTypeForFilename(filename),
    });

    return { url: blob.url, path: blob.pathname };
  },
};
