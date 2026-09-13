import type { Property } from "@/lib/properties/types";

const STORE_KEY = "huzaestate_seller_listings_v1";

/**
 * Defensive localStorage wrapper for seller-posted listings, matching the
 * Finance/Tours/Execution storage.ts convention. This is frontend prototype
 * storage — not a production listings database.
 */
export const SellerListingsStorageService = {
  isAvailable(): boolean {
    try {
      const testKey = "__huzaestate_seller_listings_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  load(): Property[] {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as Property[];
    } catch {
      return [];
    }
  },

  save(listings: Property[]): boolean {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(listings));
      return true;
    } catch {
      return false;
    }
  },
};
