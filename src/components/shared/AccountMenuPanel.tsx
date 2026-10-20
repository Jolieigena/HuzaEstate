"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, type AccountRole } from "@/lib/auth-context";
import { ROLE_LABELS, availableRoles, roleHome } from "@/lib/navigation";

const itemClass = "block w-full px-4 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900";
const groupClass = "mt-1 border-t border-slate-50 pt-1";

// The workspace a page belongs to, so the menu follows where you are: on /manager "My Dashboard" is the Owner Portal even
// if the account last used another workspace. Public pages belong to none, and fall back to the account's current one.
function workspaceOfPath(pathname: string): AccountRole | null {
  const within = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);
  if (within("/admin")) return "administrator";
  if (within("/org-admin")) return "organization_admin";
  if (within("/manager") || within("/post-property")) return "seller_manager";
  if (within("/professional")) return "professional";
  if (within("/supplier")) return "supplier";
  if (["/dashboard", "/studio", "/execution", "/payments", "/invoices", "/contracts"].some(within)) return "customer";
  return null;
}

/** The inside of the account (avatar) menu, the same in every header on every page, so the menu never changes as
 *  someone moves between the public site and their portals. What is listed depends only on the account's roles:
 *  its own dashboard, the customer pages (only for accounts that can open them), the other workspaces it can
 *  switch to, then Change password and Log out. */
export default function AccountMenuPanel({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { account, activeRole: storedRole, switchRole, logout, logoutAll, savedAccounts, switchAccount, removeSavedAccount } = useAuth();
  const [switchError, setSwitchError] = useState("");
  const otherAccounts = savedAccounts.filter((saved) => !saved.active);
  const roles = availableRoles(account);
  const fromPath = workspaceOfPath(pathname);
  const activeRole = fromPath && roles.includes(fromPath) ? fromPath : storedRole;
  const isCustomer = roles.includes("customer");
  // Furniture orders can be placed by anyone who is not running the platform or a supplier business.
  const canOrder = roles.some((role) => role === "customer" || role === "seller_manager" || role === "professional");
  const otherWorkspaces = roles.filter((role) => role !== activeRole);

  const switchTo = (role: (typeof roles)[number]) => {
    onNavigate();
    if (switchRole(role)) router.push(roleHome(role));
  };

  // A full page load on the way in, so nothing held in memory for the account being left can show up for the next one.
  const switchToAccount = async (id: string, email: string) => {
    setSwitchError("");
    const result = await switchAccount(id);
    if (result.ok) {
      onNavigate();
      window.location.assign(result.account.path);
    } else if (result.needsPassword) {
      onNavigate();
      router.push(`/login?add=1&email=${encodeURIComponent(email)}`);
    } else setSwitchError(result.error);
  };

  return (
    <>
      <div className="mb-1 border-b border-slate-50 px-4 py-2">
        <div className="truncate text-sm font-bold text-slate-900">{account?.name ?? "HuzaEstate account"}</div>
        <div className="truncate text-xs text-slate-500">{account?.email ?? ""}</div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{ROLE_LABELS[activeRole]}</div>
      </div>

      <div className="border-b border-slate-50 pb-1">
        {otherAccounts.map((saved) => (
          <div key={saved.id} className="flex items-center hover:bg-slate-50">
            <button type="button" onClick={() => switchToAccount(saved.id, saved.email)} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2 text-left">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white" aria-hidden="true">
                {saved.name.charAt(0).toUpperCase() || "?"}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-900">{saved.name}</span>
                <span className="block truncate text-xs text-slate-500">{saved.locked ? "Sign in again" : saved.email}</span>
              </span>
            </button>
            {saved.locked && (
              <button type="button" onClick={() => removeSavedAccount(saved.id)} aria-label={`Remove ${saved.name} from this device`} className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600">
                <span aria-hidden="true">×</span>
              </button>
            )}
          </div>
        ))}
        {switchError && (
          <p role="alert" className="px-4 py-1 text-xs font-semibold text-red-600">
            {switchError}
          </p>
        )}
        <Link href="/login?add=1" onClick={onNavigate} className={`${itemClass} flex items-center gap-3`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          Add another account
        </Link>
      </div>

      <Link href={roleHome(activeRole)} onClick={onNavigate} className={itemClass}>
        My Dashboard
      </Link>
      <Link href="/properties" onClick={onNavigate} className={itemClass}>
        Browse Properties
      </Link>

      {(isCustomer || canOrder) && (
        <div className={groupClass}>
          {isCustomer && (
            <>
              <Link href="/dashboard?tab=saved" onClick={onNavigate} className={itemClass}>
                Saved Homes
              </Link>
              <Link href="/studio/build" onClick={onNavigate} className={itemClass}>
                Build Projects
              </Link>
              <Link href="/studio/renovate" onClick={onNavigate} className={itemClass}>
                Renovation Projects
              </Link>
              <Link href="/design-requests" onClick={onNavigate} className={itemClass}>
                My design requests
              </Link>
            </>
          )}
          {canOrder && (
            <Link href="/shop/orders" onClick={onNavigate} className={itemClass}>
              My Orders
            </Link>
          )}
        </div>
      )}

      {otherWorkspaces.length > 0 && (
        <div className={groupClass}>
          {otherWorkspaces.map((role) => (
            <button key={role} type="button" onClick={() => switchTo(role)} className={itemClass}>
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      )}

      <div className={groupClass}>
        {isCustomer && (
          <Link href="/dashboard/settings" onClick={onNavigate} className={itemClass}>
            Settings
          </Link>
        )}
        <Link href="/change-password" onClick={onNavigate} className={itemClass}>
          Change password
        </Link>
        <button
          type="button"
          onClick={() => {
            onNavigate();
            logout();
          }}
          className="w-full px-4 py-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          Log out
        </button>
        {savedAccounts.length > 1 && (
          <button
            type="button"
            onClick={() => {
              onNavigate();
              logoutAll();
            }}
            className="w-full px-4 py-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            Log out of all accounts
          </button>
        )}
      </div>
    </>
  );
}
