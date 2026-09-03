"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useInvoice, usePaymentsForInvoice } from "@/lib/finance/hooks";
import { InvoiceService } from "@/lib/finance/invoiceService";
import { canCancelInvoice, canPayInvoice, canViewInvoice } from "@/lib/finance/permissions";
import { formatMoney } from "@/lib/finance/money";
import { formatDate, formatDateTime, PROTOTYPE_DOCUMENT_LABEL } from "@/lib/finance/format";
import { getAccountName } from "@/lib/finance/accountLookup";
import { useToast } from "@/lib/toast-context";
import CheckoutFlow from "@/components/finance/CheckoutFlow";
import ReasonModal from "@/components/finance/modals/ReasonModal";
import { PageFrame, Card, FinancePill, EmptyState, DestructiveButton, PrimaryButton, PrototypeBanner } from "@/components/finance/ui";

export default function InvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = use(params);
  const { account, isAuthReady } = useAuth();
  const invoice = useInvoice(invoiceId);
  const payments = usePaymentsForInvoice(invoiceId);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (invoice && account && invoice.recipientId === account.id && invoice.status === "issued") InvoiceService.markViewed(invoice.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.id, invoice?.status, account?.id]);

  if (!isAuthReady || !account) return null;

  if (!invoice || !canViewInvoice(account.id, invoice)) {
    return (
      <PageFrame title="Invoice" description="">
        <EmptyState title="Invoice not found" description="This invoice doesn't exist, or you don't have access to it." />
      </PageFrame>
    );
  }

  const isRecipient = invoice.recipientId === account.id;
  const payable = canPayInvoice(account.id, invoice);

  return (
    <PageFrame
      title={invoice.reference}
      description={`${isRecipient ? "Owed to" : "Issued to"} ${isRecipient ? getAccountName(invoice.issuerId) : getAccountName(invoice.recipientId)}`}
      action={<FinancePill status={invoice.status} />}
    >
      <div className="mb-6">
        <PrototypeBanner />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Line items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-3">Description</th>
                    <th className="pb-2 pr-3">Qty</th>
                    <th className="pb-2 pr-3">Unit price</th>
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
                      <td className="py-2.5 pr-3 text-slate-600">{formatMoney(li.unitPrice)}</td>
                      <td className="py-2.5 text-right font-semibold text-slate-900">{formatMoney(li.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="font-semibold text-slate-900">{formatMoney(invoice.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Discount</dt>
                <dd className="font-semibold text-slate-900">-{formatMoney(invoice.discountTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Tax</dt>
                <dd className="font-semibold text-slate-900">{formatMoney(invoice.taxTotal)}</dd>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900">
                <dt>Total</dt>
                <dd>{formatMoney(invoice.total)}</dd>
              </div>
              <div className="flex justify-between text-emerald-700">
                <dt>Paid</dt>
                <dd className="font-semibold">{formatMoney(invoice.amountPaid)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Outstanding</dt>
                <dd className="font-black text-slate-900">{formatMoney(invoice.amountOutstanding)}</dd>
              </div>
            </dl>
            {invoice.notes && <p className="mt-3 text-sm text-slate-500">{invoice.notes}</p>}
            <p className="mt-4 text-xs text-slate-400">{PROTOTYPE_DOCUMENT_LABEL}</p>
          </Card>

          {checkoutOpen && payable ? (
            <CheckoutFlow invoice={invoice} payerId={account.id} onClose={() => setCheckoutOpen(false)} />
          ) : (
            payments.length > 0 && (
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
            )
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
              {invoice.contractId && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Contract</dt>
                  <dd>
                    <Link href={`/contracts/${invoice.contractId}`} className="font-semibold text-[#219b31] hover:underline">
                      View
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Actions</h3>
            <div className="flex flex-col gap-2">
              {payable && !checkoutOpen && <PrimaryButton onClick={() => setCheckoutOpen(true)}>Pay</PrimaryButton>}
              {canCancelInvoice(account.id, invoice) && <DestructiveButton onClick={() => setCancelOpen(true)}>Cancel Invoice</DestructiveButton>}
              {!payable && isRecipient && invoice.status !== "cancelled" && invoice.amountOutstanding.amountMinor <= 0 && <p className="text-xs text-slate-500">This invoice is fully paid.</p>}
            </div>
          </Card>
        </div>
      </div>

      <ReasonModal
        open={cancelOpen}
        title="Cancel this invoice?"
        description="This cannot be undone. Once paid, an invoice must be corrected with a credit note instead."
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
