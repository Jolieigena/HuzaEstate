import { formatMoney } from "@/lib/finance/money";
import { formatDateTime } from "@/lib/finance/format";
import { PAYMENT_METHOD_LABELS, type Invoice, type Payment } from "@/lib/finance/types";
import { PROTOTYPE_TRANSACTION_LABEL } from "@/lib/finance/format";
import { Card } from "./ui";

/** Phase 20 printable receipt. Not labeled an official tax receipt — see PROTOTYPE_DOCUMENT_LABEL usage on invoices. */
export default function ReceiptView({ payment, invoice, payerName, recipientName, projectName }: { payment: Payment; invoice: Invoice; payerName: string; recipientName: string; projectName?: string }) {
  return (
    <Card className="print:border-0 print:shadow-none">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">Payment Receipt</h3>
          <p className="text-xs text-slate-500">HuzaEstate reference: {payment.id}</p>
          {payment.providerReference && <p className="text-xs text-slate-500">Provider reference: {payment.providerReference}</p>}
        </div>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{payment.status.replace(/_/g, " ")}</span>
      </div>

      <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
        <dt className="text-slate-500">Date</dt>
        <dd className="text-right font-semibold text-slate-900">{formatDateTime(payment.completedAt ?? payment.createdAt)}</dd>
        <dt className="text-slate-500">Payer</dt>
        <dd className="text-right font-semibold text-slate-900">{payerName}</dd>
        <dt className="text-slate-500">Recipient</dt>
        <dd className="text-right font-semibold text-slate-900">{recipientName}</dd>
        {projectName && (
          <>
            <dt className="text-slate-500">Project</dt>
            <dd className="text-right font-semibold text-slate-900">{projectName}</dd>
          </>
        )}
        <dt className="text-slate-500">Invoice</dt>
        <dd className="text-right font-semibold text-slate-900">{invoice.reference}</dd>
        <dt className="text-slate-500">Description</dt>
        <dd className="text-right font-semibold text-slate-900">{invoice.lineItems.map((l) => l.description).join(", ")}</dd>
        <dt className="text-slate-500">Payment method</dt>
        <dd className="text-right font-semibold text-slate-900">{PAYMENT_METHOD_LABELS[payment.method]}{payment.maskedPayerDetail ? ` — ${payment.maskedPayerDetail}` : ""}</dd>
      </dl>

      <div className="my-4 border-t border-dashed border-slate-200" />

      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between"><dt className="text-slate-500">Service amount</dt><dd className="font-semibold text-slate-900">{formatMoney(payment.fees.serviceAmount)}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Platform fee</dt><dd className="font-semibold text-slate-900">{formatMoney(payment.fees.platformFee)}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Provider fee</dt><dd className="font-semibold text-slate-900">{formatMoney(payment.fees.providerFee)}</dd></div>
        <div className="flex justify-between text-base font-black text-slate-900"><dt>Total</dt><dd>{formatMoney(payment.amount)}</dd></div>
        {payment.refundedAmount.amountMinor > 0 && (
          <div className="flex justify-between text-red-700"><dt>Refunded</dt><dd className="font-semibold">-{formatMoney(payment.refundedAmount)}</dd></div>
        )}
      </dl>

      {payment.statusHistory.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Status history</p>
          <ul className="space-y-1 text-xs text-slate-500">
            {payment.statusHistory.map((h, i) => (
              <li key={i}>
                {formatDateTime(h.at)} — {h.status.replace(/_/g, " ")}
                {h.note ? ` (${h.note})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400">{PROTOTYPE_TRANSACTION_LABEL} This receipt is not an official tax receipt.</p>
    </Card>
  );
}
