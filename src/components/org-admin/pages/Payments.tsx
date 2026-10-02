"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { hasOrgPermission } from "@/lib/orgPermissions";
import { AdminApi, type AdminPaymentList, type AdminSubscriptionList, type AdminUser, type PaymentKind } from "@/lib/admin/api";
import { AdminTable, Card, EmptyState, PageFrame, RequirePermission, SecondaryButton, StatusPill, fieldClass, formatDate, formatDateTime, formatMoney } from "@/components/admin/ui";

const PAGE_SIZE = 25;
type Tier = "paid" | "all" | "free" | "silver" | "gold" | "diamond";
type Loaded = { key: string; data?: AdminSubscriptionList; error?: string };

const PAYMENT_KIND_LABELS: Record<PaymentKind, string> = { subscribe: "Plan", per_post: "Per-post", promote: "Promotion" };
type PaymentsLoaded = { key: string; data?: AdminPaymentList; error?: string };

// Mirrors the platform admin's own Seller Payments page (components/admin/pages/SellerPayments.tsx)
// exactly, just pointed at the /org endpoints — subscriptions and one-time payments from a seller
// with at least one listing in this organisation's countries, the same basis Properties/Inquiries
// already scope by. The "Seller" column falls back to a raw account id if the viewer doesn't also
// have manage_users (needed for the name/email lookup) — degraded, not broken.
export function OrgPaymentsPage() {
  const { token, account, isAuthReady } = useAuth();
  const canView = (account?.roles.includes("organization_admin") ?? false) && hasOrgPermission(account?.permissions, "view_payments");
  const [tier, setTier] = useState<Tier>("paid");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [sellers, setSellers] = useState<Record<string, AdminUser>>({});
  const [reload, setReload] = useState(0);

  const [paymentKind, setPaymentKind] = useState<"all" | PaymentKind>("all");
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsLoaded, setPaymentsLoaded] = useState<PaymentsLoaded | null>(null);
  const [paymentsReload, setPaymentsReload] = useState(0);

  useEffect(() => {
    if (!isAuthReady || !token || !canView) return;
    let cancelled = false;
    AdminApi.listUsers(token, { role: "seller_manager", limit: 200 }).then((users) => {
      if (!cancelled && users.ok) setSellers(Object.fromEntries(users.data.users.map((u) => [u.id, u])));
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView]);

  const key = `${tier}|${status}|${page}|${reload}`;
  useEffect(() => {
    if (!isAuthReady || !token || !canView) return;
    let cancelled = false;
    AdminApi.orgSubscriptions(token, { tier: tier === "all" ? undefined : tier, status: status === "all" ? undefined : status, page, limit: PAGE_SIZE }).then((subs) => {
      if (cancelled) return;
      setLoaded(subs.ok ? { key, data: subs.data } : { key, error: subs.error });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, tier, status, page, key]);

  const paymentsKey = `${paymentKind}|${paymentsPage}|${paymentsReload}`;
  useEffect(() => {
    if (!isAuthReady || !token || !canView) return;
    let cancelled = false;
    AdminApi.orgPayments(token, { kind: paymentKind === "all" ? undefined : paymentKind, page: paymentsPage, limit: PAGE_SIZE }).then((result) => {
      if (cancelled) return;
      setPaymentsLoaded(result.ok ? { key: paymentsKey, data: result.data } : { key: paymentsKey, error: result.error });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, paymentKind, paymentsPage, paymentsKey]);

  const loading = !loaded || loaded.key !== key;
  const data = loaded?.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const summary = data?.summary;

  const paymentsLoading = !paymentsLoaded || paymentsLoaded.key !== paymentsKey;
  const paymentsData = paymentsLoaded?.data;
  const paymentsTotalPages = paymentsData ? Math.max(1, Math.ceil(paymentsData.total / paymentsData.limit)) : 1;
  const paymentsSummary = paymentsData?.summary;

  return (
    <PageFrame title="Payments">
      <RequirePermission granted={canView}>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Subscribed sellers" value={summary ? String(summary.paidActive) : "–"} hint="Active paid plans, in scope" />
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
                      <p className="font-bold text-slate-900">{seller?.name ?? "Unknown account"}</p>
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
          <EmptyState title={tier === "paid" ? "No subscribed sellers in scope" : "No payment records match"} description={tier === "paid" ? "Sellers in your organisation's countries appear here once they subscribe to Silver, Gold or Diamond." : "Try a different plan or status filter."} />
        )}

        <div className="mt-10 mb-6">
          <h2 className="text-xl font-black text-slate-900">One-time payments</h2>
          <p className="mt-1 text-sm text-slate-500">Promotions and single extra-post purchases, from sellers in your organisation&apos;s countries.</p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Tile label="Total one-time revenue" value={paymentsSummary ? formatMoney(paymentsSummary.totalCents / 100, "USD") : "–"} hint="Per-post + promotion payments, in scope" />
          <Tile label="Promotions sold" value={paymentsSummary ? String(paymentsSummary.byKind.promote ?? 0) : "–"} hint={`Per-post: ${paymentsSummary?.byKind.per_post ?? "–"} · Plan checkouts: ${paymentsSummary?.byKind.subscribe ?? "–"}`} />
        </div>

        <Card className="mb-5">
          <label className="text-sm font-bold text-slate-700">
            Type
            <select
              className={`${fieldClass} mt-1`}
              value={paymentKind}
              onChange={(e) => {
                setPaymentKind(e.target.value as "all" | PaymentKind);
                setPaymentsPage(1);
              }}
            >
              <option value="all">All types</option>
              <option value="promote">Promotion</option>
              <option value="per_post">Per-post</option>
              <option value="subscribe">Plan</option>
            </select>
          </label>
        </Card>

        {paymentsLoaded?.error ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">
            {paymentsLoaded.error}{" "}
            <button className="font-bold underline" onClick={() => setPaymentsReload((n) => n + 1)}>
              Retry
            </button>
          </Card>
        ) : paymentsLoading && !paymentsData ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading payments…</p>
        ) : paymentsData && paymentsData.payments.length ? (
          <>
            <AdminTable headers={["Seller", "Type", "Amount", "Details", "Date"]}>
              {paymentsData.payments.map((payment) => {
                const seller = sellers[payment.accountId];
                return (
                  <tr key={payment.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{seller?.name ?? "Unknown account"}</p>
                      <p className="text-xs text-slate-500">{seller?.email ?? payment.accountId}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">{PAYMENT_KIND_LABELS[payment.kind]}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{formatMoney(payment.amountCents / 100, payment.currency?.toUpperCase() || "USD")}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {payment.kind === "promote" ? (
                        payment.propertyId ? (
                          <Link href={`/properties/${payment.propertyId}`} target="_blank" className="font-semibold text-slate-700 hover:text-[#219b31]">
                            {payment.propertyTitle ?? "Listing"} · {payment.days}d
                          </Link>
                        ) : (
                          `${payment.propertyTitle ?? "Listing"} · ${payment.days}d`
                        )
                      ) : payment.kind === "subscribe" ? (
                        payment.tier ? payment.tier.charAt(0).toUpperCase() + payment.tier.slice(1) : "—"
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{formatDateTime(payment.createdAt)}</td>
                  </tr>
                );
              })}
            </AdminTable>
            {paymentsTotalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <SecondaryButton disabled={paymentsPage <= 1} onClick={() => setPaymentsPage((p) => p - 1)}>
                  Previous
                </SecondaryButton>
                <span className="text-sm font-semibold text-slate-500">
                  Page {paymentsPage} of {paymentsTotalPages}
                </span>
                <SecondaryButton disabled={paymentsPage >= paymentsTotalPages} onClick={() => setPaymentsPage((p) => p + 1)}>
                  Next
                </SecondaryButton>
              </div>
            )}
          </>
        ) : (
          <EmptyState title="No one-time payments in scope" description="Promotion and per-post purchases from sellers in your organisation's countries will appear here." />
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
