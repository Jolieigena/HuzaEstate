"use client";

import { useSyncExternalStore } from "react";
import { FavoritesStoreEngine } from "./store";
import type { Property } from "@/lib/properties/types";

const EMPTY: string[] = [];

// Server snapshot pinned to [] for the same hydration-safety reason as
// src/lib/propertyOverrides/hooks.ts and src/lib/tours/hooks.ts.
export function useFavoriteIds(): string[] {
  return useSyncExternalStore(
    FavoritesStoreEngine.subscribe,
    () => FavoritesStoreEngine.getAll(),
    () => EMPTY
  );
}

export function useIsFavorite(propertyId: string): boolean {
  return useFavoriteIds().includes(propertyId);
}

/** Full Property records for whatever's currently saved, in the given property list. */
export function useFavoriteProperties(allProperties: Property[]): Property[] {
  const ids = useFavoriteIds();
  if (ids.length === 0) return EMPTY as unknown as Property[];
  return allProperties.filter((p) => ids.includes(p.id));
}
