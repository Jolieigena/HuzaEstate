"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchMySubscription, reconcileCheckout, type RemoteSubscription } from "./api";
import { PLAN_LIMITS } from "./types";

// Shown while loading or logged out — same "Free, unused" shape the old localStorage mock
// defaulted to, so every existing consumer's render logic is unaffected either way.
const DEFAULT_SUBSCRIPTION: RemoteSubscription = {
  tier: "free",
  label: "Free",
  status: "active",
  renewsOn: null,
  cancelAtPeriodEnd: false,
  postsUsed: 0,
  postsLimit: PLAN_LIMITS.free,
  postsRemaining: PLAN_LIMITS.free,
  extraCredits: 0,
  expiryDays: 14,
};

const listeners = new Set<() => void>();

/** Call after an in-place plan change or a cancellation (anything that changes the plan without
 *  a Stripe redirect, so there's no page reload to pick up the new state naturally) so every
 *  mounted useSubscription() refetches. */
export function notifySubscriptionChanged() {
  listeners.forEach((listener) => listener());
}

/** Real payment-service data now (this used to read a per-browser localStorage mock). Backed by
 *  GET /subscriptions/me, which is self-scoped from the caller's own token — there's no
 *  accountId parameter any more. */
export function useSubscription(): RemoteSubscription {
  const { token } = useAuth();
  const [subscription, setSubscription] = useState<RemoteSubscription>(DEFAULT_SUBSCRIPTION);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const listener = () => setVersion((v) => v + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

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
  }, [token, version]);

  // Stripe redirects back here with ?session_id=... right after a successful Checkout (see
  // withSessionIdPlaceholder on the backend) — reconcile directly with Stripe instead of only
  // trusting the webhook already landed, so a slow/dropped webhook delivery doesn't leave the
  // seller looking stuck on their old plan. Strips the param immediately (before the async call)
  // so a second useSubscription() instance mounted on the same page — e.g. OverviewTab renders
  // it both directly and inside PostingPlanCard — doesn't also fire it.
  useEffect(() => {
    if (!token || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) return;
    params.delete("session_id");
    const nextSearch = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (nextSearch ? `?${nextSearch}` : "") + window.location.hash);
    reconcileCheckout(token, sessionId).then((data) => {
      if (data) setSubscription(data);
      notifySubscriptionChanged();
    });
  }, [token]);

  return subscription;
}
