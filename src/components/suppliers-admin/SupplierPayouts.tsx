"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import Dialog from "@/components/Dialog";
import { AdminTable, Card, EmptyState, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, fieldClass, formatDateTime } from "@/components/admin/ui";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { FurnitureApi, formatPrice, type EarningTotals, type Payout, type PayoutSummary } from "@/lib/furniture/api";
import { hasOrgPermission } from "@/lib/orgPermissions";
import { useToast } from "@/lib/toast-context";
import type { SuppliersScope } from "./SuppliersAdmin";

const BASE: Record<SuppliersScope, string> = { admin: "/admin/suppliers", org: "/org-admin/suppliers" };

/** What each supplier is owed and has been paid, for the people who look after suppliers. Platform administrators can
 *  record a payout (after paying the supplier by mobile money or bank) and retry refunds; organisation admins see the
 *  same figures for their own suppliers and cannot move money. */
export default function SupplierPayoutsPage({ scope }: { scope: SuppliersScope }) {
  const { token, isAuthReady, account } = useAuth();
  const { showToast } = useToast();
  const isAdministrator = useIsAdministrator();
  const canView = scope === "admin" ? isAdministrator : (account?.roles.includes("organization_admin") ?? false) && hasOrgPermission(account?.permissions, "manage_suppliers");
  const canPay = scope === "admin" && isAdministrator;

  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [payouts, setPayouts] = useState<Payout[] | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [paying, setPaying] = useState<{ supplierId: string; supplierName: string; totals: EarningTotals } | null>(null);
  const [retrying, setRetrying] = useState("");

  useEffect(() => {
    if (!isAuthReady || !token || !canView) return;
    let cancelled = false;
    FurnitureApi.payoutSummary(token).then((result) => {
      if (cancelled) return;
      if (result.ok) setSummary(result.data);
      else setError(result.error);
    });
    FurnitureApi.listPayouts(token, { limit: 50 }).then((result) => {
      if (!cancelled && result.ok) setPayouts(result.data.payouts);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, reload]);

  const retry = async (orderId: string) => {
    if (!token) return;
    setRetrying(orderId);
    const result = await FurnitureApi.retryRefund(token, orderId);
    setRetrying("");
    if (!result.ok) showToast(result.error, "error");
    else if (result.data.refunded) {
      showToast("Refund sent.");
      setReload((n) => n + 1);
    } else showToast(result.data.error || "The refund still did not go through.", "error");
  };

  const rows = (summary?.suppliers ?? []).flatMap((s) => s.currencies.map((t) => ({ supplierId: s.supplierId, supplierName: s.supplierName, totals: t })));

  return (
    <PageFrame
      title="Supplier payouts"
      action={
        <Link href={BASE[scope]} className="text-sm font-bold text-slate-500 hover:text-[#219b31]">
          Back to Suppliers
        </Link>
      }
    >
      <RequirePermission granted={canView}>
        {error && <p className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        {summary === null ? (
          !error && <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
        ) : (
          <div className="space-y-8">
            {summary.refundsPending.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-black text-slate-900">Refunds waiting</h2>
                <Card className="divide-y divide-red-100 !border-red-100 !bg-red-50/40 !p-0">
                  {summary.refundsPending.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900">
                          {formatPrice(r.total, r.currency)} <span className="font-semibold text-slate-500">to {r.clientName}</span>
                        </p>
                        <p className="mt-0.5 text-sm text-slate-500">
                          Declined by {r.supplierName}
                          {r.error ? ` · ${r.error}` : ""}
                        </p>
                      </div>
                      {canPay && (
                        <SecondaryButton type="button" disabled={retrying === r.id} onClick={() => retry(r.id)}>
                          {retrying === r.id ? "Trying…" : "Retry refund"}
                        </SecondaryButton>
                      )}
                    </div>
                  ))}
                </Card>
              </section>
            )}

            <section>
              <h2 className="mb-3 text-lg font-black text-slate-900">Supplier balances</h2>
              {rows.length === 0 ? (
                <EmptyState title="No paid orders yet" />
              ) : (
                <AdminTable headers={["Supplier", "Awaiting delivery", "Ready for payout", "Paid out", "Refunded", ""]}>
                  {rows.map(({ supplierId, supplierName, totals: t }) => (
                    <tr key={`${supplierId}|${t.currency}`} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{supplierName}</p>
                        <p className="text-xs text-slate-400">{t.currency}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatPrice(t.awaitingDelivery, t.currency)}</td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900">
                        {formatPrice(t.ready, t.currency)}
                        {t.readyOrders > 0 && <span className="block text-xs font-normal text-slate-400">{t.readyOrders} order{t.readyOrders === 1 ? "" : "s"}</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatPrice(t.paidOut, t.currency)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatPrice(t.refunded, t.currency)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link href={`${BASE[scope]}/orders?supplier=${encodeURIComponent(supplierId)}`} className="inline-flex min-h-9 items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-300">
                            Orders
                          </Link>
                          {canPay && t.ready > 0 && (
                            <PrimaryButton className="min-h-9 px-3 py-1.5 text-xs" onClick={() => setPaying({ supplierId, supplierName, totals: t })}>
                              Record payout
                            </PrimaryButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </AdminTable>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-black text-slate-900">Payouts made</h2>
              {payouts === null ? (
                <p className="py-6 text-center text-sm font-semibold text-slate-400">Loading…</p>
              ) : payouts.length === 0 ? (
                <EmptyState title="No payouts yet" />
              ) : (
                <AdminTable headers={["Supplier", "Amount", "Orders", "Reference", "Paid", "By"]}>
                  {payouts.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{p.supplierName ?? "Supplier"}</td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900">{formatPrice(p.amount, p.currency)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{p.orders}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {p.reference}
                        {p.note && <span className="block text-xs text-slate-400">{p.note}</span>}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{formatDateTime(p.paidAt)}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{p.paidByName ?? "—"}</td>
                    </tr>
                  ))}
                </AdminTable>
              )}
            </section>
          </div>
        )}
      </RequirePermission>

      <RecordPayout
        target={paying}
        onClose={() => setPaying(null)}
        onDone={() => {
          setPaying(null);
          setReload((n) => n + 1);
        }}
      />
    </PageFrame>
  );
}

function RecordPayout({ target, onClose, onDone }: { target: { supplierId: string; supplierName: string; totals: EarningTotals } | null; onClose: () => void; onDone: () => void }) {
  return (
    <Dialog open={!!target} onClose={onClose} labelledBy="record-payout-title" panelClassName="max-w-md">
      {target && <RecordPayoutForm key={`${target.supplierId}|${target.totals.currency}`} target={target} onClose={onClose} onDone={onDone} />}
    </Dialog>
  );
}

function RecordPayoutForm({ target, onClose, onDone }: { target: { supplierId: string; supplierName: string; totals: EarningTotals }; onClose: () => void; onDone: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const titleId = useId();
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { totals } = target;

  const submit = async () => {
    if (!token || busy) return;
    if (reference.trim().length < 3) {
      setError("Enter the transaction reference of the payment you made.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await FurnitureApi.createPayout(token, { supplierId: target.supplierId, currency: totals.currency, reference: reference.trim(), ...(note.trim() ? { note: note.trim() } : {}) });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast("Payout recorded.");
    onDone();
  };

  return (
    <div className="p-6">
      <h2 id={titleId} className="mb-1 pr-6 text-lg font-semibold text-slate-900">
        Record payout
      </h2>
      <p className="mb-5 text-sm text-slate-500">
        {target.supplierName} · {formatPrice(totals.ready, totals.currency)} for {totals.readyOrders} delivered order{totals.readyOrders === 1 ? "" : "s"}
      </p>
      {error && <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      <label className="block text-sm font-bold text-slate-700">
        Transaction reference
        <input className={`${fieldClass} mt-1`} value={reference} maxLength={120} autoFocus onChange={(e) => setReference(e.target.value)} />
      </label>
      <label className="mt-4 block text-sm font-bold text-slate-700">
        Note <span className="font-medium text-slate-400">(optional)</span>
        <input className={`${fieldClass} mt-1`} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className="mt-6 flex justify-end gap-2">
        <SecondaryButton type="button" onClick={onClose}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="button" disabled={busy} onClick={submit}>
          {busy ? "Recording…" : "Record payout"}
        </PrimaryButton>
      </div>
    </div>
  );
}
