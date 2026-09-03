"use client";

import { useId, useState, ReactNode } from "react";
import Dialog from "@/components/Dialog";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  children?: ReactNode;
}

/**
 * Generic confirmation modal shared by the Build and Renovate modules
 * (rename, duplicate, archive, delete, cancel review, etc). Destructive
 * actions get the red treatment; everything else uses the standard
 * dark/green pattern.
 */
export default function ConfirmModal({ open, onClose, onConfirm, title, description, confirmLabel, cancelLabel = "Cancel", destructive = false, children }: ConfirmModalProps) {
  const titleId = useId();
  const descId = useId();
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} describedBy={descId} panelClassName="max-w-md">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="text-xl font-black text-slate-900 mb-2 pr-6">
          {title}
        </h2>
        <div id={descId} className="text-slate-500 text-sm leading-relaxed mb-6">
          {description}
        </div>
        {children}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            data-dialog-close
            onClick={handleConfirm}
            disabled={busy}
            className={`px-5 py-3 rounded-xl font-bold text-white transition-colors shadow-lg disabled:opacity-60 ${
              destructive ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-[#2ec440]"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
