"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/lib/auth-context";
import { SavedSearchesStoreEngine } from "./store";
import type { SavedSearch, SavedSearchCriteria } from "./types";

const EMPTY: SavedSearch[] = [];

// Server snapshot pinned to [] for the same hydration-safety reason as
// src/lib/tours/hooks.ts. Also keeps the browser's list in step with the signed-in account.
export function useSavedSearches(): SavedSearch[] {
  const { token, isAuthReady } = useAuth();
  useEffect(() => {
    if (isAuthReady) void SavedSearchesStoreEngine.sync(token);
  }, [token, isAuthReady]);
  return useSyncExternalStore(
    SavedSearchesStoreEngine.subscribe,
    () => SavedSearchesStoreEngine.getAll(),
    () => EMPTY
  );
}

/** Save, remove and alert actions bound to the current sign-in. `setAlerts` resolves to "signin" for a visitor who is not signed in. */
export function useSavedSearchActions() {
  const { token } = useAuth();
  const save = useCallback((criteria: SavedSearchCriteria, priceCurrency: string) => SavedSearchesStoreEngine.save(criteria, { token, priceCurrency }), [token]);
  const remove = useCallback((id: string) => SavedSearchesStoreEngine.remove(id, token), [token]);
  const setAlerts = useCallback(
    async (id: string, alerts: boolean): Promise<"signin" | boolean> => {
      if (!token) return "signin";
      return SavedSearchesStoreEngine.setAlerts(id, alerts, token);
    },
    [token]
  );
  return { save, remove, setAlerts, signedIn: !!token };
}
