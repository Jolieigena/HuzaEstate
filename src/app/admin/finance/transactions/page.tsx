"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useHasPermission } from "@/lib/admin/hooks";
import { usePayments, useFundingForAccount } from "@/lib/finance/hooks";
import { getAccountName } from "@/lib/finance/accountLookup";
import { formatMoney } from "@/lib/finance/money";
import { formatDateTime } from "@/lib/finance/format";
import { PAYMENT_STATUS_LABELS } from "@/lib/finance/types";
import { FinancePill } from "@/components/finance/ui";
import { PageFrame, Card, RequirePermission, EmptyState, fieldClass } from "@/components/admin/ui";

export default function AdminTransactionsPage() {
  const { account } = useAuth();
  const canView = useHasPermission(account?.id, "finance.view");
  const payments = usePayments().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const funding = useFundingForAccount();
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = payments.filter((p) => statusFilter === "all" || p.status === statusFilter);

  return (
    <PageFrame title="Transactions" description="Every payment and milestone funding allocation on the platform. Administrators never see full payment credentials — only safe references.">
      <RequirePermission granted={canView}>
        <Card className="mb-5 max-w-xs">
          <label className="text-sm font-bold text-slate-700">
            Status
            <select className={`${fieldClass} mt-1`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              {Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>
        </Card>

        <Card className="mb-6 overflow-x-auto">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Payments</h2>
          {filtered.length === 0 ? (
            <EmptyState title="No payments" description="No payments match this filter." />
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-3">Reference</th>
                  <th className="pb-2 pr-3">Payer</th>
                  <th className="pb-2 pr-3">Recipient</th>
                  <th className="pb-2 pr-3">Amount</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2 pr-3">Reconciliation</th>
                  <th className="pb-2">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-3 font-mono text-xs text-slate-600">{p.providerReference ?? p.id}</td>
                    <td className="py-2.5 pr-3">{getAccountName(p.payerId)}</td>
                    <td className="py-2.5 pr-3">{getAccountName(p.recipientId)}</td>
                    <td className="py-2.5 pr-3 font-semibold text-slate-900">{formatMoney(p.amount)}</td>
                    <td className="py-2.5 pr-3"><FinancePill status={p.status} /></td>
                    <td className="py-2.5 pr-3"><FinancePill status={p.reconciliationStatus} /></td>
                    <td className="py-2.5 text-xs text-slate-500">{formatDateTime(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="overflow-x-auto">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Milestone funding</h2>
          {funding.length === 0 ? (
            <EmptyState title="No funding allocations" description="Funded milestones will appear here once a customer payment is confirmed." />
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-3">Customer</th>
                  <th className="pb-2 pr-3">Recipient</th>
                  <th className="pb-2 pr-3">Amount</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {funding.map((f) => (
                  <tr key={f.id}>
                    <td className="py-2.5 pr-3">{getAccountName(f.customerId)}</td>
                    <td className="py-2.5 pr-3">{getAccountName(f.recipientId)}</td>
                    <td className="py-2.5 pr-3 font-semibold text-slate-900">{formatMoney(f.amount)}</td>
                    <td className="py-2.5 pr-3"><FinancePill status={f.status} /></td>
                    <td className="py-2.5 text-xs text-slate-500">{formatDateTime(f.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </RequirePermission>
    </PageFrame>
  );
}
