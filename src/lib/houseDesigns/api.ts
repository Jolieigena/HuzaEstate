import type { ManualDesign } from "@/lib/build/types";

const ACCESS_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

export type HouseDesignStatus = "new" | "reviewing" | "quoted" | "accepted" | "declined";

export const HOUSE_DESIGN_STATUS_LABELS: Record<HouseDesignStatus, string> = {
  new: "Received",
  reviewing: "Being reviewed",
  quoted: "Quote ready",
  accepted: "Accepted",
  declined: "Could not be taken on",
};

export interface HouseDesignRecord {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  title: string;
  projectId?: string;
  notes?: string;
  phone?: string;
  plotSummary?: string;
  budgetSummary?: string;
  floorCount: number;
  roomCount: number;
  totalAreaSqm: number;
  status: HouseDesignStatus;
  adminNote?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  design: ManualDesign;
}

export interface SubmitHouseDesignInput {
  title: string;
  projectId?: string;
  notes?: string;
  phone?: string;
  plotSummary?: string;
  budgetSummary?: string;
  design: ManualDesign;
}

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(path: string, token: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${ACCESS_API_URL}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.method && init.method !== "GET" ? { "x-huza-client": "web" } : {}),
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

export const HouseDesignsApi = {
  /** Sends a design to the HuzaEstate team. Sending the same project again updates the copy they have until they start on it. */
  submit: async (token: string, input: SubmitHouseDesignInput) => {
    const result = await call<{ design: HouseDesignRecord }>("/house-designs", token, { method: "POST", body: input });
    return result.ok ? ({ ok: true, data: result.data.design } as const) : result;
  },
  mine: async (token: string) => {
    const result = await call<{ designs: HouseDesignRecord[] }>("/house-designs/mine", token);
    return result.ok ? ({ ok: true, data: result.data.designs } as const) : result;
  },
  /** Administrators: every customer's designs. */
  listAll: async (token: string, status: HouseDesignStatus | "all" = "all") => {
    const result = await call<{ designs: HouseDesignRecord[] }>(`/house-designs${status === "all" ? "" : `?status=${status}`}`, token);
    return result.ok ? ({ ok: true, data: result.data.designs } as const) : result;
  },
  update: async (token: string, id: string, changes: { status?: HouseDesignStatus; adminNote?: string }) => {
    const result = await call<{ design: HouseDesignRecord }>(`/house-designs/${encodeURIComponent(id)}`, token, { method: "PATCH", body: changes });
    return result.ok ? ({ ok: true, data: result.data.design } as const) : result;
  },
};
