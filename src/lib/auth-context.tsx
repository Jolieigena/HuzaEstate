"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type AccountRole = "customer" | "seller_manager" | "professional" | "contractor" | "administrator";

export interface DemoAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  roles: AccountRole[];
  professionalProfileId?: string;
  /** Administration & Operations Portal role. Kept as a loose string (not the
   * admin module's `AdminRole` type) so this core auth file doesn't import
   * from the admin feature module — matches how `professionalProfileId`
   * above stays untyped rather than importing professional types. */
  adminRole?: string;
  isApprovedSeller: boolean;
  portal: string;
  path: string;
}

interface AuthContextValue {
  isLoggedIn: boolean;
  login: () => void;
  /** Validates email/password against the demo portal accounts (see DEMO_ACCOUNTS below).
   * On success, logs in and sets the seller flag to match that account's portal. Returns
   * false (without changing auth state) when the credentials don't match a demo account. */
  loginWithCredentials: (email: string, password: string) => boolean;
  logout: () => void;
  isApprovedSeller: boolean;
  applyAsSeller: () => void;
  /** True once the stored auth state has been read (or has failed to be read). Use this to avoid
   * gating protected content on the initial `false` value of `isLoggedIn`, which is only a default
   * until the stored session is checked. */
  isAuthReady: boolean;
  account: DemoAccount | null;
  activeRole: AccountRole;
  switchRole: (role: AccountRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "huzaestate_auth";
const SELLER_STORAGE_KEY = "huzaestate_seller";
const ACCOUNT_STORAGE_KEY = "huzaestate_account_id";
const ROLE_STORAGE_KEY = "huzaestate_active_role";

/**
 * Demo accounts for the two portals in this app: the buyer/renter Dashboard
 * (isApprovedSeller: false) and the Manager Portal for approved sellers &
 * landlords (isApprovedSeller: true). Shown to testers on the login page.
 */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { id: "demo-user", name: "Jane Doe", email: "buyer@huzaestate.com", password: "buyer1234", roles: ["customer"], isApprovedSeller: false, portal: "Buyer, Build & Renovate", path: "/dashboard" },
  { id: "seller-user", name: "Jane Doe", email: "seller@huzaestate.com", password: "seller1234", roles: ["customer", "seller_manager"], isApprovedSeller: true, portal: "Manager Portal", path: "/manager" },
  { id: "aline-user", name: "Aline Uwase", email: "architect@huzaestate.com", password: "architect1234", roles: ["customer", "professional"], professionalProfileId: "pro-1", isApprovedSeller: false, portal: "Architect workspace", path: "/professional" },
  { id: "eric-user", name: "Eric Habimana", email: "structural@huzaestate.com", password: "structural1234", roles: ["customer", "professional"], professionalProfileId: "pro-structural", isApprovedSeller: false, portal: "Structural engineer workspace", path: "/professional" },
  { id: "diane-user", name: "Diane Mukamana", email: "surveyor@huzaestate.com", password: "surveyor1234", roles: ["customer", "professional"], professionalProfileId: "pro-3", isApprovedSeller: false, portal: "Quantity surveyor workspace", path: "/professional" },
  { id: "keza-user", name: "Keza Studio", email: "interior@huzaestate.com", password: "interior1234", roles: ["customer", "professional"], professionalProfileId: "pro-interior", isApprovedSeller: false, portal: "Interior designer workspace", path: "/professional" },
  { id: "imara-user", name: "Imara Construction Ltd", email: "contractor@huzaestate.com", password: "contractor1234", roles: ["customer", "contractor"], professionalProfileId: "contractor-imara", isApprovedSeller: false, portal: "Contractor workspace", path: "/professional" },
  { id: "moses-user", name: "Moses Karenzi", email: "electrical@huzaestate.com", password: "electrical1234", roles: ["customer", "professional"], professionalProfileId: "pro-electrical-pending", isApprovedSeller: false, portal: "Electrical engineer (application pending)", path: "/professional" },
] as const;

/**
 * Staff accounts for the Administration & Operations Portal (`/admin`).
 * Kept separate from DEMO_ACCOUNTS above and shown in a collapsed section on
 * the login page so the regular customer-facing demo list isn't crowded by
 * internal roles. `adminRole` is read by `src/lib/admin/permissions.ts`.
 */
export const ADMIN_DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { id: "admin-super", name: "Sam Nkurunziza", email: "super.admin@huzaestate.com", password: "superadmin1234", roles: ["administrator"], adminRole: "super_admin", isApprovedSeller: false, portal: "Super Administrator", path: "/admin" },
  { id: "admin-ops", name: "Grace Mutoni", email: "ops.admin@huzaestate.com", password: "opsadmin1234", roles: ["administrator"], adminRole: "operations_admin", isApprovedSeller: false, portal: "Operations Administrator", path: "/admin" },
  { id: "admin-verify", name: "Patrick Ndayisenga", email: "verification@huzaestate.com", password: "verify1234", roles: ["administrator"], adminRole: "verification_officer", isApprovedSeller: false, portal: "Professional Verification Officer", path: "/admin" },
  { id: "admin-listing", name: "Claudine Iradukunda", email: "listings@huzaestate.com", password: "listings1234", roles: ["administrator"], adminRole: "listing_moderator", isApprovedSeller: false, portal: "Listing Moderator", path: "/admin" },
  { id: "admin-support", name: "Eric Bizimana", email: "support@huzaestate.com", password: "support1234", roles: ["administrator"], adminRole: "support_dispute_officer", isApprovedSeller: false, portal: "Support and Dispute Officer", path: "/admin" },
  { id: "admin-content", name: "Divine Ingabire", email: "content@huzaestate.com", password: "content1234", roles: ["administrator"], adminRole: "content_manager", isApprovedSeller: false, portal: "Content Manager", path: "/admin" },
  { id: "admin-auditor", name: "Jean Paul Rugamba", email: "auditor@huzaestate.com", password: "auditor1234", roles: ["administrator"], adminRole: "auditor", isApprovedSeller: false, portal: "Auditor", path: "/admin" },
  { id: "admin-analyst", name: "Aline Umutoni", email: "analyst@huzaestate.com", password: "analyst1234", roles: ["administrator"], adminRole: "platform_analyst", isApprovedSeller: false, portal: "Platform Analyst", path: "/admin" },
] as const;

const ALL_LOGIN_ACCOUNTS: readonly DemoAccount[] = [...DEMO_ACCOUNTS, ...ADMIN_DEMO_ACCOUNTS];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isApprovedSeller, setIsApprovedSeller] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [account, setAccount] = useState<DemoAccount | null>(null);
  const [activeRole, setActiveRole] = useState<AccountRole>("customer");

  useEffect(() => {
    try {
      // Reading the persisted prototype session requires a one-time client sync.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoggedIn(localStorage.getItem(STORAGE_KEY) === "true");
      setIsApprovedSeller(localStorage.getItem(SELLER_STORAGE_KEY) === "true");
      const storedAccount = ALL_LOGIN_ACCOUNTS.find((item) => item.id === localStorage.getItem(ACCOUNT_STORAGE_KEY)) ?? null;
      setAccount(storedAccount);
      const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as AccountRole | null;
      if (storedRole && storedAccount?.roles.includes(storedRole)) setActiveRole(storedRole);
    } catch {
      // localStorage unavailable, stay logged out
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  const login = () => {
    setIsLoggedIn(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  };

  const loginWithCredentials = (email: string, password: string) => {
    const account = ALL_LOGIN_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
    );
    if (!account) return false;

    setIsLoggedIn(true);
    setIsApprovedSeller(account.isApprovedSeller);
    setAccount(account);
    const destinationRole: AccountRole = account.roles.includes("administrator") ? "administrator" : account.roles.includes("contractor") ? "contractor" : account.roles.includes("professional") ? "professional" : account.isApprovedSeller ? "seller_manager" : "customer";
    setActiveRole(destinationRole);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
      localStorage.setItem(ACCOUNT_STORAGE_KEY, account.id);
      localStorage.setItem(ROLE_STORAGE_KEY, destinationRole);
      if (account.isApprovedSeller) {
        localStorage.setItem(SELLER_STORAGE_KEY, "true");
      } else {
        localStorage.removeItem(SELLER_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
    return true;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setAccount(null);
    setActiveRole("customer");
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACCOUNT_STORAGE_KEY);
      localStorage.removeItem(ROLE_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const switchRole = (role: AccountRole) => {
    if (!account?.roles.includes(role)) return false;
    setActiveRole(role);
    try { localStorage.setItem(ROLE_STORAGE_KEY, role); } catch { /* preference remains session-only */ }
    return true;
  };

  const applyAsSeller = () => {
    setIsApprovedSeller(true);
    try {
      localStorage.setItem(SELLER_STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, loginWithCredentials, logout, isApprovedSeller, applyAsSeller, isAuthReady, account, activeRole, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
