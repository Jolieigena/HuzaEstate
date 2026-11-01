import type { DesignCategory, DesignPartKind } from "@/lib/designs/api";

const ACCESS_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

export type DesignBriefStatus = "draft" | "sent" | "awarded" | "closed";

export const DESIGN_BRIEF_STATUS_LABELS: Record<DesignBriefStatus, string> = {
  draft: "Draft",
  sent: "Out for pricing",
  awarded: "Awarded",
  closed: "Closed",
};

export interface BriefPart {
  id?: string;
  name: string;
  kind: DesignPartKind;
  description?: string;
}

export interface BriefReply {
  id: string;
  accountId: string;
  kind: "supplier" | "professional";
  name: string;
  price: number;
  currency: string;
  leadTimeDays?: number;
  note: string;
  createdAt: string;
}

export interface BriefRecipient {
  accountId: string;
  kind: "supplier" | "professional";
  name: string;
  sentAt: string;
}

/** A design an administrator drew up to be built or made. What a recipient receives has only their own answer. */
export interface DesignBrief {
  id: string;
  title: string;
  description: string;
  category: DesignCategory;
  spaceType?: string;
  images: string[];
  parts: BriefPart[];
  instructions: string;
  status: DesignBriefStatus;
  sentAt?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Administrators only. */
  recipients?: BriefRecipient[];
  replies?: BriefReply[];
  acceptedReplyId?: string;
  /** Recipients only. */
  myReply?: BriefReply;
  won?: boolean;
}

export interface DesignBriefInput {
  title: string;
  description: string;
  category: DesignCategory;
  spaceType?: string;
  images: string[];
  parts: BriefPart[];
  instructions: string;
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

const unwrap = <T, K extends string>(result: ApiResult<Record<K, T>>, key: K): ApiResult<T> => (result.ok ? { ok: true, data: result.data[key] } : result);

export const DesignBriefsApi = {
  create: async (token: string, input: DesignBriefInput) => unwrap(await call<{ brief: DesignBrief }>("/design-briefs", token, { method: "POST", body: input }), "brief"),
  update: async (token: string, id: string, input: DesignBriefInput) => unwrap(await call<{ brief: DesignBrief }>(`/design-briefs/${encodeURIComponent(id)}`, token, { method: "PUT", body: input }), "brief"),
  get: async (token: string, id: string) => unwrap(await call<{ brief: DesignBrief }>(`/design-briefs/${encodeURIComponent(id)}`, token), "brief"),
  list: async (token: string, status: DesignBriefStatus | "all" = "all") => unwrap(await call<{ briefs: DesignBrief[] }>(`/design-briefs${status === "all" ? "" : `?status=${status}`}`, token), "briefs"),
  remove: (token: string, id: string) => call<{ deleted: boolean }>(`/design-briefs/${encodeURIComponent(id)}`, token, { method: "DELETE" }),
  send: (token: string, id: string, recipients: { supplierIds: string[]; professionalIds: string[] }) =>
    call<{ brief: DesignBrief; added: number }>(`/design-briefs/${encodeURIComponent(id)}/send`, token, { method: "POST", body: recipients }),
  accept: async (token: string, id: string, replyId: string) => unwrap(await call<{ brief: DesignBrief }>(`/design-briefs/${encodeURIComponent(id)}/accept`, token, { method: "POST", body: { replyId } }), "brief"),
  close: async (token: string, id: string) => unwrap(await call<{ brief: DesignBrief }>(`/design-briefs/${encodeURIComponent(id)}/close`, token, { method: "POST", body: {} }), "brief"),
  /** Suppliers and professionals: what was sent to them. */
  inbox: async (token: string) => unwrap(await call<{ briefs: DesignBrief[] }>("/design-briefs/inbox", token), "briefs"),
  reply: async (token: string, id: string, input: { price: number; currency: string; leadTimeDays?: number; note?: string }) =>
    unwrap(await call<{ brief: DesignBrief }>(`/design-briefs/${encodeURIComponent(id)}/reply`, token, { method: "POST", body: input }), "brief"),
};

export interface DesignDraft {
  title: string;
  description: string;
  spaceType?: string;
  parts: BriefPart[];
  instructions: string;
  /** "ai" when a language model wrote it, "template" when it was built from the words of the brief. */
  source: "ai" | "template";
}

/** Asks the website for a first draft of a design from a few words. The administrator edits it before anything is sent. */
export async function requestDesignDraft(input: { brief: string; category: DesignCategory; spaceType?: string }): Promise<ApiResult<DesignDraft>> {
  try {
    const res = await fetch("/api/design-draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    if (!res.ok) return { ok: false, error: "Could not draft the design. Please try again." };
    return { ok: true, data: (await res.json()) as DesignDraft };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}
