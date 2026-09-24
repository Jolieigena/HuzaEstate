"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useHasPermission } from "@/lib/admin/hooks";
import { AdminApi, type AdminSubscriptionList, type AdminUser } from "@/lib/admin/api";
import { AdminTable, Card, EmptyState, PageFrame, RequirePermission, SecondaryButton, StatusPill, fieldClass, formatDate, formatMoney } from "../ui";

const PAGE_SIZE = 25;
type Tier = "paid" | "all" | "free" | "silver" | "gold" | "diamond";
type Loaded = { key: string; data?: AdminSubscriptionList; error?: string };

export function SellerPaymentsPage() {
  const { account, token, isAuthReady } = useAuth();
  const canView = useHasPermission(account?.id, "finance.view");
  const [tier, setTier] = useState<Tier>("paid");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [sellers, setSellers] = useState<Record<string, AdminUser>>({});
  const [reload, setReload] = useState(0);

  const key = `${tier}|${status}|${page}|${reload}`;
  useEffect(() => {
    if (!isAuthReady || !token || !canView) return;
    let cancelled = false;
    Promise.all([
      AdminApi.listSubscriptions(token, { tier: tier === "all" ? undefined : tier, status: status === "all" ? undefined : status, page, limit: PAGE_SIZE }),
      AdminApi.listUsers(token, { role: "seller_manager", limit: 200 }),
    ]).then(([subs, users]) => {
      if (cancelled) return;
      setLoaded(subs.ok ? { key, data: subs.data } : { key, error: subs.error });
      if (users.ok) setSellers(Object.fromEntries(users.data.users.map((u) => [u.id, u])));
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, tier, status, page, key]);

  const loading = !loaded || loaded.key !== key;
  const data = loaded?.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const summary = data?.summary;

  return (
    <PageFrame title="Seller Payments" description="Every seller's posting plan, what they pay, and how much of this month's quota they've used.">
      <RequirePermission granted={canView}>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Subscribed sellers" value={summary ? String(summary.paidActive) : "–"} hint="Active paid plans" />
          <Tile label="Monthly recurring revenue" value={summary ? formatMoney(summary.monthlyRecurringCents / 100, "USD") : "–"} hint="From active paid plans" />
          <Tile label="Silver / Gold / Diamond" value={summary ? `${summary.byTier.silver ?? 0} / ${summary.byTier.gold ?? 0} / ${summary.byTier.diamond ?? 0}` : "–"} hint="Sellers per paid tier" />
          <Tile label="Free plan" value={summary ? String(summary.byTier.free ?? 0) : "–"} hint="Sellers on the free plan" />
        </div>

        <Card className="mb-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">
              Plan
              <select
                className={`${fieldClass} mt-1`}
                value={tier}
                onChange={(e) => {
                  setTier(e.target.value as Tier);
                  setPage(1);
                }}
              >
                <option value="paid">Subscribed (any paid plan)</option>
                <option value="all">All plans</option>
                <option value="free">Free</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="diamond">Diamond</option>
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              Payment status
              <select
                className={`${fieldClass} mt-1`}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Any status</option>
                <option value="active">Active</option>
                <option value="past_due">Past due</option>
                <option value="canceled">Canceled</option>
              </select>
            </label>
          </div>
        </Card>

        {loaded?.error ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">
            {loaded.error}{" "}
            <button className="font-bold underline" onClick={() => setReload((n) => n + 1)}>
              Retry
            </button>
          </Card>
        ) : loading && !data ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading payments…</p>
        ) : data && data.subscriptions.length ? (
          <>
            <AdminTable headers={["Seller", "Plan", "Price", "Status", "Renews", "Posts this month", "Stripe subscription"]}>
              {data.subscriptions.map((sub) => {
                const seller = sellers[sub.accountId];
                return (
                  <tr key={sub.accountId} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <Link href={`/admin/users/${sub.accountId}`} className="font-bold text-slate-900 hover:text-[#219b31]">
                        {seller?.name ?? "Unknown account"}
                      </Link>
                      <p className="text-xs text-slate-500">{seller?.email ?? sub.accountId}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">{sub.label}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{sub.priceCents ? `${formatMoney(sub.priceCents / 100, "USD")}/mo` : "Free"}</td>
                    <td className="px-6 py-4">
                      <StatusPill status={sub.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{sub.renewsOn ? formatDate(sub.renewsOn) : "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {sub.postsUsed} / {sub.postsLimit ?? "∞"}
                      {sub.extraCredits ? <span className="text-xs text-slate-400"> (+{sub.extraCredits} paid)</span> : null}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 break-all">{sub.stripeSubscriptionId ?? "—"}</td>
                  </tr>
                );
              })}
            </AdminTable>
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <SecondaryButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </SecondaryButton>
                <span className="text-sm font-semibold text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <SecondaryButton disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </SecondaryButton>
              </div>
            )}
          </>
        ) : (
          <EmptyState title={tier === "paid" ? "No subscribed sellers yet" : "No payment records match"} description={tier === "paid" ? "Sellers appear here once they subscribe to Silver, Gold or Diamond." : "Try a different plan or status filter."} />
        )}
      </RequirePermission>
    </PageFrame>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </Card>
  );
}
