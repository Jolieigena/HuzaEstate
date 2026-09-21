import type { LandlordProfile } from "./types";
import { SEED_LANDLORD_PROFILES } from "./seed";

const STORE_KEY = "huzaestate_landlord_profiles_v1";

/** Defensive localStorage wrapper, matching the TenantApplications/SellerListings
 *  storage.ts convention. Falls back to the seed profiles (not an empty list)
 *  when nothing has been saved yet. */
export const LandlordProfileStorageService = {
  load(): LandlordProfile[] {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return SEED_LANDLORD_PROFILES;
      return JSON.parse(raw) as LandlordProfile[];
    } catch {
      return SEED_LANDLORD_PROFILES;
    }
  },

  save(profiles: LandlordProfile[]): boolean {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(profiles));
      return true;
    } catch {
      return false;
    }
  },
};
