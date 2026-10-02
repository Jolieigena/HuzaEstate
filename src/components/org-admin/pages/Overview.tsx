"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AdminApi, type AdminOrganization } from "@/lib/admin/api";
import { PropertyApi } from "@/lib/properties/api";
import type { Property } from "@/lib/properties/types";
import { Card, PageFrame } from "@/components/admin/ui";

// Reuses the same two already-scoped reads the other org-admin pages use — AdminApi.listUsers's
// own `counts` object (already restricted server-side to this org's countries/staff when the
// caller isn't a platform admin, see access-service's listUsersByAdmin) and PropertyApi.all
// (scoped via the countries embedded in the caller's JWT, see property-service's listProperties)
// — grouped here into a stat-card landing page, mirroring the platform admin Dashboard's own
// lowercase/icon-card look.
export function OrgOverviewPage() {
  const { token, account, isAuthReady } = useAuth();
  const canView = account?.roles.includes("organization_admin") ?? false;
  const [org, setOrg] = useState<AdminOrganization | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [properties, setProperties] = useState<Property[] | null>(null);

  useEffect(() => {
    if (!isAuthReady || !token || !canView || !account?.organizationId) return;
    let cancelled = false;
    AdminApi.getOrganization(token, account.organizationId).then((result) => {
      if (!cancelled && result.ok) setOrg(result.data);
    });
    AdminApi.listUsers(token, { limit: 1 }).then((result) => {
      if (!cancelled && result.ok) setCounts(result.data.counts);
    });
    PropertyApi.all(token).then((result) => {
      if (!cancelled && result.ok) setProperties(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, account?.organizationId]);

  const dash = "–";
  const publishedCount = properties?.filter((p) => (p.status ?? "published") === "published").length;
  const underReviewCount = properties?.filter((p) => ["changes_requested", "rejected"].includes(p.status ?? "")).length;

  type CardDef = { name: string; value: string; href: string; icon: string; bg: string; fg: string; glow: string };
  const cards: CardDef[] = [
    { name: "properties", value: properties ? String(properties.length) : dash, href: "/org-admin/properties", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", bg: "bg-[#2ec440]/10", fg: "text-[#219b31]", glow: "bg-[#2ec440]/60" },
    { name: "published", value: publishedCount !== undefined ? String(publishedCount) : dash, href: "/org-admin/properties", icon: "M5 13l4 4L19 7", bg: "bg-emerald-50", fg: "text-emerald-600", glow: "bg-emerald-300" },
    { name: "needs review", value: underReviewCount !== undefined ? String(underReviewCount) : dash, href: "/org-admin/properties", icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z", bg: "bg-amber-50", fg: "text-amber-600", glow: "bg-amber-300" },
    { name: "sellers", value: counts ? String(counts.seller_manager ?? 0) : dash, href: "/org-admin/users", icon: "M20 7h-3V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2H4a1 1 0 00-1 1v11a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1zM9 5h6v2H9V5z", bg: "bg-rose-50", fg: "text-rose-600", glow: "bg-rose-300" },
    { name: "customers", value: counts ? String(counts.customer ?? 0) : dash, href: "/org-admin/users", icon: "M5.121 17.804A9 9 0 1118.879 6.196 9 9 0 015.12 17.804zM15 10a3 3 0 11-6 0 3 3 0 016 0z", bg: "bg-sky-50", fg: "text-sky-600", glow: "bg-sky-300" },
    { name: "professionals", value: counts ? String(counts.professional ?? 0) : dash, href: "/org-admin/professionals", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", bg: "bg-amber-50", fg: "text-amber-600", glow: "bg-amber-300" },
    { name: "staff", value: counts ? String(counts.organization_admin ?? 0) : dash, href: "/org-admin/staff", icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3.13a4 4 0 10-4-4 4 4 0 004 4zm6 3a4 4 0 10-4-4", bg: "bg-violet-50", fg: "text-violet-600", glow: "bg-violet-300" },
  ];

  return (
    <PageFrame title={org ? org.name : "overview"}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.name} href={c.href}>
            <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full ${c.glow} opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-20`} />
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${c.bg} ${c.fg} transition-transform duration-300 group-hover:scale-110`}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                </svg>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-500">{c.name}</p>
              <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">{c.value}</p>
            </Card>
          </Link>
        ))}
      </div>
    </PageFrame>
  );
}
