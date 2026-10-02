// access-service client for a signed-in account's own in-app notifications — the bell dropdown
// shared across every portal header (see components/shared/NotificationBell.tsx).

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  linkHref?: string;
  read: boolean;
  createdAt: string;
}

async function call<T>(path: string, token: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
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

export const NotificationsApi = {
  list: (token: string) => call<{ notifications: AppNotification[]; unreadCount: number }>("/notifications", token),
  markRead: (token: string, id: string) => call<{ notification: AppNotification }>(`/notifications/${encodeURIComponent(id)}/read`, token, { method: "PATCH" }),
  markAllRead: (token: string) => call<{ ok: true }>("/notifications/read-all", token, { method: "PATCH" }),
};
