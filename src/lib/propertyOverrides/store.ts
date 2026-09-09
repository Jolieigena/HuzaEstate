// Singleton store engine for per-property edit overrides, mirroring
// src/lib/tours/store.ts and src/lib/sellerListings/store.ts.

import { PropertyOverridesStorageService, type PropertyOverrides } from "./storage";
import type { Property } from "@/lib/data";

type Listener = () => void;

let overrides: PropertyOverrides | null = null;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function ensureLoaded(): PropertyOverrides {
  if (overrides !== null) return overrides;
  overrides = PropertyOverridesStorageService.load();
  return overrides;
}

function persist() {
  if (overrides) PropertyOverridesStorageService.save(overrides);
}

export const PropertyOverridesStoreEngine = {
  getAll(): PropertyOverrides {
    return ensureLoaded();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  set(propertyId: string, patch: Partial<Property>): void {
    const current = ensureLoaded();
    overrides = { ...current, [propertyId]: { ...current[propertyId], ...patch } };
    persist();
    notifyListeners();
  },
};

export function applyOverride(property: Property, overridesMap: PropertyOverrides): Property {
  const patch = overridesMap[property.id];
  return patch ? { ...property, ...patch } : property;
}
