// Server-only interface — implementations use node:fs or a cloud SDK, so
// never import this (or any implementation) from client code.

export interface StoredAsset {
  /** URL the frontend can load directly — either a public cloud-storage
   *  URL, or our own same-origin proxy route for the local dev fallback.
   *  Never a World Labs URL: by the time this exists, we own the bytes. */
  url: string;
  /** Storage-relative path/key, for logs/debugging — not necessarily
   *  meaningful to the frontend. */
  path: string;
}

export interface TourAssetStorage {
  readonly id: string;
  readonly mode: "local-dev" | "vercel-blob";

  /**
   * Downloads `sourceUrl` once and stores it under a stable path scoped to
   * `propertyId`/`filename`, returning a URL that keeps working without
   * ever calling World Labs again. Implementations must be idempotent —
   * generation is polled repeatedly, and a tour can be retried, so this is
   * called more than once for the same (propertyId, filename) and must not
   * re-download/duplicate storage when a copy already exists.
   */
  storeFromUrl(propertyId: string, filename: string, sourceUrl: string): Promise<StoredAsset>;
}
