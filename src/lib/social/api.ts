// property-service client for posting approved listings to social networks (admin only). Each network
// is a "channel" the server reports; the page and this client work for any number of them.

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

export interface SocialChannel {
  id: string;
  label: string;
  postLimit: number;
  /** Whether the server has this network's keys. */
  credentialsConfigured: boolean;
  settings: SocialSettings;
}

export interface SocialPost {
  id: string;
  propertyId: string;
  channel: string;
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

export interface SocialListing {
  id: string;
  title?: string;
  imageUrl?: string;
  city?: string;
  country?: string;
  location?: string;
  price?: number;
  currency?: string;
  type?: string;
  /** Set when this listing already has a post on the channel. */
  postStatus?: SocialPostStatus;
}

export interface SocialListingList {
  listings: SocialListing[];
  total: number;
  page: number;
  limit: number;
}

export interface SocialPreview {
  text: string;
  length: number;
  limit: number;
  postable: boolean;
  reason?: string;
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
  listChannels: (token: string) => call<{ channels: SocialChannel[] }>("/social/channels", token),
  updateChannel: (token: string, channel: string, changes: Partial<SocialSettings>) =>
    call<{ channel: SocialChannel }>(`/social/channels/${encodeURIComponent(channel)}`, token, { method: "PUT", body: changes }),
  listPosts: (token: string, query: { channel?: string; status?: SocialPostStatus | ""; page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== "") params.set(key, String(value));
    const text = params.toString();
    return call<SocialPostList>(`/social/posts${text ? `?${text}` : ""}`, token);
  },
  listListings: (token: string, query: { channel: string; search?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== "") params.set(key, String(value));
    return call<SocialListingList>(`/social/listings?${params.toString()}`, token);
  },
  preview: (token: string, channel: string, propertyId: string) =>
    call<SocialPreview>(`/social/preview?channel=${encodeURIComponent(channel)}&propertyId=${encodeURIComponent(propertyId)}`, token),
  createPosts: (token: string, input: { channel: string; propertyIds: string[]; text?: string }) =>
    call<{ queued: number; skipped: { propertyId: string; title?: string; reason: string }[] }>("/social/posts", token, { method: "POST", body: input }),
  retry: (token: string, id: string) => call<{ post: SocialPost }>(`/social/posts/${encodeURIComponent(id)}/retry`, token, { method: "POST" }),
  skip: (token: string, id: string) => call<{ post: SocialPost }>(`/social/posts/${encodeURIComponent(id)}/skip`, token, { method: "POST" }),
};
