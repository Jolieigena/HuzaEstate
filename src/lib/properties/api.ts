// property-service client for everything that needs a signed-in session: a seller's own
// listings, an administrator's full catalogue, visibility changes, and the owner's inquiry inbox.
// Public browsing lives in lib/sellerListings/hooks.ts.

import type { Property, PropertyStatus } from "./types";

const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:8081/api/property-service";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type InquiryStatus = "new" | "contacted" | "closed";
export interface InquiryReply {
  message: string;
  createdAt: string;
}
export interface Inquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  ownerId?: string;
  /** Only present on the admin/org-admin listing endpoints (listAllInquiries/listOrgInquiries) —
   *  who actually owns the listing, so an admin can see and reach them. */
  ownerName?: string;
  ownerEmail?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  replies: InquiryReply[];
  /** A platform/org admin's note about this inquiry — see PropertyApi.nudgeInquiry. */
  adminNudges: InquiryReply[];
}

async function call<T>(path: string, init: { token?: string | null; method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${PROPERTY_API_URL}${path}`, {
      method: init.method ?? "GET",
      headers: {
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    if (!res.ok) {
      let message = "Something went wrong. Please try again.";
      try {
        const data = await res.json();
        message = data?.message || data?.error || message;
      } catch {
        // keep the generic message
      }
      return { ok: false, error: Array.isArray(message) ? message.join(" ") : message };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}

export const PropertyApi = {
  /** The caller's own listings, in every status, including expired ones. */
  mine: async (token: string) => {
    const result = await call<{ properties: Property[] }>("/properties?mine=true&limit=200", { token });
    return result.ok ? ({ ok: true, data: result.data.properties } as const) : result;
  },
  /** Administrators only: every listing on the platform. */
  all: async (token: string, status?: PropertyStatus) => {
    const result = await call<{ properties: Property[]; total: number }>(`/properties?all=true&limit=200${status ? `&status=${status}` : ""}`, { token });
    return result.ok ? ({ ok: true, data: result.data.properties } as const) : result;
  },
  /** One listing; the owner and administrators can also fetch it while it isn't public. */
  byId: async (id: string, token?: string | null) => {
    const result = await call<{ property: Property }>(`/properties/${encodeURIComponent(id)}`, { token });
    return result.ok ? ({ ok: true, data: result.data.property } as const) : result;
  },
  setStatus: async (token: string, id: string, status: PropertyStatus, reason?: string) => {
    const result = await call<{ property: Property }>(`/properties/${encodeURIComponent(id)}/status`, { token, method: "PATCH", body: { status, reason } });
    return result.ok ? ({ ok: true, data: result.data.property } as const) : result;
  },
  /** Submits a draft for review/publishing — full validation runs server-side now (a draft can
   *  be missing almost everything up to this point), and this is also where the seller's posting
   *  quota actually gets consumed for the listing. */
  submitDraft: async (token: string, id: string, fields: Record<string, unknown>) => {
    const result = await call<{ property: Property }>(`/properties/${encodeURIComponent(id)}/submit`, { token, method: "POST", body: fields });
    return result.ok ? ({ ok: true, data: result.data.property } as const) : result;
  },
  sendInquiry: (input: { propertyId: string; name: string; email: string; phone?: string; message: string }, token?: string | null) =>
    call<{ inquiry: Inquiry }>("/inquiries", { token, method: "POST", body: input }),
  myInquiries: async (token: string) => {
    const result = await call<{ inquiries: Inquiry[] }>("/inquiries/mine", { token });
    return result.ok ? ({ ok: true, data: result.data.inquiries } as const) : result;
  },
  /** organization_admin only: every inquiry in scope for their organisation's countries. */
  orgInquiries: async (token: string) => {
    const result = await call<{ inquiries: Inquiry[] }>("/inquiries/org", { token });
    return result.ok ? ({ ok: true, data: result.data.inquiries } as const) : result;
  },
  /** Administrators only: every inquiry on the platform, unscoped. */
  allInquiries: async (token: string) => {
    const result = await call<{ inquiries: Inquiry[] }>("/inquiries/all", { token });
    return result.ok ? ({ ok: true, data: result.data.inquiries } as const) : result;
  },
  setInquiryStatus: async (token: string, id: string, status: InquiryStatus) => {
    const result = await call<{ inquiry: Inquiry }>(`/inquiries/${encodeURIComponent(id)}`, { token, method: "PATCH", body: { status } });
    return result.ok ? ({ ok: true, data: result.data.inquiry } as const) : result;
  },
  /** The owner replies in-app — recorded on the inquiry and emailed to the sender. */
  replyToInquiry: async (token: string, id: string, message: string) => {
    const result = await call<{ inquiry: Inquiry; delivered: boolean }>(`/inquiries/${encodeURIComponent(id)}/reply`, { token, method: "POST", body: { message } });
    return result.ok ? ({ ok: true, data: result.data.inquiry, delivered: result.data.delivered } as const) : result;
  },
  /** Platform admin, or org admin (in-scope country) — a note to the listing's owner, recorded
   *  on the inquiry and emailed to them. */
  nudgeInquiry: async (token: string, id: string, message: string) => {
    const result = await call<{ inquiry: Inquiry; delivered: boolean }>(`/inquiries/${encodeURIComponent(id)}/nudge`, { token, method: "POST", body: { message } });
    return result.ok ? ({ ok: true, data: result.data.inquiry, delivered: result.data.delivered } as const) : result;
  },
};
