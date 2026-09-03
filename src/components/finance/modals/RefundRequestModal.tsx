"use client";

import { useId, useState } from "react";
import Dialog from "@/components/Dialog";
import { formatMoney } from "@/lib/finance/money";
import { toMajor, toMinor } from "@/lib/finance/money";
import { REFUND_REASON_LABELS, type Money, type Payment, type RefundReason } from "@/lib/finance/types";
import { PrimaryButton, SecondaryButton, fieldClass, labelClass } from "../ui";

interface Props {
  payment: Payment | null;
  maxRefundable: Money | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: RefundReason, amount: Money, note: string) => void | Promise<void>;
}

export default function RefundRequestModal({ payment, maxRefundable, open, onClose, onConfirm }: Props) {
  const titleId = useId();
  const [reason, setReason] = useState<RefundReason>("agreed_adjustment");
  const [amountMajor, setAmountMajor] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const handleClose = () => {
    setAmountMajor("");
    setNote("");
    onClose();
  };

  if (!payment || !maxRefundable) return null;
  const maxMajor = toMajor(maxRefundable.amountMinor, maxRefundable.currency);
  const parsed = Number(amountMajor);
  const isValid = amountMajor.trim().length > 0 && !Number.isNaN(parsed) && parsed > 0 && parsed <= maxMajor;

  return (
    <Dialog open={open} onClose={handleClose} labelledBy={titleId} panelClassName="max-w-lg">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="mb-1 text-xl font-black text-slate-900">
          Request a refund
        </h2>
        <p className="mb-5 text-sm text-slate-500">
          Maximum refundable: <span className="font-semibold text-slate-800">{formatMoney(maxRefundable)}</span>
        </p>

        <label htmlFor="refund-reason" className={labelClass}>
          Reason
        </label>
        <select id="refund-reason" value={reason} onChange={(e) => setReason(e.target.value as RefundReason)} className={`${fieldClass} mb-4`}>
          {Object.entries(REFUND_REASON_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <label htmlFor="refund-amount" className={labelClass}>
          Requested amount ({maxRefundable.currency})
        </label>
        <input id="refund-amount" type="number" min={0} max={maxMajor} step="0.01" value={amountMajor} onChange={(e) => setAmountMajor(e.target.value)} className={`${fieldClass} mb-4`} />

        <label htmlFor="refund-note" className={labelClass}>
          Details
        </label>
        <textarea id="refund-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={fieldClass} placeholder="Explain what happened…" />

        <p className="mt-4 text-xs text-slate-500">Refunds are reviewed by finance staff and are only marked complete once the provider confirms them.</p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <SecondaryButton type="button" onClick={handleClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="button"
            disabled={!isValid || busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm(reason, { amountMinor: toMinor(parsed, maxRefundable.currency), currency: maxRefundable.currency }, note);
              setBusy(false);
              handleClose();
            }}
          >
            {busy ? "Submitting…" : "Request Refund"}
          </PrimaryButton>
        </div>
      </div>
    </Dialog>
  );
}
