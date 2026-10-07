// access-service client for designs: interior and exterior designs professionals publish, each with a
// price (fixed, per square metre, or on request).

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

export type DesignCategory = "interior" | "exterior";
export type DesignPriceType = "fixed" | "per_sqm" | "on_request";
export type DesignStatus = "draft" | "published";

export const DESIGN_CATEGORY_LABELS: Record<DesignCategory, string> = { interior: "Interior", exterior: "Exterior" };
export const DESIGN_PRICE_TYPE_LABELS: Record<DesignPriceType, string> = { fixed: "Fixed price", per_sqm: "Per square metre", on_request: "On request" };

export interface DesignDesigner {
  accountId: string;
  displayName: string;
  photoUrl?: string;
  city?: string;
  country?: string;
}

export interface Design {
  id: string;
  title: string;
  description: string;
  category: DesignCategory;
  spaceType?: string;
  images: string[];
  priceType: DesignPriceType;
  price?: number;
  currency: string;
  status: DesignStatus;
  designer?: DesignDesigner;
  createdAt: string;
  updatedAt: string;
}

export interface DesignInput {
  title: string;
  description: string;
  category: DesignCategory;
  spaceType?: string;
  images: string[];
  priceType: DesignPriceType;
  price?: number;
  currency: string;
  status: DesignStatus;
}

export interface DesignList {
  designs: Design[];
  total: number;
  page: number;
  limit: number;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(path: string, init: { token?: string | null; method?: string; body?: unknown } = {}): Promise<Result<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? "GET",
      headers: { ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}), ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}) },
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

/** "$450", "$25/m²" or "Price on request". */
export function formatDesignPrice(design: Pick<Design, "priceType" | "price" | "currency">): string {
  if (design.priceType === "on_request" || !design.price) return "Price on request";
  const amount = Math.round(design.price).toLocaleString("en-US");
  const money = design.currency === "USD" ? `$${amount}` : `${design.currency} ${amount}`;
  return design.priceType === "per_sqm" ? `${money}/m²` : money;
}

export const DesignsApi = {
  list: (query: { category?: DesignCategory | ""; search?: string; professionalId?: string; page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== "") params.set(key, String(value));
    const text = params.toString();
    return call<DesignList>(`/designs${text ? `?${text}` : ""}`);
  },
  mine: (token: string) => call<{ designs: Design[] }>("/designs/me", { token }),
  get: (id: string, token?: string | null) => call<{ design: Design }>(`/designs/${encodeURIComponent(id)}`, { token }),
  create: (token: string, input: DesignInput) => call<{ design: Design }>("/designs", { token, method: "POST", body: input }),
  update: (token: string, id: string, input: DesignInput) => call<{ design: Design }>(`/designs/${encodeURIComponent(id)}`, { token, method: "PUT", body: input }),
  remove: (token: string, id: string) => call<{ deleted: boolean }>(`/designs/${encodeURIComponent(id)}`, { token, method: "DELETE" }),
};
