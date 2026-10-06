// Real admin clients for access-service (user CRUD) and payment-service (seller plans) — the
// admin Users and Seller Payments pages read these instead of the old local mock directory.

const ACCESS_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";
const PAYMENT_API_URL = process.env.NEXT_PUBLIC_PAYMENT_API_URL || "http://localhost:8081/api/payment-service";

export type UserAccountType = "customer" | "seller_manager" | "professional" | "organization_admin" | "administrator";
export type UserStatus = "active" | "suspended";

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  roles: UserAccountType[];
  accountType: UserAccountType;
  status: UserStatus;
  isApprovedSeller: boolean;
  /** seller accounts only — per-seller bypass of listing review. true = publish immediately,
   *  false = always review, absent = inherit the country's organisation / platform default. */
  autoPublish?: boolean;
  mustChangePassword: boolean;
  profileCompleted: boolean;
  /** organization_admin accounts only. */
  organizationId?: string;
  organizationName?: string;
  /** organization_admin accounts only — cosmetic display label (e.g. "Account Manager"). */
  title?: string;
  /** professional accounts only — which country they operate in (scoping field, see
   *  access-service's createUserByAdmin). */
  country?: string;
  /** professional accounts only — admin-assigned, only meaningful for a country with real
   *  district data (lib/regions.ts, Rwanda only at launch). */
  district?: string;
  /** organization_admin accounts only — empty/absent means full access, see lib/orgPermissions.ts. */
  permissions?: string[];
  /** organization_admin accounts only — empty/absent means their org's whole country scope
   *  (lib/regions.ts). A narrower scope than `permissions`: which districts, not which features. */
  scopeDistricts?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrganization {
  id: string;
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  /** Country/countries this organisation operates in — admin-assigned (see lib/countries.ts's
   *  COUNTRY_OPTIONS for the picker), changeable any time. */
  countries: string[];
  /** Property categories (house / apartment / land) this organisation is limited to within its
   *  countries. Empty means every category. */
  propertyTypes: string[];
  /** Per-country region limits (admin-assigned). A country with no entry is covered whole. */
  regionScopes: { country: string; districts: string[] }[];
  /** Opt-in bypass of the platform's default listing-review requirement, for every one of
   *  `countries` above — undefined means "no opinion, inherit the platform default" (see
   *  admin Settings' requireListingReview); only an explicit true/false here overrides it. */
  autoPublish?: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export type OrgRequestReason = "add_country" | "remove_country" | "billing" | "account_access" | "other";
export type OrgRequestStatus = "open" | "resolved";

export interface AdminOrgRequest {
  id: string;
  organizationId: string;
  organizationName?: string;
  requestedBy: string;
  requestedByName?: string;
  reason: OrgRequestReason;
  message?: string;
  status: OrgRequestStatus;
  resolvedBy?: string;
  resolvedAt?: string;
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
  /** Platform-admin only — scopes to one organisation's staff (e.g. the Organisations page's
   *  "View staff" link). */
  organizationId?: string;
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
  /** 'code' when the plan shown comes from an access code rather than a paid subscription. */
  source?: "paid" | "code" | "free";
  accessUntil?: string;
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
  /** byTier counts what sellers can use today (access codes included); revenue is paid plans only. */
  summary: { byTier: Record<string, number>; paidActive: number; monthlyRecurringCents: number; onAccessCode: number };
}

export type PaymentKind = "subscribe" | "per_post" | "promote";
export interface AdminPayment {
  id: string;
  accountId: string;
  kind: PaymentKind;
  amountCents: number;
  currency: string;
  /** promote only */
  propertyId?: string;
  propertyTitle?: string;
  days?: number;
  /** subscribe only */
  tier?: string;
  createdAt: string;
}

export interface AdminPaymentList {
  payments: AdminPayment[];
  total: number;
  page: number;
  limit: number;
  /** oneTimeCents is per-post + promotion payments only; totalCents also counts plan sign-ups. */
  summary: { totalCents: number; oneTimeCents: number; byKind: Record<PaymentKind, number>; byKindCents: Record<PaymentKind, number> };
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
  updateUser: async (token: string, id: string, changes: Partial<Pick<AdminUser, "firstName" | "lastName" | "email" | "status" | "permissions" | "scopeDistricts">> & { autoPublish?: boolean | null }) => {
    const result = await call<{ user: AdminUser }>(`${ACCESS_API_URL}/auth/admin/users/${encodeURIComponent(id)}`, token, { method: "PATCH", body: changes });
    return result.ok ? ({ ok: true, data: result.data.user } as const) : result;
  },
  deleteUser: (token: string, id: string) =>
    call<{ deleted: boolean; cleanup: { propertiesRemoved: number | null; subscriptionRemoved: boolean | null } }>(`${ACCESS_API_URL}/auth/admin/users/${encodeURIComponent(id)}`, token, { method: "DELETE" }),
  listSubscriptions: (token: string, query: { tier?: string; status?: string; accountId?: string; page?: number; limit?: number } = {}) =>
    call<AdminSubscriptionList>(`${PAYMENT_API_URL}/subscriptions${qs({ ...query })}`, token),
  /** Every completed one-time or recurring payment — per-post, promotion, and plan subscriptions,
   *  all in one ledger (see payment-service's Payment model). */
  listPayments: (token: string, query: { kind?: PaymentKind | "one_time"; accountId?: string; page?: number; limit?: number } = {}) =>
    call<AdminPaymentList>(`${PAYMENT_API_URL}/subscriptions/payments${qs({ ...query })}`, token),
  /** organization_admin only: subscriptions/payments scoped to sellers with a listing in the
   *  caller's organisation's countries — same shape as listSubscriptions/listPayments. */
  orgSubscriptions: (token: string, query: { tier?: string; status?: string; page?: number; limit?: number } = {}) =>
    call<AdminSubscriptionList>(`${PAYMENT_API_URL}/subscriptions/org${qs({ ...query })}`, token),
  orgPayments: (token: string, query: { kind?: PaymentKind | "one_time"; page?: number; limit?: number } = {}) =>
    call<AdminPaymentList>(`${PAYMENT_API_URL}/subscriptions/payments/org${qs({ ...query })}`, token),
  listOrganizations: async (token: string, query: { country?: string } = {}) => {
    const result = await call<{ organizations: AdminOrganization[] }>(`${ACCESS_API_URL}/organizations${qs({ ...query })}`, token);
    return result.ok ? ({ ok: true, data: result.data.organizations } as const) : result;
  },
  getOrganization: async (token: string, id: string) => {
    const result = await call<{ organization: AdminOrganization }>(`${ACCESS_API_URL}/organizations/${encodeURIComponent(id)}`, token);
    return result.ok ? ({ ok: true, data: result.data.organization } as const) : result;
  },
  // contactEmail is required here (unlike updateOrganization) — it doubles as the login for the
  // first organization_admin account, auto-provisioned server-side in the same call (see
  // access-service's createOrganization). `admin.created` is false (with `admin.error` set) when
  // that email was already in use elsewhere — the organisation itself is still created either way.
  createOrganization: async (token: string, input: { name: string; description?: string; contactEmail: string; contactPhone?: string; address?: string; countries?: string[]; propertyTypes?: string[]; regionScopes?: { country: string; districts: string[] }[] }) => {
    const result = await call<{ organization: AdminOrganization; admin: { created: boolean; emailDelivered: boolean; error?: string } }>(`${ACCESS_API_URL}/organizations`, token, { method: "POST", body: input });
    return result.ok ? ({ ok: true, data: result.data } as const) : result;
  },
  updateOrganization: async (token: string, id: string, changes: Partial<Pick<AdminOrganization, "name" | "description" | "contactEmail" | "contactPhone" | "address" | "countries" | "propertyTypes" | "regionScopes">> & { autoPublish?: boolean | null }) => {
    const result = await call<{ organization: AdminOrganization }>(`${ACCESS_API_URL}/organizations/${encodeURIComponent(id)}`, token, { method: "PATCH", body: changes });
    return result.ok ? ({ ok: true, data: result.data.organization } as const) : result;
  },
  deleteOrganization: (token: string, id: string) =>
    call<{ deleted: boolean; membersUnassigned: number }>(`${ACCESS_API_URL}/organizations/${encodeURIComponent(id)}`, token, { method: "DELETE" }),
  createOrgRequest: async (token: string, input: { reason: OrgRequestReason; message?: string }) => {
    const result = await call<{ request: AdminOrgRequest }>(`${ACCESS_API_URL}/org-requests`, token, { method: "POST", body: input });
    return result.ok ? ({ ok: true, data: result.data.request } as const) : result;
  },
  listOrgRequests: async (token: string, query: { status?: OrgRequestStatus | "all" } = {}) => {
    const result = await call<{ requests: AdminOrgRequest[] }>(`${ACCESS_API_URL}/org-requests${qs({ ...query })}`, token);
    return result.ok ? ({ ok: true, data: result.data.requests } as const) : result;
  },
  resolveOrgRequest: async (token: string, id: string) => {
    const result = await call<{ request: AdminOrgRequest }>(`${ACCESS_API_URL}/org-requests/${encodeURIComponent(id)}/resolve`, token, { method: "PATCH" });
    return result.ok ? ({ ok: true, data: result.data.request } as const) : result;
  },
};
