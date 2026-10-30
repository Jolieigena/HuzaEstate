"use client";

import { useEffect, useState } from "react";
import { Card, EmptyState, PageFrame } from "@/components/professional/ui";
import Select from "@/components/shared/Select";
import { useAuth } from "@/lib/auth-context";
import { FurnitureApi, formatPrice, type Insights } from "@/lib/furniture/api";
import { useLanguage } from "@/lib/i18n/language";

const RANGES = [
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
  { days: 365, label: "Last 12 months" },
];

/** Every day (or month) in the range, so a quiet day shows as an empty bar rather than being skipped. */
function buckets(days: number, granularity: "day" | "month"): string[] {
  const out: string[] = [];
  const now = new Date();
  if (granularity === "month") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      out.push(d.toISOString().slice(0, 7));
    }
  } else {
    for (let i = days - 1; i >= 0; i--) out.push(new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10));
  }
  return out;
}

function label(key: string, granularity: "day" | "month") {
  const d = new Date(granularity === "month" ? `${key}-01T00:00:00Z` : `${key}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", granularity === "month" ? { month: "short", timeZone: "UTC" } : { day: "numeric", month: "short", timeZone: "UTC" }).format(d);
}

function RevenueChart({ data, currency }: { data: Insights; currency: string }) {
  const { t } = useLanguage();
  const keys = buckets(data.days, data.granularity);
  const byKey = new Map(data.series.filter((s) => s.currency === currency).map((s) => [s.date, s]));
  const max = Math.max(1, ...keys.map((k) => byKey.get(k)?.revenue ?? 0));
  const step = Math.ceil(keys.length / 6);
  return (
    <div>
      <div className="flex h-44 items-end gap-px sm:gap-0.5" role="img" aria-label={t("Paid revenue in {currency}", { currency })}>
        {keys.map((k) => {
          const point = byKey.get(k);
          const height = point ? Math.max(4, (point.revenue / max) * 100) : 0;
          return (
            <div key={k} className="group relative flex h-full flex-1 items-end" title={point ? `${label(k, data.granularity)}: ${formatPrice(point.revenue, currency)} from ${point.orders} order${point.orders === 1 ? "" : "s"}` : label(k, data.granularity)}>
              <div className={`w-full rounded-t ${point ? "bg-[#2ec440]" : "bg-slate-100"}`} style={{ height: point ? `${height}%` : "2px" }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-semibold text-slate-400">
        {keys.filter((_, i) => i % step === 0).map((k) => (
          <span key={k}>{label(k, data.granularity)}</span>
        ))}
      </div>
    </div>
  );
}

/** Sales over time and what sells best, from the supplier's own orders. */
export default function SupplierInsightsPage() {
  const { t } = useLanguage();
  const { token, isAuthReady } = useAuth();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState("");

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    FurnitureApi.insights(token, days).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setData(result.data);
        setCurrency((current) => (current && result.data.currencies.includes(current) ? current : (result.data.currencies[0] ?? "")));
      } else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, days]);

  const totals = data?.totals.find((t) => t.currency === currency);
  const best = (data?.bestSellers ?? []).filter((b) => b.currency === currency);
  const status = data?.status ?? {};

  return (
    <PageFrame
      title={t("Insights")}
      action={
        <Select className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700" value={String(days)} aria-label={t("Period")} onChange={(e) => setDays(Number(e.target.value))}>
          {RANGES.map((r) => (
            <option key={r.days} value={String(r.days)}>
              {t(r.label)}
            </option>
          ))}
        </Select>
      }
    >
      {error ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      ) : !data ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-400">{t("Loading…")}</p>
      ) : data.currencies.length === 0 ? (
        <EmptyState title={t("No orders in this period")} />
      ) : (
        <div className="space-y-6">
          {data.currencies.length > 1 && (
            <div className="flex gap-2" role="tablist" aria-label={t("Currency")}>
              {data.currencies.map((c) => (
                <button key={c} type="button" role="tab" aria-selected={c === currency} onClick={() => setCurrency(c)} className={`min-h-9 rounded-full px-4 py-1.5 text-sm font-bold ${c === currency ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>
                  {c}
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <p className="text-sm font-bold text-slate-500">{t("Paid revenue")}</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{formatPrice(totals?.paidValue ?? 0, currency)}</p>
            </Card>
            <Card>
              <p className="text-sm font-bold text-slate-500">{t("Orders")}</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{totals?.orders ?? 0}</p>
              <p className="mt-1 text-xs text-slate-500">{totals?.paidOrders ?? 0} paid</p>
            </Card>
            <Card>
              <p className="text-sm font-bold text-slate-500">{t("Average order")}</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{formatPrice(totals?.averageOrder ?? 0, currency)}</p>
            </Card>
            <Card>
              <p className="text-sm font-bold text-slate-500">{t("Delivered")}</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{status.completed ?? 0}</p>
              <p className="mt-1 text-xs text-slate-500">
                {status.declined ?? 0} declined · {status.cancelled ?? 0} cancelled
              </p>
            </Card>
          </div>

          <Card>
            <h2 className="mb-4 font-black text-slate-900">{t("Paid revenue")}</h2>
            <RevenueChart data={data} currency={currency} />
          </Card>

          <Card>
            <h2 className="mb-3 font-black text-slate-900">{t("Best sellers")}</h2>
            {best.length === 0 ? (
              <p className="text-sm font-semibold text-slate-500">{t("Nothing sold in this currency yet.")}</p>
            ) : (
              <ol className="divide-y divide-slate-100">
                {best.map((item, i) => (
                  <li key={item.productId} className="flex items-center gap-3 py-3">
                    <span className="w-5 text-sm font-black text-slate-400">{i + 1}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {item.image ? <img src={item.image} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" /> : <div className="h-11 w-11 shrink-0 rounded-lg bg-slate-100" />}
                    <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">{item.name}</p>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{item.units} sold</p>
                      <p className="text-xs text-slate-500">{formatPrice(item.revenue, currency)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      )}
    </PageFrame>
  );
}
