import type { Money } from "@/lib/finance/types";
import { money } from "@/lib/finance/money";

export type PlanTier = "free" | "silver" | "gold" | "diamond";

export const PLAN_LABELS: Record<PlanTier, string> = {
  free: "Free",
  silver: "Silver",
  gold: "Gold",
  diamond: "Diamond",
};

/** Total posts allowed per month for that tier — null means unlimited.
 *  A subscribed tier's limit REPLACES the free 2, it doesn't add to it
 *  (Silver's own cap is 3 total, not 2+3). */
export const PLAN_LIMITS: Record<PlanTier, number | null> = {
  free: 2,
  silver: 3,
  gold: 10,
  diamond: null,
};

export const PLAN_PRICES: Record<Exclude<PlanTier, "free">, Money> = {
  silver: money(15, "USD"),
  gold: money(31, "USD"),
  diamond: money(69, "USD"),
};

/** How long a listing posted under each tier stays live before it disappears — must track
 *  payment-service's own PLAN_EXPIRY_DAYS (services/payment-service/src/modules/subscriptions/
 *  plans.ts), which is the actual source of truth used when a listing's expiresAt is computed. */
export const PLAN_EXPIRY_DAYS: Record<PlanTier, number> = {
  free: 14,
  silver: 30,
  gold: 42,
  diamond: 90,
};

/** One-time price to publish a single extra listing without subscribing —
 *  not specified by the source pricing, set to match Silver's own
 *  effective per-post rate ($15 / 3 posts = $5/post) so it's consistent
 *  with the numbers that were given rather than an arbitrary pick. */
export const PER_POST_PRICE: Money = money(5, "USD");

/** What a seller actually sees in Manager Portal differs by tier — this is
 *  the single place that decides it, so PostingPlanCard's feature list
 *  (PricingCards.tsx) and the real gates (MarketInsightsTab.tsx,
 *  ListingsTab.tsx) can't drift apart. */
export interface PlanFeatures {
  marketInsights: boolean;
  priorityPlacement: boolean;
}

export const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  free: { marketInsights: false, priorityPlacement: false },
  silver: { marketInsights: false, priorityPlacement: false },
  gold: { marketInsights: true, priorityPlacement: true },
  diamond: { marketInsights: true, priorityPlacement: true },
};

export interface Subscription {
  accountId: string;
  tier: PlanTier;
  /** ISO date the current paid tier renews — irrelevant while tier is "free". */
  renewsOn: string;
}

export interface MonthlyUsage {
  accountId: string;
  /** "YYYY-MM" — comparing this against the current month is what makes
   *  postsUsed/extraCredits reset automatically without a cron job. */
  monthKey: string;
  postsUsed: number;
  /** Pay-per-post credits bought this month, on top of the tier's own limit. */
  extraCredits: number;
}
