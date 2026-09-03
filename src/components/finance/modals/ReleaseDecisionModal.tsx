"use client";

import { useId, useState } from "react";
import Dialog from "@/components/Dialog";
import { formatMoney } from "@/lib/finance/money";
import type { FundingAllocation } from "@/lib/finance/types";
import { PrimaryButton, SecondaryButton, DestructiveButton, fieldClass, labelClass } from "../ui";

interface Props {
  funding: FundingAllocation | null;
  open: boolean;
  onClose: () => void;
  onDecide: (decision: "approved" | "rejected" | "clarification_requested", reason?: string) => void | Promise<void>;
}

export default function ReleaseDecisionModal({ funding, open, onClose, onDecide }: Props) {
  const titleId = useId();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const handleClose = () => {
    setReason("");
    onClose();
  };

  if (!funding) return null;

  const act = async (decision: "approved" | "rejected" | "clarification_requested") => {
    setBusy(true);
    await onDecide(decision, reason || undefined);
    setBusy(false);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} labelledBy={titleId} panelClassName="max-w-lg">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="mb-1 text-xl font-black text-slate-900">
          Review release request
        </h2>
        <p className="mb-5 text-sm text-slate-500">
          Amount: <span className="font-semibold text-slate-800">{formatMoney(funding.amount)}</span>
        </p>

        {funding.releaseEvidenceSummary && (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-line">{funding.releaseEvidenceSummary}</div>
        )}

        <label htmlFor="release-note" className={labelClass}>
          Note (required to reject or request clarification)
        </label>
        <textarea id="release-note" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className={fieldClass} placeholder="Add context…" />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <SecondaryButton type="button" disabled={busy} onClick={() => act("clarification_requested")}>
            Request Clarification
          </SecondaryButton>
          <DestructiveButton type="button" disabled={busy || reason.trim().length === 0} onClick={() => act("rejected")}>
            Reject with Reason
          </DestructiveButton>
          <PrimaryButton type="button" disabled={busy} onClick={() => act("approved")}>
            Approve Release
          </PrimaryButton>
        </div>
      </div>
    </Dialog>
  );
}
