"use client";

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
  const { account, activeRole: storedRole, switchRole, logout } = useAuth();
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

  return (
    <>
      <div className="mb-1 border-b border-slate-50 px-4 py-2">
        <div className="truncate text-sm font-bold text-slate-900">{account?.name ?? "HuzaEstate account"}</div>
        <div className="truncate text-xs text-slate-500">{account?.email ?? ""}</div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{ROLE_LABELS[activeRole]}</div>
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
      </div>
    </>
  );
}
