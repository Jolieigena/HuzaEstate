// Real payment-service client — replaces the old client-side/localStorage mock (formerly
// store.ts/storage.ts/seed.ts). Every call is self-scoped: payment-service reads the caller's
// own account id out of the Bearer token, so there's no accountId parameter to pass here.

import type { PlanTier } from "./types";

const PAYMENT_API_URL = process.env.NEXT_PUBLIC_PAYMENT_API_URL || "http://localhost:8081/api/payment-service";

export interface RemoteSubscription {
  tier: PlanTier;
  label: string;
  status: "active" | "canceled" | "past_due";
  renewsOn: string | null;
  /** True once cancellation is scheduled — the plan stays active and billed until renewsOn,
   *  then drops to Free. */
  cancelAtPeriodEnd: boolean;
  postsUsed: number;
  postsLimit: number | null;
  postsRemaining: number | null;
  extraCredits: number;
  expiryDays: number;
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.message || data?.error || "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

export async function fetchMySubscription(token: string): Promise<RemoteSubscription | null> {
  try {
    const res = await fetch(`${PAYMENT_API_URL}/subscriptions/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as RemoteSubscription;
  } catch {
    return null;
  }
}

// A first subscription redirects to Stripe Checkout (`url`); switching between paid tiers while
// already subscribed updates the existing Stripe subscription in place — no redirect, applied
// immediately (`updated`).
export type CheckoutResult = { ok: true; url: string } | { ok: true; updated: true; tier: PlanTier } | { ok: true; demo: true } | { ok: false; error: string };

export async function createSubscribeCheckout(token: string, tier: Exclude<PlanTier, "free">, successUrl: string, cancelUrl: string): Promise<CheckoutResult> {
  try {
    const res = await fetch(`${PAYMENT_API_URL}/checkout/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tier, successUrl, cancelUrl }),
    });
    if (!res.ok) return { ok: false, error: await parseErrorMessage(res) };
    const data = await res.json();
    if (data.demo) return { ok: true, demo: true };
    if (data.updated) return { ok: true, updated: true, tier: data.tier as PlanTier };
    return { ok: true, url: data.url as string };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}

export type CancelResult = { ok: true; effectiveDate: string } | { ok: false; error: string };

/** Schedules cancellation at the current billing period's end — the seller keeps their plan and
 *  posting quota until then and is not billed again; the tier drops to Free once the period
 *  actually ends. */
export async function cancelSubscription(token: string): Promise<CancelResult> {
  try {
    const res = await fetch(`${PAYMENT_API_URL}/subscriptions/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { ok: false, error: await parseErrorMessage(res) };
    const data = await res.json();
    return { ok: true, effectiveDate: data.effectiveDate as string };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}

// Called right when Stripe redirects the browser back to successUrl (which now carries
// ?session_id=...) — confirms the payment directly with Stripe instead of only trusting that the
// webhook already landed, which is what left a paying seller stuck looking like they're still on
// Free if that webhook delivery was slow or dropped. Best-effort/silent: the webhook is still the
// real source of truth and will (re-)apply the same state on its own if this fails.
export async function reconcileCheckout(token: string, sessionId: string): Promise<RemoteSubscription | null> {
  try {
    const res = await fetch(`${PAYMENT_API_URL}/checkout/reconcile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) return null;
    return (await res.json()) as RemoteSubscription;
  } catch {
    return null;
  }
}

export async function createPerPostCheckout(token: string, successUrl: string, cancelUrl: string): Promise<CheckoutResult> {
  try {
    const res = await fetch(`${PAYMENT_API_URL}/checkout/per-post`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ successUrl, cancelUrl }),
    });
    if (!res.ok) return { ok: false, error: await parseErrorMessage(res) };
    const data = await res.json();
    if (data.demo) return { ok: true, demo: true };
    return { ok: true, url: data.url as string };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}

export type SellerFreeResult = { ok: true } | { ok: false; error: string };

export async function createSellerFreeCheckout(token: string): Promise<SellerFreeResult> {
  try {
    const res = await fetch(`${PAYMENT_API_URL}/checkout/seller-free`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { ok: false, error: await parseErrorMessage(res) };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}
