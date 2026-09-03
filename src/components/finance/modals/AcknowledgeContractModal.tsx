"use client";

import { useId, useState } from "react";
import Dialog from "@/components/Dialog";
import { formatMoney } from "@/lib/finance/money";
import { PROTOTYPE_ACKNOWLEDGEMENT_LABEL } from "@/lib/finance/format";
import type { Contract } from "@/lib/finance/types";
import { PrimaryButton, SecondaryButton } from "../ui";

interface Props {
  contract: Contract | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (statement: string) => void | Promise<void>;
}

export default function AcknowledgeContractModal({ contract, open, onClose, onConfirm }: Props) {
  const titleId = useId();
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const statement = "I have reviewed this contract summary and agree to the scope, milestones and payment schedule described.";

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onClose={handleClose} labelledBy={titleId} panelClassName="max-w-lg">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="mb-1 text-xl font-black text-slate-900">
          Acknowledge {contract.projectName} contract
        </h2>
        <p className="mb-5 text-sm text-slate-500">Review the summary before acknowledging version {contract.version}.</p>

        <dl className="mb-4 grid grid-cols-2 gap-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
          <dt className="text-slate-500">Agreed amount</dt>
          <dd className="text-right font-semibold text-slate-900">{formatMoney(contract.agreedAmount)}</dd>
          <dt className="text-slate-500">Milestones</dt>
          <dd className="text-right font-semibold text-slate-900">{contract.milestones.length}</dd>
          <dt className="text-slate-500">Terms version</dt>
          <dd className="text-right font-semibold text-slate-900">{contract.termsVersion}</dd>
        </dl>

        <div className="mb-4 rounded-2xl border border-purple-200 bg-purple-50 p-4">
          <p className="text-sm font-semibold text-purple-800">{PROTOTYPE_ACKNOWLEDGEMENT_LABEL}</p>
        </div>

        <label className="mb-6 flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-5 w-5 flex-shrink-0 rounded accent-[#2ec440]" />
          <span className="text-sm leading-relaxed text-slate-700">{statement}</span>
        </label>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <SecondaryButton type="button" onClick={handleClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="button"
            disabled={!confirmed || busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm(statement);
              setBusy(false);
              setConfirmed(false);
            }}
          >
            {busy ? "Acknowledging…" : "Acknowledge Contract"}
          </PrimaryButton>
        </div>
      </div>
    </Dialog>
  );
}
