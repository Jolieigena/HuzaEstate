"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/shared/RequireAuth";
import { useAuth } from "@/lib/auth-context";
import type { AdminRole } from "@/lib/admin/types";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import AdminMobileDrawer from "./AdminMobileDrawer";

function AccessDenied({ homePath }: { homePath: string }) {
  return (
    <div className="flex min-h-[75vh] items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v2" />
          </svg>
        </div>
        <h1 className="text-xl font-black text-slate-900">You do not have permission to access the Administration Portal.</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">This area is reserved for HuzaEstate staff accounts. If you believe this is a mistake, contact a Super Administrator.</p>
        <Link href={homePath} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
          Return to your dashboard
        </Link>
      </div>
    </div>
  );
}

/**
 * Self-contained shell for `/admin/*` — deliberately does not reuse the
 * customer AppHeader/Sidebar (see AppShell.tsx's `/admin` passthrough
 * branch). Layers a permission gate on top of RequireAuth: a logged-in
 * account without an admin role assignment sees an inline access-denied
 * panel (never a redirect loop, never a data leak), mirroring the pattern
 * ProfessionalShell uses for accounts without an approved professional
 * profile.
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  const { account, isAuthReady } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const adminRole = account?.adminRole as AdminRole | undefined;

  return (
    <RequireAuth>
      {!isAuthReady || !account ? null : !adminRole ? (
        <AccessDenied homePath={account.path || "/dashboard"} />
      ) : (
        <div className="min-h-full bg-slate-50">
          <AdminHeader adminRole={adminRole} onOpenMobileSidebar={() => setMobileOpen(true)} />
          <div className="flex min-h-[calc(100vh-65px)]">
            <AdminSidebar adminRole={adminRole} />
            <AdminMobileDrawer adminRole={adminRole} open={mobileOpen} onClose={() => setMobileOpen(false)} />
            <main className="flex-grow min-w-0">{children}</main>
          </div>
        </div>
      )}
    </RequireAuth>
  );
}
