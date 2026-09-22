"use client";

import { useSyncExternalStore } from "react";
import { PostingPlansStoreEngine } from "./store";
import { DEFAULT_SUBSCRIPTION, DEFAULT_USAGE } from "./seed";
import type { Subscription, MonthlyUsage } from "./types";

// getServerSnapshot pinned to a fixed "free, unused" default (never the live
// localStorage-backed value) — SSR has no localStorage, matching every
// other hooks.ts in this app.
export function useSubscription(accountId: string): Subscription {
  return useSyncExternalStore(
    PostingPlansStoreEngine.subscribe,
    () => PostingPlansStoreEngine.getSubscription(accountId),
    () => DEFAULT_SUBSCRIPTION(accountId)
  );
}

export function useMonthlyUsage(accountId: string): MonthlyUsage {
  return useSyncExternalStore(
    PostingPlansStoreEngine.subscribe,
    () => PostingPlansStoreEngine.getUsage(accountId),
    () => DEFAULT_USAGE(accountId)
  );
}
