// Singleton store engine for generated tours, mirroring the pattern in
// src/lib/finance/store.ts (module-level store + Set<Listener>, mutate()
// works on a cloned draft so record identity changes exactly when content
// does — required for useSyncExternalStore-based hooks in ./hooks.ts).

import { TourStorageService } from "./storage";
import { emptyTourStore } from "./types";
import { seedToursIfEmpty } from "./seed";
import type { TourStore } from "./types";

type Listener = () => void;

let store: TourStore | null = null;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function ensureLoaded(): TourStore {
  if (store !== null) return store;
  store = seedToursIfEmpty(TourStorageService.loadStore() ?? emptyTourStore());
  
  let migrated = false;
  Object.values(store.tours).forEach(tour => {
    if (tour.panoUrl && tour.panoUrl.includes('/api/tours/panorama')) {
      tour.panoUrl = tour.panoUrl.replace('/api/tours/panorama', '/api/tours/asset') + '&file=panorama.jpg';
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
