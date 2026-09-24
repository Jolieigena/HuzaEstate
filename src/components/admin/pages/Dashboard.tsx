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
  const cards: [string, string, string][] = [
    ["Total accounts", users ? String(users.counts.all) : dash, "/admin/users"],
    ["Administrators", users ? String(users.counts.administrator) : dash, "/admin/users"],
    ["Professionals", users ? String(users.counts.professional) : dash, "/admin/professionals"],
    ["Sellers", users ? String(users.counts.seller_manager) : dash, "/admin/users"],
    ["Customers", users ? String(users.counts.customer) : dash, "/admin/users"],
    ["Active property listings", String(allProperties.length), "/admin/properties"],
    ["Subscribed sellers", plans ? String(plans.summary.paidActive) : dash, "/admin/payments"],
    ["Monthly recurring revenue", plans ? formatMoney(plans.summary.monthlyRecurringCents / 100, "USD") : dash, "/admin/payments"],
  ];

  return (
    <PageFrame title="Administration overview" description="A live summary of accounts, listings and seller subscriptions.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([name, value, href]) => (
          <Link key={name} href={href}>
            <Card className="p-4 transition-shadow hover:shadow-md">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{name}</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
            </Card>
          </Link>
        ))}
      </div>
    </PageFrame>
  );
}
