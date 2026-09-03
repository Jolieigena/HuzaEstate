"use client";

import { useId, useState } from "react";
import Dialog from "@/components/Dialog";
import { PrimaryButton, SecondaryButton, DestructiveButton, fieldClass, labelClass } from "../ui";

interface Props {
  open: boolean;
  title: string;
  description: string;
  reasonLabel?: string;
  confirmLabel: string;
  requireReason?: boolean;
  danger?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
}

/**
 * Generic reusable modal shell for the many Phase 30 confirmation dialogs
 * that only differ in copy and whether a reason is required (Cancel
 * Invoice, Reject Release, Reject Refund, Resolve Reconciliation, Withdraw
 * Dispute, Disable Payments, Request Clarification, ...).
 */
export default function ReasonModal({ open, title, description, reasonLabel = "Reason", confirmLabel, requireReason = true, danger = false, onClose, onConfirm }: Props) {
  const titleId = useId();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm(reason);
      setReason("");
    } finally {
      setBusy(false);
    }
  };

  const ConfirmBtn = danger ? DestructiveButton : PrimaryButton;

  return (
    <Dialog open={open} onClose={handleClose} labelledBy={titleId} panelClassName="max-w-lg">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="mb-1 text-xl font-black text-slate-900">
          {title}
        </h2>
        <p className="mb-5 text-sm text-slate-500">{description}</p>

        <label htmlFor="reason-modal-input" className={labelClass}>
          {reasonLabel}
        </label>
        <textarea id="reason-modal-input" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className={fieldClass} placeholder="Add context for the record…" />

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <SecondaryButton type="button" onClick={handleClose}>
            Cancel
          </SecondaryButton>
          <ConfirmBtn type="button" disabled={busy || (requireReason && reason.trim().length === 0)} onClick={handleConfirm}>
            {busy ? "Working…" : confirmLabel}
          </ConfirmBtn>
        </div>
      </div>
    </Dialog>
  );
}
