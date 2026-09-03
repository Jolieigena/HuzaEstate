"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react";
import RequireAuth from "@/components/shared/RequireAuth";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { useProfessionalProfile } from "@/lib/professional/hooks";

const nav = [
  ["Overview", "/professional"], ["Requests", "/professional/requests"], ["Projects", "/professional/projects"],
  ["Reviews", "/professional/reviews"], ["Quotations", "/professional/quotations"], ["Messages", "/professional/messages"],
  ["Calendar", "/professional/calendar"], ["Documents", "/professional/documents"], ["Profile", "/professional/profile"],
  ["Activity", "/professional/activity"], ["Settings", "/professional/settings"],
] as const;

export default function ProfessionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { account, isAuthReady, switchRole } = useAuth();
  const [switchOpen, setSwitchOpen] = useState(false);
  const profile = useProfessionalProfile(account?.id);
  const applicationRoute = pathname.startsWith("/professional/application");

  useEffect(() => {
    if (!isAuthReady || !account || applicationRoute) return;
    if (!profile) router.replace(`/professionals/apply?reason=profile_required&redirect=${encodeURIComponent(pathname)}`);
    else if (profile.status !== "approved") router.replace("/professional/application/status");
  }, [account, applicationRoute, isAuthReady, pathname, profile, router]);

  return (
    <RequireAuth>
      {applicationRoute ? children : profile?.status === "approved" ? (
        <div className="min-h-full bg-slate-50">
          <div className="border-b border-slate-200 bg-white px-4 sm:px-8">
            <div className="mx-auto max-w-[1440px] py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-black text-slate-900">{profile.displayName}</h1>
                    <span className="rounded-full bg-[#2ec440]/10 px-2.5 py-1 text-xs font-bold text-[#219b31]">{profile.verificationLabel}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{profile.primarySpecialisation} · {profile.city} · {profile.availability === "available" ? "Available" : profile.availability === "limited" ? "Limited availability" : "Not accepting new work"}</p>
                </div>
                <button type="button" onClick={() => setSwitchOpen(true)} className="text-left text-sm font-bold text-slate-600 hover:text-[#2ec440]">Switch to Customer Dashboard</button>
              </div>
              <nav aria-label="Professional workspace" className="-mb-5 mt-5 flex gap-1 overflow-x-auto pb-1">
                {nav.filter(([name]) => name !== "Quotations" || profile.kind.includes("contractor") || profile.services.some((service) => service.name.toLowerCase().includes("quotation"))).map(([name, href]) => {
                  const active = href === "/professional" ? pathname === href : pathname.startsWith(href);
                  return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-bold transition-colors ${active ? "border-[#2ec440] text-[#219b31]" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{name}</Link>;
                })}
              </nav>
            </div>
          </div>
          {children}
          <ConfirmModal open={switchOpen} onClose={() => setSwitchOpen(false)} onConfirm={() => { switchRole("customer"); setSwitchOpen(false); router.push("/dashboard"); }} title="Switch account role?" description="Your professional drafts remain saved. You will continue with the same account in the Customer Dashboard." confirmLabel="Switch to Customer Dashboard" />
        </div>
      ) : <div className="min-h-[60vh] flex items-center justify-center text-sm font-semibold text-slate-500">Opening your professional access…</div>}
    </RequireAuth>
  );
}
