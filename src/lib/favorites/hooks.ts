"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/lib/auth-context";
import { FavoritesStoreEngine } from "./store";
import type { Property } from "@/lib/properties/types";

const EMPTY: string[] = [];

export function useFavoriteIds(): string[] {
  const { token, isAuthReady } = useAuth();
  useEffect(() => {
    if (isAuthReady) void FavoritesStoreEngine.sync(token);
  }, [token, isAuthReady]);
  return useSyncExternalStore(FavoritesStoreEngine.subscribe, () => FavoritesStoreEngine.getAll(), () => EMPTY);
}

export function useIsFavorite(propertyId: string): boolean {
  return useFavoriteIds().includes(propertyId);
}

/** Toggle a saved listing. Resolves to "signin" when nobody is signed in (saving needs an account). */
export function useToggleFavorite() {
  const { token } = useAuth();
  return useCallback(
    async (propertyId: string): Promise<"signin" | { ok: true; saved: boolean } | { ok: false; error: string }> => {
      if (!token) return "signin";
      return FavoritesStoreEngine.toggle(token, propertyId);
    },
    [token]
  );
}

/** Full Property records for whatever's currently saved, in the given property list. */
export function useFavoriteProperties(allProperties: Property[]): Property[] {
  const ids = useFavoriteIds();
  if (ids.length === 0) return EMPTY as unknown as Property[];
  return allProperties.filter((p) => ids.includes(p.id));
}
