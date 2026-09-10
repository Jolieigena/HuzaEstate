"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
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

// localStorage (TourStoreEngine) is a fast local CACHE, not the source of
// truth — it's per-browser, so a buyer on a different device would
// otherwise never see a tour generated elsewhere. The real source of truth
// is the server-side repository (see src/lib/tours/repository and
// /api/tours/record); this reconciles the local cache against it once per
// propertyId per pageload the first time any component asks for that
// property's tour.
const reconciledPropertyIds = new Set<string>();

function reconcileWithServerRecord(propertyId: string) {
  if (reconciledPropertyIds.has(propertyId)) return;
  reconciledPropertyIds.add(propertyId);

  fetch(`/api/tours/record?propertyId=${encodeURIComponent(propertyId)}`)
    .then((res) => (res.ok ? (res.json() as Promise<TourRecord>) : null))
    .then((record) => {
      if (!record) return;
      TourStoreEngine.mutate((s) => {
        const local = s.tours[propertyId];
        // The server record is authoritative — only keep the local one if
        // it's demonstrably fresher (this tab is actively polling an
        // in-progress generation the server hasn't persisted the latest
        // step of yet).
        if (local?.updatedAt && record.updatedAt && local.updatedAt > record.updatedAt) return;
        s.tours[propertyId] = record;
      });
    })
    .catch(() => {
      // Best-effort — if this fails, whatever's already in the local cache
      // (possibly nothing) is what renders. Never blocks the UI.
    });
}

export function useTourForProperty(propertyId: string | undefined): TourRecord | undefined {
  useEffect(() => {
    if (propertyId) reconcileWithServerRecord(propertyId);
  }, [propertyId]);

  return useTourSubscription(
    () => (propertyId ? TourStoreEngine.getStore().tours[propertyId] : undefined),
    () => undefined
  );
}
