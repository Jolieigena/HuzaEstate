"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { usePayments, useInvoices } from "@/lib/finance/hooks";
import { formatMoney } from "@/lib/finance/money";
import { formatDate } from "@/lib/finance/format";
import { getAccountName } from "@/lib/finance/accountLookup";
import { ExecutionProjectService } from "@/lib/execution/executionService";
import { PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/finance/types";
import { PageFrame, Card, FinancePill, EmptyState, PrimaryLink, PrototypeBanner, fieldClass } from "@/components/finance/ui";

export default function PaymentsPage() {
  const { account, isAuthReady } = useAuth();
  const payments = usePayments(account?.id);
  const invoices = useInvoices(account?.id);
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const invoiceById = useMemo(() => new Map(invoices.map((i) => [i.id, i])), [invoices]);

  const projectOptions = useMemo(() => {
    const ids = new Set(payments.map((p) => p.executionProjectId).filter(Boolean) as string[]);
    return Array.from(ids).map((id) => ({ id, name: ExecutionProjectService.getById(id)?.name ?? id }));
  }, [payments]);

  const filtered = payments
    .filter((p) => statusFilter === "all" || p.status === statusFilter)
    .filter((p) => projectFilter === "all" || p.executionProjectId === projectFilter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const due = account ? invoices.filter((i) => i.recipientId === account.id && ["issued", "viewed", "partially_paid", "overdue"].includes(i.status)) : [];

  if (!isAuthReady || !account) return null;

  return (
    <PageFrame title="Payments" description="Track amounts due, payments in progress, completed payments, refunds and disputes across every project." action={<PrimaryLink href="/invoices">View Invoices</PrimaryLink>}>
      <div className="mb-6">
        <PrototypeBanner />
      </div>

      {due.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Amount currently due</h2>
          <ul className="divide-y divide-slate-100">
            {due.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-bold text-slate-900">{inv.reference}</p>
                  <p className="text-xs text-slate-500">Due {formatDate(inv.dueDate)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-slate-900">{formatMoney(inv.amountOutstanding)}</span>
                  <Link href={`/invoices/${inv.id}`} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2ec440]">
                    Pay
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mb-6">
        <div className="flex flex-wrap gap-3">
          <label className="sr-only" htmlFor="status-filter">Filter by status</label>
          <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${fieldClass} w-auto`}>
            <option value="all">All statuses</option>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          {projectOptions.length > 0 && (
            <>
              <label className="sr-only" htmlFor="project-filter">Filter by project</label>
              <select id="project-filter" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className={`${fieldClass} w-auto`}>
                <option value="all">All projects</option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No payments yet" description="Payments you make or receive will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const invoice = invoiceById.get(p.invoiceId);
            const isPayer = p.payerId === account.id;
            return (
              <Card key={p.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{invoice?.reference ?? p.invoiceId}</p>
                    <p className="text-xs text-slate-500">
                      {isPayer ? `To ${getAccountName(p.recipientId)}` : `From ${getAccountName(p.payerId)}`} · {PAYMENT_METHOD_LABELS[p.method]} · {formatDate(p.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <FinancePill status={p.status} />
                    <span className="font-black text-slate-900">{formatMoney(p.amount)}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/payments/${p.id}`} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:border-[#2ec440] hover:text-[#219b31]">
                    View Status
                  </Link>
                  {invoice && (
                    <Link href={`/invoices/${invoice.id}`} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:border-[#2ec440] hover:text-[#219b31]">
                      View Invoice
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageFrame>
  );
}
