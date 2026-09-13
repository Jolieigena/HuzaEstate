import type { Property } from "@/lib/properties/types";

const STORE_KEY = "huzaestate_property_overrides_v1";

export type PropertyOverrides = Record<string, Partial<Property>>;

/**
 * Defensive localStorage wrapper for seller edits to any property (curated
 * mock listings or seller-posted ones), matching the Tours/SellerListings
 * storage.ts convention. Since mockProperties is a static import, edits to
 * it can't mutate the source — they're stored as a per-id overlay instead
 * and merged on top wherever properties are read (see hooks.ts).
 */
export const PropertyOverridesStorageService = {
  isAvailable(): boolean {
    try {
      const testKey = "__huzaestate_overrides_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  load(): PropertyOverrides {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return {};
      return JSON.parse(raw) as PropertyOverrides;
    } catch {
      return {};
    }
  },

  save(overrides: PropertyOverrides): boolean {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(overrides));
      return true;
    } catch {
      return false;
    }
  },
};
