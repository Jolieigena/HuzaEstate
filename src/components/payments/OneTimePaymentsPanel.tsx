"use client";

import { useEffect, useState } from "react";
import InfiniteSentinel from "@/components/shared/InfiniteSentinel";
import { useInfinitePages } from "@/lib/useInfinitePages";
import Link from "next/link";
import type { AdminPayment, AdminPaymentList, AdminUser, PaymentKind } from "@/lib/admin/api";
import { AdminTable, EmptyState, formatDateTime } from "@/components/admin/ui";
import { useDisplayCurrency } from "@/lib/currency/display";
import Select from "@/components/shared/Select";
import type { PaymentsSource } from "./paymentsSource";
import { LoadError, LoadingRow, SellerCell, Toolbar } from "./shared";

const PAGE_SIZE = 25;
type OneTimeKind = Exclude<PaymentKind, "subscribe">;
const KIND_LABELS: Record<OneTimeKind, string> = { promote: "Paid promotion", per_post: "Extra post" };
const KIND_STYLES: Record<OneTimeKind, string> = { promote: "bg-emerald-50 text-emerald-700", per_post: "bg-slate-100 text-slate-600" };

const filterClass = "w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15";
const filterLabel = "flex flex-col gap-1.5 text-xs font-semibold text-slate-700";

function PaymentDetails({ payment }: { payment: AdminPayment }) {
  if (payment.kind === "promote") {
    const text = `${payment.propertyTitle ?? "Listing"} · promoted for ${payment.days} ${payment.days === 1 ? "day" : "days"}`;
    return payment.propertyId ? (
      <Link href={`/properties/${payment.propertyId}`} target="_blank" className="font-semibold text-slate-700 hover:text-[#219b31]">
        {text}
      </Link>
    ) : (
      <>{text}</>
    );
  }
  return <>One extra listing</>;
}

/** The one-off side: single extra posts and listing promotions. Plan sign-ups are deliberately not here
 *  (they belong to Subscriptions), so the revenue figure is only what these purchases brought in. The
 *  headline numbers live in the page's overview cards, filled from this list's summary through `onSummary`. */
export default function OneTimePaymentsPanel({
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
  onSummary: (summary: AdminPaymentList["summary"]) => void;
}) {
  const { format } = useDisplayCurrency();
  const [kind, setKind] = useState<"all" | OneTimeKind>("all");
  const [reload, setReload] = useState(0);

  // The payments keep loading as you scroll, so there are no page buttons.
  const feed = useInfinitePages<AdminPayment, { summary: AdminPaymentList["summary"] }>(
    `${kind}|${reload}|${enabled && !!token}`,
    (pageNumber) =>
      !enabled || !token
        ? new Promise(() => {})
        : source.payments(token, { kind: kind === "all" ? "one_time" : kind, page: pageNumber, limit: PAGE_SIZE }).then((result) =>
            result.ok ? { ok: true as const, items: result.data.payments, total: result.data.total, meta: { summary: result.data.summary } } : { ok: false as const, error: result.error },
          ),
    (payment) => payment.id,
  );
  const summary = feed.meta?.summary;
  useEffect(() => {
    if (summary) onSummary(summary);
  }, [summary]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <Toolbar count={feed.items.length > 0 || !feed.loading ? feed.total : undefined} noun="payment">
        <label className={filterLabel}>
          Type
          <Select
            className={filterClass}
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as "all" | OneTimeKind);
            }}
          >
            <option value="all">All promotions & extra posts</option>
            <option value="promote">Paid promotions</option>
            <option value="per_post">Extra posts</option>
          </Select>
        </label>
      </Toolbar>

      {feed.error && feed.items.length === 0 ? (
        <LoadError message={feed.error} onRetry={() => setReload((n) => n + 1)} />
      ) : feed.loading && feed.items.length === 0 ? (
        <LoadingRow>Loading payments…</LoadingRow>
      ) : feed.items.length > 0 ? (
        <>
          <AdminTable headers={["Seller", "Type", "Amount", "Details", "Date"]}>
            {feed.items.map((payment) => (
              <tr key={payment.id} className="transition-colors hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <SellerCell accountId={payment.accountId} sellers={sellers} href={source.sellerHref} />
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${KIND_STYLES[payment.kind as OneTimeKind] ?? "bg-slate-100 text-slate-600"}`}>{KIND_LABELS[payment.kind as OneTimeKind] ?? payment.kind}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">{format(payment.amountCents / 100, payment.currency || "USD")}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <PaymentDetails payment={payment} />
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{formatDateTime(payment.createdAt)}</td>
              </tr>
            ))}
          </AdminTable>
          <InfiniteSentinel onVisible={feed.loadMore} hasMore={feed.hasMore} loading={feed.loadingMore} />
        </>
      ) : (
        <EmptyState title="No promotions paid for yet" description="Paid promotions and extra posts appear here once a seller buys one." />
      )}
    </div>
  );
}
