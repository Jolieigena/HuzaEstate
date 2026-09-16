// Singleton store engine for a buyer's saved/favorited properties, mirroring
// src/lib/propertyOverrides/store.ts, src/lib/tours/store.ts and src/lib/sellerListings/store.ts.

import { FavoritesStorageService, type FavoriteIds } from "./storage";

type Listener = () => void;

let ids: FavoriteIds | null = null;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function ensureLoaded(): FavoriteIds {
  if (ids !== null) return ids;
  ids = FavoritesStorageService.load();
  return ids;
}

function persist() {
  if (ids) FavoritesStorageService.save(ids);
}

export const FavoritesStoreEngine = {
  getAll(): FavoriteIds {
    return ensureLoaded();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  isSaved(propertyId: string): boolean {
    return ensureLoaded().includes(propertyId);
  },

  /** Toggles a property's saved state and returns the new state. */
  toggle(propertyId: string): boolean {
    const current = ensureLoaded();
    const wasSaved = current.includes(propertyId);
    ids = wasSaved ? current.filter((id) => id !== propertyId) : [...current, propertyId];
    persist();
    notifyListeners();
    return !wasSaved;
  },

  remove(propertyId: string): void {
    const current = ensureLoaded();
    if (!current.includes(propertyId)) return;
    ids = current.filter((id) => id !== propertyId);
    persist();
    notifyListeners();
  },
};
