// property-service client for posting approved listings to the platform's X account (admin only).

const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:8081/api/property-service";

export type SocialPostStatus = "pending" | "posted" | "dry_run" | "skipped" | "failed" | "withdrawn";

export const SOCIAL_STATUS_LABELS: Record<SocialPostStatus, string> = {
  pending: "Queued",
  posted: "Posted",
  dry_run: "Rehearsed",
  skipped: "Skipped",
  failed: "Failed",
  withdrawn: "Taken down",
};

export interface SocialSettings {
  enabled: boolean;
  mode: "dry_run" | "live";
  dailyLimit: number;
  hashtags: string[];
  placeHashtags: boolean;
  /** Empty means every country. */
  countries: string[];
  deleteOnTakedown: boolean;
}

export interface SocialSettingsResponse {
  settings: SocialSettings;
  /** Whether the four X keys are set on the server. */
  credentialsConfigured: boolean;
}

export interface SocialPost {
  id: string;
  propertyId: string;
  title?: string;
  status: SocialPostStatus;
  text?: string;
  url?: string;
  attempts: number;
  nextAttemptAt?: string;
  lastError?: string;
  externalId?: string;
  postedAt?: string;
  createdAt: string;
}

export interface SocialPostList {
  posts: SocialPost[];
  total: number;
  page: number;
  limit: number;
  summary: Record<SocialPostStatus, number>;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(path: string, token: string, init: { method?: string; body?: unknown } = {}): Promise<Result<T>> {
  try {
    const res = await fetch(`${PROPERTY_API_URL}${path}`, {
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

export const SocialApi = {
  getSettings: (token: string) => call<SocialSettingsResponse>("/social/settings", token),
  updateSettings: (token: string, changes: Partial<SocialSettings>) => call<SocialSettingsResponse>("/social/settings", token, { method: "PUT", body: changes }),
  listPosts: (token: string, query: { status?: SocialPostStatus | ""; page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== "") params.set(key, String(value));
    const text = params.toString();
    return call<SocialPostList>(`/social/posts${text ? `?${text}` : ""}`, token);
  },
  retry: (token: string, id: string) => call<{ post: SocialPost }>(`/social/posts/${encodeURIComponent(id)}/retry`, token, { method: "POST" }),
  skip: (token: string, id: string) => call<{ post: SocialPost }>(`/social/posts/${encodeURIComponent(id)}/skip`, token, { method: "POST" }),
};
