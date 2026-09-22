import type { Subscription, MonthlyUsage } from "./types";

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

// The demo seller starts on Free with 1 of their 2 posts already used this
// month, so the paywall (PostingPaywall.tsx) is reachable with just one
// more post rather than needing extra setup to demo it.
export const SEED_SUBSCRIPTIONS: Subscription[] = [
  { accountId: "seller-user", tier: "free", renewsOn: currentMonthKey() + "-01" },
];

export const SEED_USAGE: MonthlyUsage[] = [
  { accountId: "seller-user", monthKey: currentMonthKey(), postsUsed: 1, extraCredits: 0 },
];

export const DEFAULT_SUBSCRIPTION = (accountId: string): Subscription => ({
  accountId,
  tier: "free",
  renewsOn: currentMonthKey() + "-01",
});

export const DEFAULT_USAGE = (accountId: string): MonthlyUsage => ({
  accountId,
  monthKey: currentMonthKey(),
  postsUsed: 0,
  extraCredits: 0,
});
