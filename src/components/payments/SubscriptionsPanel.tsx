"use client";

import { useState } from "react";
import type { AdminSubscriptionList, AdminUser } from "@/lib/admin/api";
import { AdminTable, EmptyState, StatusPill, formatDate, formatMoney } from "@/components/admin/ui";
import Select from "@/components/shared/Select";
import type { PaymentsSource } from "./paymentsSource";
import { LoadError, LoadingRow, Pager, SellerCell, Toolbar, useKeyedLoad } from "./shared";

const PAGE_SIZE = 25;
type TierFilter = "paid" | "all" | "free" | "silver" | "gold" | "diamond" | "code";

/** Posts used this month, with a small bar when the plan has a cap. */
function PostsUsed({ used, limit, extra }: { used: number; limit: number | null; extra: number }) {
  const cap = limit === null ? null : limit + extra;
  const percent = cap ? Math.min(Math.round((used / cap) * 100), 100) : 0;
  return (
    <div className="min-w-24">
      <p className="text-sm text-slate-700">
        {used} <span className="text-slate-400">/ {cap ?? "∞"}</span>
      </p>
      {cap !== null && (
        <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${percent >= 100 ? "bg-red-400" : percent >= 80 ? "bg-amber-400" : "bg-[#2ec440]"}`} style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  );
}

const filterClass = "w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15";
const filterLabel = "flex flex-col gap-1.5 text-xs font-semibold text-slate-700";

/** The recurring side: every seller's plan and how much of this month's posting they've used. A seller on
 *  an access code shows the plan the code gives, marked as such, and adds nothing to revenue. The headline
 *  numbers live in the page's overview cards, filled from this list's summary through `onSummary`. */
export default function SubscriptionsPanel({
  source,
  token,
  enabled,
  sellers,
  onSummary,
}: {
  source: PaymentsSource;
  token: string | null;
  enabled: boolean;
  sellers: Record<string, AdminUser>;
  onSummary: (summary: AdminSubscriptionList["summary"]) => void;
}) {
  const [tier, setTier] = useState<TierFilter>("paid");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const inScope = source.scope === "org";

  const key = `${tier}|${status}|${page}|${reload}`;
  const { data, error, loading } = useKeyedLoad(
    enabled && !!token,
    key,
    () => source.subscriptions(token as string, { tier: tier === "all" ? undefined : tier, status: status === "all" ? undefined : status, page, limit: PAGE_SIZE }),
    (list) => onSummary(list.summary),
  );

  return (
    <div>
      <Toolbar count={data?.total} noun="seller">
        <label className={filterLabel}>
          Plan
          <Select
            className={filterClass}
            value={tier}
            onChange={(e) => {
              setTier(e.target.value as TierFilter);
              setPage(1);
            }}
          >
            <option value="paid">Subscribed (any paid plan)</option>
            <option value="code">On an access code</option>
            <option value="all">All plans</option>
            <option value="free">Free</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="diamond">Diamond</option>
          </Select>
        </label>
        <label className={filterLabel}>
          Payment status
          <Select
            className={filterClass}
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
          </Select>
        </label>
      </Toolbar>

      {error ? (
        <LoadError message={error} onRetry={() => setReload((n) => n + 1)} />
      ) : loading && !data ? (
        <LoadingRow>Loading subscriptions…</LoadingRow>
      ) : data && data.subscriptions.length ? (
        <>
          <AdminTable headers={["Seller", "Plan", "Price", "Status", "Posts this month", "Stripe"]}>
            {data.subscriptions.map((sub) => (
              <tr key={sub.accountId} className="transition-colors hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <SellerCell accountId={sub.accountId} sellers={sellers} href={source.sellerHref} />
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                  {sub.label}
                  {sub.source === "code" && <span className="block text-xs font-medium text-emerald-600">Access code{sub.accessUntil ? ` until ${formatDate(sub.accessUntil)}` : ""}</span>}
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">{sub.priceCents ? `${formatMoney(sub.priceCents / 100, "USD")}/mo` : sub.source === "code" ? "Via code" : "Free"}</td>
                <td className="px-6 py-4">
                  <StatusPill status={sub.status} />
                  {sub.renewsOn && <p className="mt-1 text-xs text-slate-500">Renews {formatDate(sub.renewsOn)}</p>}
                </td>
                <td className="px-6 py-4">
                  <PostsUsed used={sub.postsUsed} limit={sub.postsLimit} extra={sub.extraCredits} />
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-400">
                  <span className="block max-w-28 truncate" title={sub.stripeSubscriptionId ?? undefined}>
                    {sub.stripeSubscriptionId ?? "—"}
                  </span>
                </td>
              </tr>
            ))}
          </AdminTable>
          <Pager page={page} total={data.total} limit={data.limit} onPage={setPage} />
        </>
      ) : (
        <EmptyState
          title={tier === "paid" ? (inScope ? "No subscribed sellers in scope" : "No subscribed sellers yet") : "No sellers match"}
          description={tier === "paid" ? (inScope ? "Sellers in your organisation's scope appear here once they subscribe to Silver, Gold or Diamond." : "Sellers appear here once they subscribe to Silver, Gold or Diamond.") : "Try a different plan or status filter."}
        />
      )}
    </div>
  );
}
