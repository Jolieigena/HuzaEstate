import { PostingPlansStoreEngine } from "./store";
import { PLAN_LIMITS } from "./types";
import type { PlanTier } from "./types";

export const PostingPlanService = {
  getTier(accountId: string): PlanTier {
    return PostingPlansStoreEngine.getSubscription(accountId).tier;
  },

  postsRemaining(accountId: string): number | null {
    const tier = this.getTier(accountId);
    const limit = PLAN_LIMITS[tier];
    if (limit === null) return null; // unlimited
    const usage = PostingPlansStoreEngine.getUsage(accountId);
    return Math.max(0, limit + usage.extraCredits - usage.postsUsed);
  },

  canPost(accountId: string): boolean {
    const remaining = this.postsRemaining(accountId);
    return remaining === null || remaining > 0;
  },

  recordPostUsed(accountId: string): void {
    PostingPlansStoreEngine.recordPostUsed(accountId);
  },

  /** Simulated — see finance module's own "mock provider only" notice
   *  (src/lib/finance/types.ts). No real charge is made. */
  subscribe(accountId: string, tier: PlanTier): void {
    PostingPlansStoreEngine.setTier(accountId, tier);
  },

  buyExtraPost(accountId: string): void {
    PostingPlansStoreEngine.addExtraCredit(accountId);
  },
};
