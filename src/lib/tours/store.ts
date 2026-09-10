// Singleton store engine for generated tours, mirroring the pattern in
// src/lib/finance/store.ts (module-level store + Set<Listener>, mutate()
// works on a cloned draft so record identity changes exactly when content
// does — required for useSyncExternalStore-based hooks in ./hooks.ts).

import { TourStorageService } from "./storage";
import { emptyTourStore } from "./types";
import type { TourStore } from "./types";

type Listener = () => void;

let store: TourStore | null = null;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function ensureLoaded(): TourStore {
  if (store !== null) return store;
  store = TourStorageService.loadStore() ?? emptyTourStore();

  // Records created before the asset-storage rewrite point at
  // /api/tours/panorama, a route that no longer exists (replaced by
  // /api/tours/asset — see src/app/api/tours/asset/route.ts). There's no
  // way to actually recover these: the old flat single-file cache layout
  // isn't compatible with the new per-property directory structure, so
  // the underlying asset is genuinely gone, not just moved. Clear the
  // stale record back to "no tour yet" rather than leaving a permanently
  // broken viewer — the owner can just regenerate.
  // A short-lived bug (since removed — see git history of this file) auto-
  // seeded a fake "ready" tour for every mock property pointing at
  // /test-splat.spz, a file that was never actually added to public/. Any
  // record with that exact marker was fabricated, not a real generation —
  // clear it out here too so a browser that already ran the bug once
  // doesn't keep showing a permanently-broken viewer from it.
  let migrated = false;
  Object.entries(store.tours).forEach(([propertyId, tour]) => {
    if (tour.panoUrl?.includes('/api/tours/panorama') || tour.viewerUrl?.includes('/api/tours/panorama') || tour.spzUrl === '/test-splat.spz') {
      delete store!.tours[propertyId];
      migrated = true;
    }
  });

  if (migrated) {
    TourStorageService.saveStore(store);
  }

  return store;
}

function persist() {
  if (store) TourStorageService.saveStore(store);
}

export const TourStoreEngine = {
  getStore(): TourStore {
    return ensureLoaded();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  mutate<T>(fn: (s: TourStore) => T): T {
    const current = ensureLoaded();
    const draft: TourStore = JSON.parse(JSON.stringify(current));
    const result = fn(draft);
    store = draft;
    persist();
    notifyListeners();
    return result;
  },
};
