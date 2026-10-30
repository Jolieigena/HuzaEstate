const ACCESS_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

export type RequestableRole = "customer" | "professional" | "supplier";
export type RoleRequestStatus = "pending" | "approved" | "declined";

export const REQUESTABLE_ROLE_LABELS: Record<RequestableRole, string> = {
  customer: "Customer",
  professional: "Professional",
  supplier: "Supplier",
};

export const OPEN_ADD_ROLE_EVENT = "huza:add-role";

/** What an account can still ask for. Administrator and organisation admin accounts hold one role only, and an account cannot be both
 *  a professional and a supplier. A seller applies through Become a seller, which has its own approval. */
export function requestableRolesFor(held: readonly string[] | undefined): RequestableRole[] {
  const roles = held ?? [];
  if (roles.includes("administrator") || roles.includes("organization_admin")) return [];
  return (["customer", "professional", "supplier"] as const).filter((role) => {
    if (roles.includes(role)) return false;
    if (role === "professional" && roles.includes("supplier")) return false;
    if (role === "supplier" && roles.includes("professional")) return false;
    return true;
  });
}

export const ROLE_REQUEST_STATUS_LABELS: Record<RoleRequestStatus, string> = {
  pending: "Waiting for approval",
  approved: "Approved",
  declined: "Declined",
};

export interface RoleRequestRecord {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userRoles?: string[];
  role: RequestableRole;
  note?: string;
  country?: string;
  professionalKind?: "individual" | "firm";
  status: RoleRequestStatus;
  adminNote?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface SubmitRoleRequestInput {
  role: RequestableRole;
  note?: string;
  country?: string;
  professionalKind?: "individual" | "firm";
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

export const RoleRequestsApi = {
  /** Asks for another role on the signed-in account. An administrator approves it. */
  submit: async (token: string, input: SubmitRoleRequestInput) => {
    const result = await call<{ request: RoleRequestRecord }>("/role-requests", token, { method: "POST", body: input });
    return result.ok ? ({ ok: true, data: result.data.request } as const) : result;
  },
  mine: async (token: string) => {
    const result = await call<{ requests: RoleRequestRecord[] }>("/role-requests/mine", token);
    return result.ok ? ({ ok: true, data: result.data.requests } as const) : result;
  },
  /** Administrators: everyone's requests. */
  listAll: async (token: string, status: RoleRequestStatus | "all" = "all") => {
    const result = await call<{ requests: RoleRequestRecord[] }>(`/role-requests${status === "all" ? "" : `?status=${status}`}`, token);
    return result.ok ? ({ ok: true, data: result.data.requests } as const) : result;
  },
  decide: async (token: string, id: string, decision: "approve" | "decline", adminNote?: string) => {
    const result = await call<{ request: RoleRequestRecord }>(`/role-requests/${encodeURIComponent(id)}`, token, { method: "PATCH", body: { decision, adminNote } });
    return result.ok ? ({ ok: true, data: result.data.request } as const) : result;
  },
};
