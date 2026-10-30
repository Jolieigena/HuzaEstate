"use client";

import { useEffect, useState } from "react";
import PhoneInput, { cleanPhone, phoneProblem } from "@/components/shared/PhoneInput";
import Select from "@/components/shared/Select";
import { Card, EmptyState, PageFrame, PrimaryButton, SecondaryButton, StatusPill, fieldClass, formatDate } from "@/components/professional/ui";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { EARNING_STAGE_LABELS, FurnitureApi, formatPrice, type EarningStage, type Earnings } from "@/lib/furniture/api";
import { MOBILE_MONEY_PROVIDERS, SuppliersApi, type Payout as PayoutDetails, type PayoutMethod } from "@/lib/suppliers/api";
import { useLanguage } from "@/lib/i18n/language";

const STAGE_FILTERS: { value: "" | EarningStage; label: string }[] = [
  { value: "", label: ("All orders") },
  { value: "awaiting_delivery", label: EARNING_STAGE_LABELS.awaiting_delivery },
  { value: "ready", label: EARNING_STAGE_LABELS.ready },
  { value: "paid_out", label: EARNING_STAGE_LABELS.paid_out },
  { value: "refunded", label: EARNING_STAGE_LABELS.refunded },
  { value: "refund_pending", label: EARNING_STAGE_LABELS.refund_pending },
];

type Tab = "balance" | "orders" | "payouts" | "details";

const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

/** The earnings as a spreadsheet file the supplier can keep or send to their accountant. */
function downloadCsv(earnings: Earnings, payouts: boolean) {
  const rows: (string | number)[][] = payouts
    ? [["Date", "Currency", "Amount", "Orders", "Reference", "Note"], ...earnings.payouts.map((p) => [p.paidAt.slice(0, 10), p.currency, p.amount, p.orders, p.reference, p.note ?? ""])]
    : [["Date paid", "Customer", "Items", "Currency", "Order total", "Platform fee", "You receive", "Status"], ...earnings.orders.map((o) => [(o.paidAt ?? o.createdAt).slice(0, 10), o.clientName, o.items, o.currency, o.total, o.fee, o.net, EARNING_STAGE_LABELS[o.stage]])];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = payouts ? "payouts.csv" : "orders-and-earnings.csv";
  link.click();
  URL.revokeObjectURL(url);
}

const stageTone: Record<EarningStage, string> = {
  awaiting_delivery: "bg-slate-100 text-slate-600",
  ready: "bg-amber-50 text-amber-700",
  paid_out: "bg-[#2ec440]/10 text-[#219b31]",
  refunded: "bg-slate-100 text-slate-500",
  refund_pending: "bg-red-50 text-red-600",
  other: "bg-slate-100 text-slate-500",
};

/** What customers paid for the supplier's orders and where each order's money stands, what has been paid to them, and
 *  where they want to be paid. */
export default function SupplierPaymentsPage() {
  const { t } = useLanguage();
  const { token, isAuthReady } = useAuth();
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [payout, setPayout] = useState<PayoutDetails | null | undefined>(undefined);
  const [stage, setStage] = useState<"" | EarningStage>("");
  const [tab, setTab] = useState<Tab>("balance");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    FurnitureApi.earningsMine(token).then((result) => {
      if (cancelled) return;
      if (result.ok) setEarnings(result.data);
      else setError(result.error);
    });
    SuppliersApi.getPayout(token).then((result) => {
      if (cancelled) return;
      if (result.ok) setPayout(result.data.payout);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token]);

  const rows = (earnings?.orders ?? []).filter((o) => !stage || o.stage === stage);
  const tabs: { id: Tab; label: string; badge?: string }[] = [
    { id: "balance", label: t("Balance") },
    { id: "orders", label: t("Orders"), badge: earnings && earnings.orders.length > 0 ? String(earnings.orders.length) : undefined },
    { id: "payouts", label: t("Payouts"), badge: earnings && earnings.payouts.length > 0 ? String(earnings.payouts.length) : undefined },
    { id: "details", label: t("Payout details"), badge: payout === null ? t("Not set") : undefined },
  ];

  return (
    <PageFrame title={t("Payments")}>
      {error && <p className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      {earnings === null || payout === undefined ? (
        !error && <p className="py-10 text-center text-sm font-semibold text-slate-400">{t("Loading…")}</p>
      ) : (
        <div>
          <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label={t("Payments")}>
            {tabs.map((tb) => {
              const active = tb.id === tab;
              return (
                <button
                  key={tb.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(tb.id)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-bold transition-colors ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
                >
                  {t(tb.label)}
                  {tb.badge && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? "bg-white/20 text-white" : tb.badge === "Not set" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{t(tb.badge)}</span>}
                </button>
              );
            })}
          </div>

          {tab === "balance" &&
            (earnings.totals.length === 0 ? (
              <EmptyState title={t("No payments yet")} />
            ) : (
              <div className="space-y-8">
                {earnings.totals.map((tot) => (
                  <section key={tot.currency}>
                    {earnings.totals.length > 1 && <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">{tot.currency}</h2>}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <Card>
                        <p className="text-sm font-bold text-slate-500">{t("Awaiting delivery")}</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{formatPrice(tot.awaitingDelivery, tot.currency)}</p>
                      </Card>
                      <Card className={tot.ready > 0 ? "!border-amber-200 !bg-amber-50/40" : ""}>
                        <p className="text-sm font-bold text-slate-500">{t("Ready for payout")}</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{formatPrice(tot.ready, tot.currency)}</p>
                        {tot.readyOrders > 0 && (
                          <p className="mt-1 text-xs text-slate-500">
                            {t(tot.readyOrders === 1 ? "{count} order" : "{count} orders", { count: tot.readyOrders })}
                          </p>
                        )}
                      </Card>
                      <Card>
                        <p className="text-sm font-bold text-slate-500">{t("Paid out")}</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{formatPrice(tot.paidOut, tot.currency)}</p>
                      </Card>
                      <Card>
                        <p className="text-sm font-bold text-slate-500">{t("Refunded to buyers")}</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{formatPrice(tot.refunded, tot.currency)}</p>
                      </Card>
                    </div>
                  </section>
                ))}
              </div>
            ))}

          {tab === "orders" &&
            (earnings.orders.length === 0 ? (
              <EmptyState title={t("No paid orders yet")} />
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2" role="group" aria-label={t("Show")}>
                    {STAGE_FILTERS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        aria-pressed={f.value === stage}
                        onClick={() => setStage(f.value)}
                        className={`min-h-9 rounded-full border px-4 py-1.5 text-sm font-bold transition-colors ${f.value === stage ? "border-[#2ec440] bg-[#2ec440]/10 text-[#219b31]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                      >
                        {t(f.label)}
                      </button>
                    ))}
                  </div>
                  <SecondaryButton type="button" onClick={() => downloadCsv(earnings, false)}>
                    {t("Export CSV")}
                  </SecondaryButton>
                </div>
                {rows.length === 0 ? (
                  <EmptyState title={t("Nothing in this view")} />
                ) : (
                  <Card className="overflow-x-auto !p-0">
                    <table className="w-full min-w-[40rem] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <th className="px-5 py-3">{t("Date")}</th>
                          <th className="px-5 py-3">{t("Customer")}</th>
                          <th className="px-5 py-3 text-right">{t("Order")}</th>
                          <th className="px-5 py-3 text-right">{t("Fee")}</th>
                          <th className="px-5 py-3 text-right">{t("You receive")}</th>
                          <th className="px-5 py-3">{t("Status")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((o) => (
                          <tr key={o.id}>
                            <td className="px-5 py-3 text-slate-500">{formatDate(o.paidAt ?? o.createdAt)}</td>
                            <td className="px-5 py-3 font-semibold text-slate-800">
                              {o.clientName}
                              <span className="block text-xs font-normal text-slate-400">
                                {o.items} item{o.items === 1 ? "" : "s"}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right text-slate-700">{formatPrice(o.total, o.currency)}</td>
                            <td className="px-5 py-3 text-right text-slate-500">{o.fee > 0 ? `\u2212${formatPrice(o.fee, o.currency)}` : "\u2014"}</td>
                            <td className="px-5 py-3 text-right font-black text-slate-900">{o.stage === "refunded" || o.stage === "refund_pending" ? "\u2014" : formatPrice(o.net, o.currency)}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${stageTone[o.stage]}`}>{t(EARNING_STAGE_LABELS[o.stage])}</span>
                              {o.stage === "paid_out" && o.paidOutAt && <span className="mt-0.5 block text-xs text-slate-400">{formatDate(o.paidOutAt)}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                )}
              </>
            ))}

          {tab === "payouts" &&
            (earnings.payouts.length === 0 ? (
              <EmptyState title={t("No payouts yet")} />
            ) : (
              <>
                <div className="mb-4 flex justify-end">
                  <SecondaryButton type="button" onClick={() => downloadCsv(earnings, true)}>
                    {t("Export CSV")}
                  </SecondaryButton>
                </div>
                <Card className="divide-y divide-slate-100 !p-0">
                  {earnings.payouts.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                      <div>
                        <p className="font-black text-slate-900">{formatPrice(p.amount, p.currency)}</p>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {formatDate(p.paidAt)} · {p.orders} order{p.orders === 1 ? "" : "s"}
                          {p.note ? ` · ${p.note}` : ""}
                        </p>
                      </div>
                      <StatusPill status={t("Ref {reference}", { reference: p.reference })} />
                    </div>
                  ))}
                </Card>
              </>
            ))}

          {tab === "details" && <PayoutForm key={payout ? payout.method : "none"} initial={payout} onSaved={setPayout} />}
        </div>
      )}
    </PageFrame>
  );
}

function PayoutForm({ initial, onSaved }: { initial: PayoutDetails | null; onSaved: (payout: PayoutDetails) => void }) {
  const { t } = useLanguage();
  const { token } = useAuth();
  const { showToast } = useToast();
  const [method, setMethod] = useState<PayoutMethod>(initial?.method ?? "mobile_money");
  const [provider, setProvider] = useState(initial?.provider ?? "");
  const [accountName, setAccountName] = useState(initial?.accountName ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [bankName, setBankName] = useState(initial?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(initial?.accountNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const complete =
    !!accountName.trim() &&
    (method === "mobile_money" ? !!provider && !!cleanPhone(phone) && phoneProblem(phone) === null : !!bankName.trim() && accountNumber.trim().length >= 5);

  const save = async () => {
    if (!token || !complete || saving) return;
    setSaving(true);
    setError("");
    const input: PayoutDetails =
      method === "mobile_money" ? { method, provider, accountName: accountName.trim(), phone: cleanPhone(phone) } : { method, accountName: accountName.trim(), bankName: bankName.trim(), accountNumber: accountNumber.trim() };
    const result = await SuppliersApi.savePayout(token, input);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved(result.data.payout);
    showToast(t("Payout details saved."));
  };

  return (
      <Card className="max-w-2xl space-y-5">
        {error && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <label className="block text-sm font-bold text-slate-700">
          {t("Receive money by")}
          <Select className={`${fieldClass} mt-1`} value={method} onChange={(e) => setMethod(e.target.value as PayoutMethod)}>
            <option value="mobile_money">{t("Mobile money")}</option>
            <option value="bank">{t("Bank account")}</option>
          </Select>
        </label>

        {method === "mobile_money" ? (
          <>
            <label className="block text-sm font-bold text-slate-700">
              {t("Provider")}
              <Select className={`${fieldClass} mt-1`} value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option value="">{t("Choose…")}</option>
                {MOBILE_MONEY_PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              {t("Name on the account")}
              <input className={`${fieldClass} mt-1`} value={accountName} maxLength={120} onChange={(e) => setAccountName(e.target.value)} />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              {t("Mobile money number")}
              <div className="mt-1">
                <PhoneInput value={phone} onChange={setPhone} required />
              </div>
            </label>
          </>
        ) : (
          <>
            <label className="block text-sm font-bold text-slate-700">
              {t("Bank")}
              <input className={`${fieldClass} mt-1`} value={bankName} maxLength={120} onChange={(e) => setBankName(e.target.value)} />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              {t("Name on the account")}
              <input className={`${fieldClass} mt-1`} value={accountName} maxLength={120} onChange={(e) => setAccountName(e.target.value)} />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              {t("Account number")}
              <input className={`${fieldClass} mt-1`} value={accountNumber} maxLength={40} inputMode="numeric" onChange={(e) => setAccountNumber(e.target.value)} />
            </label>
          </>
        )}

        <PrimaryButton type="button" disabled={!complete || saving} onClick={save}>
          {saving ? t("Saving…") : initial ? t("Save changes") : t("Save payout details")}
        </PrimaryButton>
      </Card>
  );
}
