"use client";

import { useSyncExternalStore } from "react";
import { SellerListingsStoreEngine } from "./store";
import { mockProperties } from "@/lib/data";
import type { Property } from "@/lib/properties/types";
import { usePropertyOverrides } from "@/lib/propertyOverrides/hooks";
import { applyOverride } from "@/lib/propertyOverrides/store";

const EMPTY: Property[] = [];

// getServerSnapshot is pinned to a fixed empty array (not the live
// localStorage-backed value) for the same reason as src/lib/tours/hooks.ts:
// there's no localStorage on the server, so SSR/hydration must see a
// consistent "no seller listings yet" result, or React's hydration-mismatch
// check trips the moment a visitor who has already posted a listing
// reloads the page.
export function useSellerListings(): Property[] {
  return useSyncExternalStore(
    SellerListingsStoreEngine.subscribe,
    () => SellerListingsStoreEngine.getAll(),
    () => EMPTY
  );
}

/** mockProperties plus anything a seller has posted this session/browser,
 *  with any per-property edits (see propertyOverrides) applied on top —
 *  so an edited title/price/image shows up everywhere a property is read,
 *  for both curated and seller-posted listings alike. */
export function useAllProperties(): Property[] {
  const sellerListings = useSellerListings();
  const overrides = usePropertyOverrides();
  const base = sellerListings.length ? [...sellerListings, ...mockProperties] : mockProperties;
  return Object.keys(overrides).length ? base.map((p) => applyOverride(p, overrides)) : base;
}
