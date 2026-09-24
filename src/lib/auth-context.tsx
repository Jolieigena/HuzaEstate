"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// 'contractor' removed — nothing anywhere creates one (dead scaffolding in the original account
// model, matching access-service's accountRoles). Revisit if/when contractor work is scoped.
export type AccountRole = "customer" | "seller_manager" | "professional" | "administrator";

export interface Account {
  id: string;
  name: string;
  email: string;
  roles: AccountRole[];
  professionalProfileId?: string;
  isApprovedSeller: boolean;
  /** True for accounts created by an administrator (or the bootstrap admin account) that are
   * still on their own emailed, randomly generated password. The app should force a
   * change-password step before letting the account use anything else. */
  mustChangePassword?: boolean;
  /** Professional accounts only. False until the account has saved a complete public profile
   * (see PUT /professionals/me) — the app should force that step next, same as mustChangePassword. */
  profileCompleted?: boolean;
  path: string;
}

export interface SignupInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  termsAccepted: boolean;
}

export type AuthResult = { ok: true; account: Account; token: string } | { ok: false; error: string };

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  roleType: Extract<AccountRole, "administrator" | "professional">;
  /** Required when roleType is "professional" — chosen once at creation, not editable by the
   * professional themselves afterwards (see access-service's professionals module). */
  professionalKind?: "individual" | "firm";
}

export type CreateUserResult = { ok: true; emailDelivered: boolean } | { ok: false; error: string };


interface AuthContextValue {
  isLoggedIn: boolean;
  signup: (input: SignupInput) => Promise<AuthResult>;
  loginWithCredentials: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResult>;
  logout: () => void;
  isApprovedSeller: boolean;
  /** Re-fetches /auth/me and updates the local account — used after a backend-driven role/plan
   * change the client didn't cause directly (payment-service granting seller_manager after a
   * free-tier pick or a Stripe webhook, a professional completing their profile, etc). */
  refreshAccount: () => Promise<void>;
  /** True once the initial session check (validating any stored token against the
   * backend) has finished. Use this to avoid gating protected content on the
   * initial `false` value of `isLoggedIn`, which is only a default until then. */
  isAuthReady: boolean;
  account: Account | null;
  activeRole: AccountRole;
  switchRole: (role: AccountRole) => boolean;
  /** The current JWT, for authenticated calls to OTHER backend services (property-service,
   * etc.) — those verify it locally against the same shared secret access-service signs
   * with, so no extra round-trip through access-service is needed. Null when logged out. */
  token: string | null;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  /** Administrator-only (backend rejects otherwise). Creates an Administrator or Professional
   * account with its own random password, emailed to it — never returned here. */
  createUser: (input: CreateUserInput) => Promise<CreateUserResult>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = "huzaestate_token";
const ROLE_STORAGE_KEY = "huzaestate_active_role";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

function deriveActiveRole(account: Account, preferred?: string | null): AccountRole {
  if (preferred && account.roles.includes(preferred as AccountRole)) return preferred as AccountRole;
  if (account.roles.includes("administrator")) return "administrator";
  if (account.roles.includes("professional")) return "professional";
  if (account.isApprovedSeller && account.roles.includes("seller_manager")) return "seller_manager";
  return "customer";
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.message || data?.error || "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isApprovedSeller, setIsApprovedSeller] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [activeRole, setActiveRole] = useState<AccountRole>("customer");
  const [token, setToken] = useState<string | null>(null);

  const applySession = (nextToken: string, nextAccount: Account) => {
    let preferredRole: string | null = null;
    try { preferredRole = localStorage.getItem(ROLE_STORAGE_KEY); } catch { /* ignore */ }
    const role = deriveActiveRole(nextAccount, preferredRole);
    setToken(nextToken);
    setAccount(nextAccount);
    setIsLoggedIn(true);
    setIsApprovedSeller(nextAccount.isApprovedSeller);
    setActiveRole(role);
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
      localStorage.setItem(ROLE_STORAGE_KEY, role);
    } catch { /* ignore */ }
  };

  const clearSession = () => {
    setToken(null);
    setAccount(null);
    setIsLoggedIn(false);
    setIsApprovedSeller(false);
    setActiveRole("customer");
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(ROLE_STORAGE_KEY);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    let storedToken: string | null = null;
    try { storedToken = localStorage.getItem(TOKEN_STORAGE_KEY); } catch { /* ignore */ }
    if (!storedToken) {
      // No stored session to validate — reading that fact requires a one-time client sync.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthReady(true);
      return;
    }
    (async () => {
      try {
        // Roles/isApprovedSeller are re-fetched live from the backend on every
        // load instead of trusted from a cached blob — access is driven by MongoDB, not
        // a value frozen at the moment the token was issued.
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (!res.ok) throw new Error("unauthenticated");
        const data = await res.json();
        applySession(storedToken as string, data.account as Account);
      } catch {
        clearSession();
      } finally {
        setIsAuthReady(true);
      }
    })();
  }, []);

  const signup = async (input: SignupInput): Promise<AuthResult> => {
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-huza-client": "web" },
        body: JSON.stringify(input),
      });
      if (!res.ok) return { ok: false, error: await parseErrorMessage(res) };
      const data = await res.json();
      const nextAccount = data.account as Account;
      applySession(data.token as string, nextAccount);
      return { ok: true, account: nextAccount, token: data.token as string };
    } catch {
      return { ok: false, error: "Could not reach the server. Please try again." };
    }
  };

  const loginWithCredentials = async (email: string, password: string, rememberMe = false): Promise<AuthResult> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-huza-client": "web" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      if (!res.ok) return { ok: false, error: await parseErrorMessage(res) };
      const data = await res.json();
      const nextAccount = data.account as Account;
      applySession(data.token as string, nextAccount);
      return { ok: true, account: nextAccount, token: data.token as string };
    } catch {
      return { ok: false, error: "Could not reach the server. Please try again." };
    }
  };

  const logout = () => {
    const activeToken = token;
    clearSession();
    if (activeToken) {
      // Best-effort: clears the httpOnly cookie server-side too. The token itself is
      // stateless, so failure here doesn't leave the client in a logged-in state.
      fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-huza-client": "web", Authorization: `Bearer ${activeToken}` },
      }).catch(() => { /* ignore */ });
    }
  };

  const switchRole = (role: AccountRole) => {
    if (!account?.roles.includes(role)) return false;
    setActiveRole(role);
    try { localStorage.setItem(ROLE_STORAGE_KEY, role); } catch { /* preference remains session-only */ }
    return true;
  };

  const refreshAccount = async (): Promise<void> => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      const nextAccount = data.account as Account;
      setAccount(nextAccount);
      setIsApprovedSeller(nextAccount.isApprovedSeller);
    } catch {
      /* best-effort — caller's UI already has a fallback for a stale account view */
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
    if (!token) return { ok: false, error: "Please sign in again." };
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-huza-client": "web", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) return { ok: false, error: await parseErrorMessage(res) };
      const data = await res.json();
      const nextAccount = data.account as Account;
      setAccount(nextAccount);
      return { ok: true, account: nextAccount, token };
    } catch {
      return { ok: false, error: "Could not reach the server. Please try again." };
    }
  };

  const createUser = async (input: CreateUserInput): Promise<CreateUserResult> => {
    if (!token) return { ok: false, error: "Please sign in again." };
    try {
      const res = await fetch(`${API_URL}/auth/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-huza-client": "web", Authorization: `Bearer ${token}` },
        body: JSON.stringify(input),
      });
      if (!res.ok) return { ok: false, error: await parseErrorMessage(res) };
      const data = await res.json();
      return { ok: true, emailDelivered: data.emailDelivered === true };
    } catch {
      return { ok: false, error: "Could not reach the server. Please try again." };
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, signup, loginWithCredentials, logout, isApprovedSeller, refreshAccount, isAuthReady, account, activeRole, switchRole, token, changePassword, createUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
