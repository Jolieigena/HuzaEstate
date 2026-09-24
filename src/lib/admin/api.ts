// Real admin clients for access-service (user CRUD) and payment-service (seller plans) — the
// admin Users and Seller Payments pages read these instead of the old local mock directory.

const ACCESS_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";
const PAYMENT_API_URL = process.env.NEXT_PUBLIC_PAYMENT_API_URL || "http://localhost:8081/api/payment-service";

export type UserAccountType = "customer" | "seller_manager" | "professional" | "administrator";
export type UserStatus = "active" | "suspended";

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  roles: UserAccountType[];
  accountType: UserAccountType;
  adminRole?: "super_admin" | "operations_admin";
  status: UserStatus;
  isApprovedSeller: boolean;
  mustChangePassword: boolean;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserList {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  counts: Record<"all" | UserAccountType, number>;
}

export interface UserListQuery {
  role?: UserAccountType | "all";
  status?: UserStatus | "all";
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminSubscription {
  accountId: string;
  tier: "free" | "silver" | "gold" | "diamond";
  label: string;
  status: "active" | "canceled" | "past_due";
  renewsOn?: string;
  priceCents: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  postsUsed: number;
  extraCredits: number;
  postsLimit: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSubscriptionList {
  subscriptions: AdminSubscription[];
  total: number;
  page: number;
  limit: number;
  summary: { byTier: Record<string, number>; paidActive: number; monthlyRecurringCents: number };
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(url: string, token: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
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

function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== "all") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const AdminApi = {
  listUsers: (token: string, query: UserListQuery = {}) =>
    call<AdminUserList>(`${ACCESS_API_URL}/auth/admin/users${qs({ ...query })}`, token),
  getUser: async (token: string, id: string) => {
    const result = await call<{ user: AdminUser }>(`${ACCESS_API_URL}/auth/admin/users/${encodeURIComponent(id)}`, token);
    return result.ok ? ({ ok: true, data: result.data.user } as const) : result;
  },
  updateUser: async (token: string, id: string, changes: Partial<Pick<AdminUser, "firstName" | "lastName" | "email" | "status" | "adminRole">>) => {
    const result = await call<{ user: AdminUser }>(`${ACCESS_API_URL}/auth/admin/users/${encodeURIComponent(id)}`, token, { method: "PATCH", body: changes });
    return result.ok ? ({ ok: true, data: result.data.user } as const) : result;
  },
  deleteUser: (token: string, id: string) =>
    call<{ deleted: boolean; cleanup: { propertiesRemoved: number | null; subscriptionRemoved: boolean | null } }>(`${ACCESS_API_URL}/auth/admin/users/${encodeURIComponent(id)}`, token, { method: "DELETE" }),
  listSubscriptions: (token: string, query: { tier?: string; status?: string; accountId?: string; page?: number; limit?: number } = {}) =>
    call<AdminSubscriptionList>(`${PAYMENT_API_URL}/subscriptions${qs({ ...query })}`, token),
};
