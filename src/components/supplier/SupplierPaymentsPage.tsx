"use client";

import { useEffect, useState } from "react";
import PhoneInput, { cleanPhone, phoneProblem } from "@/components/shared/PhoneInput";
import Select from "@/components/shared/Select";
import { Card, EmptyState, PageFrame, PrimaryButton, StatusPill, fieldClass, formatDate } from "@/components/professional/ui";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { FurnitureApi, ORDER_STATUS_LABELS, formatPrice, paymentMethodLabel, type Order } from "@/lib/furniture/api";
import { MOBILE_MONEY_PROVIDERS, SuppliersApi, type Payout, type PayoutMethod } from "@/lib/suppliers/api";

/** What customers have paid for the supplier's orders, and where the platform sends that money. */
export default function SupplierPaymentsPage() {
  const { token, isAuthReady } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [payout, setPayout] = useState<Payout | null | undefined>(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    FurnitureApi.incomingOrders(token).then((result) => {
      if (cancelled) return;
      if (result.ok) setOrders(result.data.orders);
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

  // A paid order that was then declined or cancelled is a refund, so it does not count as money earned.
  const live = (orders ?? []).filter((o) => o.status !== "declined" && o.status !== "cancelled");
  const paid = live.filter((o) => o.paymentStatus === "paid");
  const waiting = live.filter((o) => o.paymentStatus !== "paid");
  const sum = (list: Order[]) => {
    const totals = new Map<string, number>();
    for (const o of list) totals.set(o.currency, (totals.get(o.currency) ?? 0) + o.total);
    return Array.from(totals, ([currency, total]) => formatPrice(total, currency));
  };

  return (
    <PageFrame title="Payments">
      {error && <p className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      {orders === null || payout === undefined ? (
        !error && <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="text-sm font-bold text-slate-500">Paid by customers</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{paid.length ? sum(paid).join(" · ") : "—"}</p>
              <p className="mt-1 text-sm text-slate-500">
                {paid.length} order{paid.length === 1 ? "" : "s"}
              </p>
            </Card>
            <Card>
              <p className="text-sm font-bold text-slate-500">Waiting for payment</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{waiting.length ? sum(waiting).join(" · ") : "—"}</p>
              <p className="mt-1 text-sm text-slate-500">
                {waiting.length} order{waiting.length === 1 ? "" : "s"}
              </p>
            </Card>
          </div>

          <PayoutForm key={payout ? payout.method : "none"} initial={payout} onSaved={setPayout} />

          <section>
            <h2 className="mb-3 text-lg font-black text-slate-900">Payments received</h2>
            {paid.length === 0 ? (
              <EmptyState title="No payments yet" />
            ) : (
              <Card className="divide-y divide-slate-100 !p-0">
                {paid.map((order) => (
                  <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="font-black text-slate-900">{formatPrice(order.total, order.currency)}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {order.clientName} · {order.items.length} item{order.items.length === 1 ? "" : "s"} · {order.paidAt ? formatDate(order.paidAt) : formatDate(order.createdAt)}
                        {order.paymentMethod ? ` · ${paymentMethodLabel(order.paymentMethod)}` : ""}
                      </p>
                    </div>
                    <StatusPill status={ORDER_STATUS_LABELS[order.status]} />
                  </div>
                ))}
              </Card>
            )}
          </section>
        </div>
      )}
    </PageFrame>
  );
}

function PayoutForm({ initial, onSaved }: { initial: Payout | null; onSaved: (payout: Payout) => void }) {
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
    const input: Payout =
      method === "mobile_money" ? { method, provider, accountName: accountName.trim(), phone: cleanPhone(phone) } : { method, accountName: accountName.trim(), bankName: bankName.trim(), accountNumber: accountNumber.trim() };
    const result = await SuppliersApi.savePayout(token, input);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved(result.data.payout);
    showToast("Payout details saved.");
  };

  return (
    <section>
      <h2 className="mb-3 text-lg font-black text-slate-900">Payout details</h2>
      <Card className="max-w-2xl space-y-5">
        {error && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <label className="block text-sm font-bold text-slate-700">
          Receive money by
          <Select className={`${fieldClass} mt-1`} value={method} onChange={(e) => setMethod(e.target.value as PayoutMethod)}>
            <option value="mobile_money">Mobile money</option>
            <option value="bank">Bank account</option>
          </Select>
        </label>

        {method === "mobile_money" ? (
          <>
            <label className="block text-sm font-bold text-slate-700">
              Provider
              <Select className={`${fieldClass} mt-1`} value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option value="">Choose…</option>
                {MOBILE_MONEY_PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Name on the account
              <input className={`${fieldClass} mt-1`} value={accountName} maxLength={120} onChange={(e) => setAccountName(e.target.value)} />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Mobile money number
              <div className="mt-1">
                <PhoneInput value={phone} onChange={setPhone} required />
              </div>
            </label>
          </>
        ) : (
          <>
            <label className="block text-sm font-bold text-slate-700">
              Bank
              <input className={`${fieldClass} mt-1`} value={bankName} maxLength={120} onChange={(e) => setBankName(e.target.value)} />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Name on the account
              <input className={`${fieldClass} mt-1`} value={accountName} maxLength={120} onChange={(e) => setAccountName(e.target.value)} />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Account number
              <input className={`${fieldClass} mt-1`} value={accountNumber} maxLength={40} inputMode="numeric" onChange={(e) => setAccountNumber(e.target.value)} />
            </label>
          </>
        )}

        <PrimaryButton type="button" disabled={!complete || saving} onClick={save}>
          {saving ? "Saving…" : initial ? "Save changes" : "Save payout details"}
        </PrimaryButton>
      </Card>
    </section>
  );
}
