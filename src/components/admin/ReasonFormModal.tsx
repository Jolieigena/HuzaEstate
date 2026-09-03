"use client";

import { useId, useState, FormEvent, ReactNode } from "react";
import Dialog from "@/components/Dialog";
import { fieldClass } from "./ui";

export interface ReasonFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { reason: string; note: string }) => void | Promise<void>;
  title: string;
  description?: ReactNode;
  /** When provided, the reason field renders as a <select>; otherwise a free-text textarea. */
  reasonOptions?: string[];
  reasonLabel?: string;
  reasonRequired?: boolean;
  noteLabel?: string;
  notePlaceholder?: string;
  noteRequired?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Extra fields the caller renders and reads via its own component state — mirrors how ConfirmModal's `children` work alongside its parent-owned `onConfirm` closure. */
  children?: ReactNode;
}

/**
 * Shared "take an action with a recorded reason" modal — the workhorse
 * behind most admin actions (reject, suspend, unpublish, restrict, close,
 * decline, resolve). One field set (reason + optional note) covers the
 * majority of the spec's ~35 named modals so they don't need one bespoke
 * component each; callers needing extra fields (an amount, a picker) pass
 * them as `children` and read that state directly in their own `onSubmit`.
 */
export default function ReasonFormModal({
  open,
  onClose,
  onSubmit,
  title,
  description,
  reasonOptions,
  reasonLabel = "Reason",
  reasonRequired = true,
  noteLabel = "Additional notes (optional)",
  notePlaceholder,
  noteRequired = false,
  submitLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  children,
}: ReasonFormModalProps) {
  const titleId = useId();
  const [reason, setReason] = useState(reasonOptions?.[0] ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setReason(reasonOptions?.[0] ?? "");
      setNote("");
      setError("");
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (reasonRequired && !reason.trim()) {
      setError("Please provide a reason.");
      return;
    }
    if (noteRequired && !note.trim()) {
      setError("Please provide additional detail.");
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ reason: reason.trim(), note: note.trim() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 id={titleId} className="text-xl font-black text-slate-900 mb-2 pr-6">
          {title}
        </h2>
        {description && <div className="text-slate-500 text-sm leading-relaxed mb-5">{description}</div>}

        <label className="block text-sm font-bold text-slate-700">
          {reasonLabel}
          {reasonOptions ? (
            <select
              className={`${fieldClass} mt-2`}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
            >
              {reasonOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <textarea
              className={`${fieldClass} mt-2 min-h-24`}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              placeholder="Explain the reason for this action…"
            />
          )}
        </label>

        {children}

        <label className="mt-4 block text-sm font-bold text-slate-700">
          {noteLabel}
          <textarea className={`${fieldClass} mt-2 min-h-20`} value={note} onChange={(e) => setNote(e.target.value)} placeholder={notePlaceholder} />
        </label>

        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60">
            {cancelLabel}
          </button>
          <button
            type="submit"
            data-dialog-close
            disabled={busy}
            className={`rounded-xl px-5 py-3 font-bold text-white shadow-lg transition-colors disabled:opacity-60 ${destructive ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-[#2ec440]"}`}
          >
            {busy ? "Working…" : submitLabel}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
