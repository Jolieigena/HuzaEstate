import type { Subscription, MonthlyUsage } from "./types";
import { SEED_SUBSCRIPTIONS, SEED_USAGE } from "./seed";

const STORE_KEY = "huzaestate_posting_plans_v1";

export interface PostingPlansState {
  subscriptions: Subscription[];
  usage: MonthlyUsage[];
}

export const SEED_STATE: PostingPlansState = { subscriptions: SEED_SUBSCRIPTIONS, usage: SEED_USAGE };

/** Defensive localStorage wrapper, matching the TenantApplications/SellerListings
 *  storage.ts convention. Falls back to seed data (not empty) when nothing saved yet. */
export const PostingPlansStorageService = {
  load(): PostingPlansState {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return SEED_STATE;
      return JSON.parse(raw) as PostingPlansState;
    } catch {
      return SEED_STATE;
    }
  },

  save(state: PostingPlansState): boolean {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  },
};
