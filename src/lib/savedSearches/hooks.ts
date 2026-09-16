"use client";

import { useSyncExternalStore } from "react";
import { SavedSearchesStoreEngine } from "./store";
import type { SavedSearch } from "./types";

const EMPTY: SavedSearch[] = [];

// Server snapshot pinned to [] for the same hydration-safety reason as
// src/lib/favorites/hooks.ts and src/lib/propertyOverrides/hooks.ts.
export function useSavedSearches(): SavedSearch[] {
  return useSyncExternalStore(
    SavedSearchesStoreEngine.subscribe,
    () => SavedSearchesStoreEngine.getAll(),
    () => EMPTY
  );
}
