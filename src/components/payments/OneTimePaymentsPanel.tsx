"use client";

import { useState } from "react";
import Link from "next/link";
import type { AdminPayment, AdminPaymentList, AdminUser, PaymentKind } from "@/lib/admin/api";
import { AdminTable, EmptyState, formatDateTime, formatMoney } from "@/components/admin/ui";
import Select from "@/components/shared/Select";
import type { PaymentsSource } from "./paymentsSource";
import { LoadError, LoadingRow, Pager, SellerCell, Toolbar, useKeyedLoad } from "./shared";

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
  const [kind, setKind] = useState<"all" | OneTimeKind>("all");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);

  const key = `${kind}|${page}|${reload}`;
  const { data, error, loading } = useKeyedLoad(
    enabled && !!token,
    key,
    () => source.payments(token as string, { kind: kind === "all" ? "one_time" : kind, page, limit: PAGE_SIZE }),
    (list) => onSummary(list.summary),
  );

  return (
    <div>
      <Toolbar count={data?.total} noun="payment">
        <label className={filterLabel}>
          Type
          <Select
            className={filterClass}
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as "all" | OneTimeKind);
              setPage(1);
            }}
          >
            <option value="all">All promotions & extra posts</option>
            <option value="promote">Paid promotions</option>
            <option value="per_post">Extra posts</option>
          </Select>
        </label>
      </Toolbar>

      {error ? (
        <LoadError message={error} onRetry={() => setReload((n) => n + 1)} />
      ) : loading && !data ? (
        <LoadingRow>Loading payments…</LoadingRow>
      ) : data && data.payments.length ? (
        <>
          <AdminTable headers={["Seller", "Type", "Amount", "Details", "Date"]}>
            {data.payments.map((payment) => (
              <tr key={payment.id} className="transition-colors hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <SellerCell accountId={payment.accountId} sellers={sellers} href={source.sellerHref} />
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${KIND_STYLES[payment.kind as OneTimeKind] ?? "bg-slate-100 text-slate-600"}`}>{KIND_LABELS[payment.kind as OneTimeKind] ?? payment.kind}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">{formatMoney(payment.amountCents / 100, payment.currency?.toUpperCase() || "USD")}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <PaymentDetails payment={payment} />
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{formatDateTime(payment.createdAt)}</td>
              </tr>
            ))}
          </AdminTable>
          <Pager page={page} total={data.total} limit={data.limit} onPage={setPage} />
        </>
      ) : (
        <EmptyState title="No promotions paid for yet" description="Paid promotions and extra posts appear here once a seller buys one." />
      )}
    </div>
  );
}
