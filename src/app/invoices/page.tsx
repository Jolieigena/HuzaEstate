"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useInvoices } from "@/lib/finance/hooks";
import { formatMoney } from "@/lib/finance/money";
import { formatDate } from "@/lib/finance/format";
import { getAccountName } from "@/lib/finance/accountLookup";
import { INVOICE_STATUS_LABELS } from "@/lib/finance/types";
import { PageFrame, Card, FinancePill, EmptyState, PrototypeBanner, fieldClass } from "@/components/finance/ui";

export default function InvoicesPage() {
  const { account, isAuthReady } = useAuth();
  const invoices = useInvoices(account?.id);
  const [statusFilter, setStatusFilter] = useState("all");

  if (!isAuthReady || !account) return null;

  const filtered = invoices.filter((i) => statusFilter === "all" || i.status === statusFilter).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <PageFrame title="Invoices" description="Every invoice issued to or by you, across contractor milestones, professional services and change orders.">
      <div className="mb-6">
        <PrototypeBanner />
      </div>

      <Card className="mb-6">
        <label className="sr-only" htmlFor="invoice-status-filter">Filter by status</label>
        <select id="invoice-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${fieldClass} w-auto`}>
          <option value="all">All statuses</option>
          {Object.entries(INVOICE_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No invoices yet" description="Invoices for milestones, professional services and change orders will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => {
            const isRecipient = inv.recipientId === account.id;
            return (
              <Link key={inv.id} href={`/invoices/${inv.id}`} className="block">
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{inv.reference}</p>
                      <p className="text-xs text-slate-500">
                        {isRecipient ? `From ${getAccountName(inv.issuerId)}` : `To ${getAccountName(inv.recipientId)}`} · Due {formatDate(inv.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <FinancePill status={inv.status} />
                      <span className="font-black text-slate-900">{formatMoney(inv.total)}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </PageFrame>
  );
}
