"use client";

import { useSyncExternalStore } from "react";
import { PropertyOverridesStoreEngine } from "./store";
import type { PropertyOverrides } from "./storage";

const EMPTY: PropertyOverrides = {};

// Server snapshot pinned to {} for the same hydration-safety reason as
// src/lib/tours/hooks.ts and src/lib/sellerListings/hooks.ts.
export function usePropertyOverrides(): PropertyOverrides {
  return useSyncExternalStore(
    PropertyOverridesStoreEngine.subscribe,
    () => PropertyOverridesStoreEngine.getAll(),
    () => EMPTY
  );
}
