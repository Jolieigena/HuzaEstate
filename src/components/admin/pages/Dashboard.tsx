"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AdminApi, type AdminSubscriptionList, type AdminUserList } from "@/lib/admin/api";
import { useAllProperties } from "@/lib/sellerListings/hooks";
import { Card, PageFrame, formatMoney } from "../ui";

export default function AdminDashboard() {
  const { token, isAuthReady } = useAuth();
  const allProperties = useAllProperties();
  const [users, setUsers] = useState<AdminUserList | null>(null);
  const [plans, setPlans] = useState<AdminSubscriptionList | null>(null);

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    Promise.all([AdminApi.listUsers(token, { limit: 1 }), AdminApi.listSubscriptions(token, { limit: 1 })]).then(([u, p]) => {
      if (cancelled) return;
      if (u.ok) setUsers(u.data);
      if (p.ok) setPlans(p.data);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token]);

  const dash = "–";
  type CardDef = { name: string; value: string; href: string; icon: string; bg: string; fg: string; glow: string };
  const cards: CardDef[] = [
    { name: "total accounts", value: users ? String(users.counts.all) : dash, href: "/admin/users", icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3.13a4 4 0 10-4-4 4 4 0 004 4zm6 3a4 4 0 10-4-4", bg: "bg-slate-900", fg: "text-white", glow: "bg-slate-400" },
    { name: "administrators", value: users ? String(users.counts.administrator) : dash, href: "/admin/users", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v2", bg: "bg-violet-50", fg: "text-violet-600", glow: "bg-violet-300" },
    { name: "professionals", value: users ? String(users.counts.professional) : dash, href: "/admin/users?role=professional", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", bg: "bg-amber-50", fg: "text-amber-600", glow: "bg-amber-300" },
    { name: "sellers", value: users ? String(users.counts.seller_manager) : dash, href: "/admin/users", icon: "M20 7h-3V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2H4a1 1 0 00-1 1v11a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1zM9 5h6v2H9V5z", bg: "bg-rose-50", fg: "text-rose-600", glow: "bg-rose-300" },
    { name: "customers", value: users ? String(users.counts.customer) : dash, href: "/admin/users", icon: "M5.121 17.804A9 9 0 1118.879 6.196 9 9 0 015.12 17.804zM15 10a3 3 0 11-6 0 3 3 0 016 0z", bg: "bg-sky-50", fg: "text-sky-600", glow: "bg-sky-300" },
    { name: "active property listings", value: String(allProperties.length), href: "/admin/properties", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", bg: "bg-[#2ec440]/10", fg: "text-[#219b31]", glow: "bg-[#2ec440]/60" },
    { name: "subscribed sellers", value: plans ? String(plans.summary.paidActive) : dash, href: "/admin/payments", icon: "M5 13l4 4L19 7", bg: "bg-cyan-50", fg: "text-cyan-600", glow: "bg-cyan-300" },
    { name: "monthly recurring revenue", value: plans ? formatMoney(plans.summary.monthlyRecurringCents / 100, "USD") : dash, href: "/admin/payments", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", bg: "bg-indigo-50", fg: "text-indigo-600", glow: "bg-indigo-300" },
  ];

  return (
    <PageFrame title="administration overview">
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
