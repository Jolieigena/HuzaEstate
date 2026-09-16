const STORE_KEY = "huzaestate_favorite_properties_v1";

export type FavoriteIds = string[];

/** Defensive localStorage wrapper for a buyer's saved/favorited properties,
 *  matching the PropertyOverrides/Tours/SellerListings storage.ts convention. */
export const FavoritesStorageService = {
  isAvailable(): boolean {
    try {
      const testKey = "__huzaestate_favorites_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  load(): FavoriteIds {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  save(ids: FavoriteIds): boolean {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(ids));
      return true;
    } catch {
      return false;
    }
  },
};
