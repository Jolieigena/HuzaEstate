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

export type CheckoutResult = { ok: true; url: string } | { ok: true; demo: true } | { ok: false; error: string };

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
    return { ok: true, url: data.url as string };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
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
