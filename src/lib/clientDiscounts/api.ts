"use client";

// payment-service client for client discounts: a percentage off HuzaEstate's own prices (plans, extra posts, promotions) for one
// client, between two dates, given by an administrator. The checkout charges the discounted price; these calls also let the
// client's own price show with the discount.

import { useEffect, useState } from "react";
import { money, toMajor } from "@/lib/finance/money";
import type { Money } from "@/lib/finance/types";

const PAYMENT_API_URL = process.env.NEXT_PUBLIC_PAYMENT_API_URL || "http://localhost:8081/api/payment-service";

export type DiscountKind = "plans" | "extra_post" | "promotion";
export const DISCOUNT_KINDS: DiscountKind[] = ["plans", "extra_post", "promotion"];
export const DISCOUNT_KIND_LABELS: Record<DiscountKind, string> = { plans: "Plans", extra_post: "Extra posts", promotion: "Promotions" };

export type DiscountStatus = "scheduled" | "active" | "expired" | "ended";
export const DISCOUNT_STATUS_LABELS: Record<DiscountStatus, string> = { scheduled: "Starts later", active: "Active", expired: "Finished", ended: "Ended early" };

export interface ClientDiscount {
  id: string;
  email: string;
  percent: number;
  appliesTo: DiscountKind[];
  startsAt: string;
  endsAt: string;
  status: DiscountStatus;
  note?: string;
  issuedBy: string;
  organizationName?: string;
  createdAt: string;
  endedAt?: string;
}

export interface DiscountInput {
  email: string;
  percent: number;
  appliesTo: DiscountKind[];
  startsAt: string;
  endsAt: string;
  note?: string;
}

/** A discount the signed-in client has now. */
export interface MyDiscount {
  percent: number;
  appliesTo: DiscountKind[];
  endsAt: string;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(path: string, token: string, init: { method?: string; body?: unknown } = {}): Promise<Result<T>> {
  try {
    const res = await fetch(`${PAYMENT_API_URL}${path}`, {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${token}`, ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}) },
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });
    if (!res.ok) {
      let message = "Something went wrong. Please try again.";
      try {
        const data = await res.json();
        message = Array.isArray(data?.message) ? data.message.join(" ") : data?.message || data?.error || message;
      } catch {
        // keep the default message
      }
      return { ok: false, error: message };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}

export const ClientDiscountsApi = {
  list: (token: string, search = "") => call<{ discounts: ClientDiscount[] }>(`/client-discounts${search ? `?search=${encodeURIComponent(search)}` : ""}`, token),
  create: (token: string, input: DiscountInput) => call<{ discount: ClientDiscount }>("/client-discounts", token, { method: "POST", body: input }),
  end: (token: string, id: string) => call<{ discount: ClientDiscount }>(`/client-discounts/${encodeURIComponent(id)}/end`, token, { method: "POST", body: {} }),
  // confirmEmail: discounts are waiting, but they only apply once the account's email is confirmed.
  mine: (token: string) => call<{ discounts: MyDiscount[]; confirmEmail?: boolean }>("/client-discounts/me", token),
};

type Mine = { discounts: MyDiscount[]; confirmEmail: boolean };

// The signed-in client's discounts, asked once per sign-in and shared by every price on the page. A confirmed email brings a new
// token, so the list is asked again then.
let cache: { token: string; promise: Promise<Mine> } | null = null;
function loadMine(token: string): Promise<Mine> {
  if (!cache || cache.token !== token) {
    cache = { token, promise: ClientDiscountsApi.mine(token).then((r) => (r.ok ? { discounts: r.data.discounts, confirmEmail: r.data.confirmEmail === true } : { discounts: [], confirmEmail: false })) };
  }
  return cache.promise;
}

function useMine(token: string | null): Mine | null {
  const [mine, setMine] = useState<Mine | null>(null);
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    loadMine(token).then((result) => {
      if (!cancelled) setMine(result);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);
  return token ? mine : null;
}

/** The best discount the client has for one kind of purchase, or null. Null for a visitor who is not signed in. */
export function useMyDiscount(token: string | null, kind: DiscountKind): MyDiscount | null {
  const mine = useMine(token);
  return mine?.discounts.filter((d) => d.appliesTo.includes(kind)).sort((a, b) => b.percent - a.percent)[0] ?? null;
}

/** True when the client has a discount waiting that needs their email confirmed first. */
export function useDiscountNeedsConfirmedEmail(token: string | null): boolean {
  return useMine(token)?.confirmEmail === true;
}

/** A price with the client's discount taken off. */
export function discounted(price: Money, percent: number): Money {
  const major = toMajor(price.amountMinor, price.currency);
  return money(Math.round(major * (100 - percent)) / 100, price.currency);
}
