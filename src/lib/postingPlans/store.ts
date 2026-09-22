// Singleton store engine for posting-plan subscriptions & monthly usage,
// mirroring src/lib/rentPayments/store.ts.

import { PostingPlansStorageService, type PostingPlansState } from "./storage";
import type { Subscription, MonthlyUsage, PlanTier } from "./types";
import { DEFAULT_SUBSCRIPTION, DEFAULT_USAGE } from "./seed";

type Listener = () => void;

let state: PostingPlansState | null = null;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function ensureLoaded(): PostingPlansState {
  if (state !== null) return state;
  state = PostingPlansStorageService.load();
  return state;
}

function persist() {
  if (state) PostingPlansStorageService.save(state);
}

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export const PostingPlansStoreEngine = {
  getSubscription(accountId: string): Subscription {
    return ensureLoaded().subscriptions.find((s) => s.accountId === accountId) ?? DEFAULT_SUBSCRIPTION(accountId);
  },

  /** Reads this month's usage, silently resetting postsUsed/extraCredits
   *  when the stored record is from a previous month — this is what makes
   *  the monthly limit actually monthly without a cron job or server. */
  getUsage(accountId: string): MonthlyUsage {
    const current = ensureLoaded();
    const existing = current.usage.find((u) => u.accountId === accountId);
    const month = currentMonthKey();
    if (existing && existing.monthKey === month) return existing;
    return DEFAULT_USAGE(accountId);
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setTier(accountId: string, tier: PlanTier): void {
    const current = ensureLoaded();
    const renewsOn = new Date();
    renewsOn.setUTCDate(renewsOn.getUTCDate() + 30);
    const next: Subscription = { accountId, tier, renewsOn: renewsOn.toISOString().slice(0, 10) };
    const exists = current.subscriptions.some((s) => s.accountId === accountId);
    state = {
      ...current,
      subscriptions: exists ? current.subscriptions.map((s) => (s.accountId === accountId ? next : s)) : [...current.subscriptions, next],
    };
    persist();
    notifyListeners();
  },

  recordPostUsed(accountId: string): void {
    const current = ensureLoaded();
    const usage = this.getUsage(accountId);
    const updated: MonthlyUsage = { ...usage, postsUsed: usage.postsUsed + 1 };
    const exists = current.usage.some((u) => u.accountId === accountId);
    state = {
      ...current,
      usage: exists ? current.usage.map((u) => (u.accountId === accountId ? updated : u)) : [...current.usage, updated],
    };
    persist();
    notifyListeners();
  },

  addExtraCredit(accountId: string): void {
    const current = ensureLoaded();
    const usage = this.getUsage(accountId);
    const updated: MonthlyUsage = { ...usage, extraCredits: usage.extraCredits + 1 };
    const exists = current.usage.some((u) => u.accountId === accountId);
    state = {
      ...current,
      usage: exists ? current.usage.map((u) => (u.accountId === accountId ? updated : u)) : [...current.usage, updated],
    };
    persist();
    notifyListeners();
  },
};
