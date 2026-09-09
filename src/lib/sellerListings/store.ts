// Singleton store engine for seller-posted listings, mirroring
// src/lib/tours/store.ts (module-level array + Set<Listener>).

import { SellerListingsStorageService } from "./storage";
import type { Property } from "@/lib/data";

type Listener = () => void;

let listings: Property[] | null = null;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function ensureLoaded(): Property[] {
  if (listings !== null) return listings;
  listings = SellerListingsStorageService.load();
  return listings;
}

function persist() {
  if (listings) SellerListingsStorageService.save(listings);
}

function newListingId(): string {
  const rand = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `seller-${rand}`;
}

export const SellerListingsStoreEngine = {
  getAll(): Property[] {
    return ensureLoaded();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  add(input: Omit<Property, "id">): Property {
    const current = ensureLoaded();
    const property: Property = { ...input, id: newListingId() };
    listings = [property, ...current];
    persist();
    notifyListeners();
    return property;
  },
};
