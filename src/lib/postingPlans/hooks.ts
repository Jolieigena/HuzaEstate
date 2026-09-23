"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchMySubscription, type RemoteSubscription } from "./api";
import { PLAN_LIMITS } from "./types";

// Shown while loading or logged out — same "Free, unused" shape the old localStorage mock
// defaulted to, so every existing consumer's render logic is unaffected either way.
const DEFAULT_SUBSCRIPTION: RemoteSubscription = {
  tier: "free",
  label: "Free",
  status: "active",
  renewsOn: null,
  postsUsed: 0,
  postsLimit: PLAN_LIMITS.free,
  postsRemaining: PLAN_LIMITS.free,
  extraCredits: 0,
  expiryDays: 14,
};

/** Real payment-service data now (this used to read a per-browser localStorage mock). Backed by
 *  GET /subscriptions/me, which is self-scoped from the caller's own token — there's no
 *  accountId parameter any more. */
export function useSubscription(): RemoteSubscription {
  const { token } = useAuth();
  const [subscription, setSubscription] = useState<RemoteSubscription>(DEFAULT_SUBSCRIPTION);

  useEffect(() => {
    let cancelled = false;
    // Resolve on a microtask either way (never setState synchronously in the effect body
    // itself) — mirrors how the fetch branch below already only ever updates state from
    // inside a .then() callback.
    Promise.resolve()
      .then(() => (token ? fetchMySubscription(token) : DEFAULT_SUBSCRIPTION))
      .then((data) => {
        if (!cancelled) setSubscription(data ?? DEFAULT_SUBSCRIPTION);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return subscription;
}
