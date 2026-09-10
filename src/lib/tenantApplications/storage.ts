import type { TenantApplication } from "./types";
import { SEED_APPLICATIONS } from "./seed";

const STORE_KEY = "huzaestate_tenant_applications_v1";

/**
 * Defensive localStorage wrapper for tenant applications, matching the
 * SellerListings/Tours storage.ts convention. Falls back to the demo seed
 * data (not an empty list) when nothing has been saved yet, so a first-time
 * visitor sees the same believable Applications board this app has always
 * shown, just now backed by real, mutable state instead of hardcoded JSX.
 */
export const TenantApplicationsStorageService = {
  isAvailable(): boolean {
    try {
      const testKey = "__huzaestate_tenant_applications_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  load(): TenantApplication[] {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return SEED_APPLICATIONS;
      return JSON.parse(raw) as TenantApplication[];
    } catch {
      return SEED_APPLICATIONS;
    }
  },

  save(applications: TenantApplication[]): boolean {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(applications));
      return true;
    } catch {
      return false;
    }
  },
};
