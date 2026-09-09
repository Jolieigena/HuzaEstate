import type { TourStore } from "./types";

const STORE_KEY = "huzaestate_tours_v1";

/**
 * Defensive localStorage wrapper for the Tours module, matching the
 * Finance/Execution/Renovate/Build storage.ts convention. This is frontend
 * prototype storage — not a production record of generated tours.
 */
export const TourStorageService = {
  isAvailable(): boolean {
    try {
      const testKey = "__huzaestate_tours_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  loadStore(): TourStore | null {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as TourStore;
    } catch {
      return null;
    }
  },

  saveStore(store: TourStore): boolean {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
      return true;
    } catch {
      return false;
    }
  },
};
