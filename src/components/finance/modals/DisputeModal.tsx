"use client";

import { useId, useState } from "react";
import Dialog from "@/components/Dialog";
import { DISPUTE_CATEGORY_LABELS, type DisputeCategory } from "@/lib/finance/types";
import { PrimaryButton, SecondaryButton, fieldClass, labelClass } from "../ui";

interface Props {
  open: boolean;
  contextLabel: string;
  onClose: () => void;
  onConfirm: (category: DisputeCategory, description: string) => void | Promise<void>;
}

export default function DisputeModal({ open, contextLabel, onClose, onConfirm }: Props) {
  const titleId = useId();
  const [category, setCategory] = useState<DisputeCategory>("other");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const handleClose = () => {
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} labelledBy={titleId} panelClassName="max-w-lg">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="mb-1 text-xl font-black text-slate-900">
          Open a payment dispute
        </h2>
        <p className="mb-5 text-sm text-slate-500">{contextLabel}</p>

        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Opening a dispute freezes any pending release, notifies the other party, and creates an administration case. Evidence and timestamps are preserved.
        </div>

        <label htmlFor="dispute-category" className={labelClass}>
          Category
        </label>
        <select id="dispute-category" value={category} onChange={(e) => setCategory(e.target.value as DisputeCategory)} className={`${fieldClass} mb-4`}>
          {Object.entries(DISPUTE_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <label htmlFor="dispute-description" className={labelClass}>
          Description
        </label>
        <textarea id="dispute-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={fieldClass} placeholder="Describe what happened…" />

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <SecondaryButton type="button" onClick={handleClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="button"
            disabled={description.trim().length === 0 || busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm(category, description);
              setBusy(false);
              handleClose();
            }}
          >
            {busy ? "Opening…" : "Open Dispute"}
          </PrimaryButton>
        </div>
      </div>
    </Dialog>
  );
}
