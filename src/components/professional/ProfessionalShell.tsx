"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react";
import RequireAuth from "@/components/shared/RequireAuth";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { roleHome } from "@/lib/navigation";

// Professional accounts are created directly by an administrator (see
// POST /auth/admin/users) — there is no self-serve application/approval flow,
// so every account that reaches this shell either has the "professional" role
// already or doesn't belong here. Only Overview and Profile are backed by
// anything real (see PUT /professionals/me, account.profileCompleted); the
// rest of the old mock workspace concept (requests/quotations/reviews/etc.)
// never had a real backend and isn't reachable through this shell anymore.
const realNav = [
  ["Overview", "/professional"], ["Profile", "/professional/profile"],
] as const;

export default function ProfessionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { account, isAuthReady, switchRole } = useAuth();
  const [switchOpen, setSwitchOpen] = useState(false);
  const isProfessional = account?.roles.includes("professional") ?? false;

  useEffect(() => {
    if (!isAuthReady || !account || isProfessional) return;
    router.replace(roleHome(account.roles[0] ?? "customer"));
  }, [account, isAuthReady, isProfessional, router]);

  if (!isProfessional) {
    return (
      <RequireAuth>
        <div className="min-h-[60vh] flex items-center justify-center text-sm font-semibold text-slate-500">Redirecting…</div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="min-h-full bg-slate-50">
        <div className="border-b border-slate-200 bg-white px-4 sm:px-8">
          <div className="mx-auto max-w-[1440px] py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900">{account?.name}</h1>
                  {account?.profileCompleted === false && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Profile incomplete</span>
                  )}
                </div>
                {account?.profileCompleted === false && (
                  <p className="mt-1 text-sm text-slate-500">
                    Complete your <Link href="/professional/profile" className="font-bold text-[#219b31] hover:underline">public profile</Link> so clients can find and contact you.
                  </p>
                )}
              </div>
              {account?.roles.includes("customer") && (
                <button type="button" onClick={() => setSwitchOpen(true)} className="text-left text-sm font-bold text-slate-600 hover:text-[#2ec440]">Switch to Customer Dashboard</button>
              )}
            </div>
            <nav aria-label="Professional workspace" className="-mb-5 mt-5 flex gap-1 overflow-x-auto pb-1">
              {realNav.map(([name, href]) => {
                const active = href === "/professional" ? pathname === href : pathname.startsWith(href);
                return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-bold transition-colors ${active ? "border-[#2ec440] text-[#219b31]" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{name}</Link>;
              })}
            </nav>
          </div>
        </div>
        {children}
        {account?.roles.includes("customer") && (
          <ConfirmModal open={switchOpen} onClose={() => setSwitchOpen(false)} onConfirm={() => { switchRole("customer"); setSwitchOpen(false); router.push("/dashboard"); }} title="Switch account role?" description="Your professional drafts remain saved. You will continue with the same account in the Customer Dashboard." confirmLabel="Switch to Customer Dashboard" />
        )}
      </div>
    </RequireAuth>
  );
}
