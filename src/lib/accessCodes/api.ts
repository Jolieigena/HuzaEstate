// payment-service client for access codes: time-limited access to a paid plan tier, issued to one
// email address by a platform or organisation admin and redeemed by the seller.

import type { RemoteSubscription } from "@/lib/postingPlans/api";
import type { PlanTier } from "@/lib/postingPlans/types";

const PAYMENT_API_URL = process.env.NEXT_PUBLIC_PAYMENT_API_URL || "http://localhost:8081/api/payment-service";

export type AccessCodeStatus = "pending" | "redeemed" | "expired" | "ended" | "cancelled";
export type AccessCodeTier = Exclude<PlanTier, "free">;

/** The longest a single code can be issued for (an extension can add more, up to MAX_TOTAL_DAYS). */
export const ACCESS_CODE_MAX_DAYS = 30;
export const ACCESS_CODE_MAX_TOTAL_DAYS = 90;

export const ACCESS_CODE_STATUS_LABELS: Record<AccessCodeStatus, string> = {
  pending: "Not redeemed",
  redeemed: "Active",
  expired: "Expired",
  ended: "Ended",
  cancelled: "Cancelled",
};

export interface AccessCode {
  id: string;
  code: string;
  email: string;
  tier: AccessCodeTier;
  tierLabel: string;
  days: number;
  status: AccessCodeStatus;
  createdAt: string;
  /** An unused code stops working after this date. */
  redeemBy: string;
  redeemedAt?: string;
  accessEndsAt?: string;
  /** Only while the access is running. */
  daysLeft?: number;
  endedAt?: string;
  endReason?: string;
  issuedBy: { name?: string; email?: string; role?: "administrator" | "organization_admin" };
  /** Absent for codes issued by the platform itself. */
  organizationId?: string;
  organizationName?: string;
}

export interface AccessCodeList {
  accessCodes: AccessCode[];
  total: number;
  page: number;
  limit: number;
  /** Counts per status for the whole scope, ignoring the filters. */
  summary: Record<AccessCodeStatus, number>;
}

export interface AccessCodeQuery {
  status?: AccessCodeStatus | "";
  tier?: AccessCodeTier | "";
  search?: string;
  /** Platform admins only: one organisation's id, or "platform" for codes the platform issued. */
  organizationId?: string;
  page?: number;
  limit?: number;
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

function qs(query: AccessCodeQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== "") params.set(key, String(value));
  const text = params.toString();
  return text ? `?${text}` : "";
}

export const AccessCodesApi = {
  list: (token: string, query: AccessCodeQuery = {}) => call<AccessCodeList>(`/access-codes${qs(query)}`, token),
  create: (token: string, input: { email: string; tier: AccessCodeTier; days: number }) =>
    call<{ accessCode: AccessCode; emailDelivered: boolean }>("/access-codes", token, { method: "POST", body: input }),
  end: (token: string, id: string, reason?: string) => call<{ accessCode: AccessCode }>(`/access-codes/${encodeURIComponent(id)}/end`, token, { method: "POST", body: { reason } }),
  extend: (token: string, id: string, days: number) => call<{ accessCode: AccessCode }>(`/access-codes/${encodeURIComponent(id)}/extend`, token, { method: "POST", body: { days } }),
  resend: (token: string, id: string) => call<{ accessCode: AccessCode; emailDelivered: boolean }>(`/access-codes/${encodeURIComponent(id)}/resend`, token, { method: "POST" }),
};

export interface RedeemedAccess {
  redeemed: true;
  sellerRoleGranted: boolean;
  tier: AccessCodeTier;
  tierLabel: string;
  days: number;
  accessEndsAt: string;
  subscription: RemoteSubscription;
}

/** The signed-in seller redeems a code that was sent to their own email address. */
export function redeemAccessCode(token: string, code: string): Promise<Result<RedeemedAccess>> {
  return call<RedeemedAccess>("/access-codes/redeem", token, { method: "POST", body: { code } });
}
