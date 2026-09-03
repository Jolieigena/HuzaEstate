"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useInvoice, usePaymentsForInvoice } from "@/lib/finance/hooks";
import { InvoiceService } from "@/lib/finance/invoiceService";
import { canCancelInvoice } from "@/lib/finance/permissions";
import { formatMoney } from "@/lib/finance/money";
import { formatDate, formatDateTime, PROTOTYPE_DOCUMENT_LABEL } from "@/lib/finance/format";
import { getAccountName } from "@/lib/finance/accountLookup";
import { useToast } from "@/lib/toast-context";
import ReasonModal from "@/components/finance/modals/ReasonModal";
import { PageFrame, Card, FinancePill, EmptyState, PrimaryButton, DestructiveButton, PrototypeBanner } from "@/components/finance/ui";

export default function ProfessionalInvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = use(params);
  const { account, isAuthReady } = useAuth();
  const invoice = useInvoice(invoiceId);
  const payments = usePaymentsForInvoice(invoiceId);
  const [cancelOpen, setCancelOpen] = useState(false);
  const { showToast } = useToast();

  if (!isAuthReady || !account) return null;

  if (!invoice || invoice.issuerId !== account.id) {
    return (
      <PageFrame title="Invoice" description="">
        <EmptyState title="Invoice not found" description="This invoice doesn't exist, or you don't have access to it." />
      </PageFrame>
    );
  }

  return (
    <PageFrame title={invoice.reference} description={`To ${getAccountName(invoice.recipientId)}`} action={<FinancePill status={invoice.status} />}>
      <div className="mb-6">
        <PrototypeBanner />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Line items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-3">Description</th>
                    <th className="pb-2 pr-3">Qty</th>
                    <th className="pb-2 text-right">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.lineItems.map((li) => (
                    <tr key={li.id}>
                      <td className="py-2.5 pr-3 font-medium text-slate-800">{li.description}</td>
                      <td className="py-2.5 pr-3 text-slate-600">
                        {li.quantity} {li.unit}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-900">{formatMoney(li.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-right text-lg font-black text-slate-900">Total: {formatMoney(invoice.total)}</p>
            <p className="mt-4 text-xs text-slate-400">{PROTOTYPE_DOCUMENT_LABEL}</p>
          </Card>

          {payments.length > 0 && (
            <Card>
              <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Payment history</h2>
              <ul className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                    <Link href={`/payments/${p.id}`} className="font-semibold text-slate-800 hover:text-[#219b31]">
                      {formatDateTime(p.createdAt)}
                    </Link>
                    <div className="flex items-center gap-3">
                      <FinancePill status={p.status} />
                      <span className="font-bold text-slate-900">{formatMoney(p.amount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Issue date</dt>
                <dd className="font-semibold text-slate-900">{formatDate(invoice.issueDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Due date</dt>
                <dd className="font-semibold text-slate-900">{formatDate(invoice.dueDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Outstanding</dt>
                <dd className="font-semibold text-slate-900">{formatMoney(invoice.amountOutstanding)}</dd>
              </div>
            </dl>
          </Card>
          <Card>
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Actions</h3>
            <div className="flex flex-col gap-2">
              {invoice.status === "draft" && (
                <PrimaryButton
                  onClick={() => {
                    InvoiceService.issue(invoice.id, account.id);
                    showToast("Invoice issued and the customer has been notified.", "success");
                  }}
                >
                  Issue Invoice
                </PrimaryButton>
              )}
              {canCancelInvoice(account.id, invoice) && <DestructiveButton onClick={() => setCancelOpen(true)}>Cancel Invoice</DestructiveButton>}
            </div>
          </Card>
        </div>
      </div>

      <ReasonModal
        open={cancelOpen}
        title="Cancel this invoice?"
        description="This cannot be undone."
        reasonLabel="Cancellation reason"
        confirmLabel="Cancel Invoice"
        danger
        onClose={() => setCancelOpen(false)}
        onConfirm={async (reason) => {
          InvoiceService.cancel(invoice.id, account.id, reason);
          showToast("Invoice cancelled.", "info");
        }}
      />
    </PageFrame>
  );
}
