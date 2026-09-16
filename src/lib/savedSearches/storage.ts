import type { SavedSearch } from "./types";

const STORE_KEY = "huzaestate_saved_searches_v1";

/** Defensive localStorage wrapper for a buyer's saved property searches,
 *  matching the Favorites/PropertyOverrides/Tours storage.ts convention. */
export const SavedSearchesStorageService = {
  isAvailable(): boolean {
    try {
      const testKey = "__huzaestate_saved_searches_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  load(): SavedSearch[] {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  save(searches: SavedSearch[]): boolean {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(searches));
      return true;
    } catch {
      return false;
    }
  },
};
