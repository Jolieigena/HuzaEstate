"use client";

import { useRef, useSyncExternalStore } from "react";
import { TourStoreEngine } from "./store";
import type { TourRecord } from "./types";

function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

// useSyncExternalStore (not useState+useEffect) so a selector re-evaluates
// against the *current* propertyId on every render — see the identical
// rationale in src/lib/finance/hooks.ts.
//
// getServerSnapshot is a SEPARATE, fixed function (not the same as
// getSnapshot) because the store is localStorage-backed: on the real server
// there's no localStorage, so SSR always renders the "no tour yet" state.
// If hydration's snapshot call read localStorage too, a visitor reloading a
// page after already generating a tour would hydrate straight to the
// "ready" markup while the server HTML says "idle", tripping React's
// hydration-mismatch check. Pinning the server snapshot to that same
// "idle" value keeps hydration consistent; useSyncExternalStore then
// re-renders with the real client value right after mount.
function useTourSubscription<T>(select: () => T, getServerSnapshot: () => T): T {
  const cache = useRef<{ has: boolean; value: T }>({ has: false, value: undefined as T });
  const getSnapshot = () => {
    const next = select();
    if (cache.current.has && shallowEqual(cache.current.value, next)) return cache.current.value;
    cache.current = { has: true, value: next };
    return next;
  };
  return useSyncExternalStore(TourStoreEngine.subscribe, getSnapshot, getServerSnapshot);
}

export function useTourForProperty(propertyId: string | undefined): TourRecord | undefined {
  return useTourSubscription(
    () => (propertyId ? TourStoreEngine.getStore().tours[propertyId] : undefined),
    () => undefined
  );
}
