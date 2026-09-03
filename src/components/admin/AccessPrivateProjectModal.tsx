"use client";

import { useId, useState, FormEvent } from "react";
import Dialog from "@/components/Dialog";
import type { PrivilegedAccessReason } from "@/lib/admin/types";
import { fieldClass } from "./ui";

interface AccessPrivateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { reason: PrivilegedAccessReason; caseReference: string }) => void | Promise<void>;
}

const REASON_OPTIONS: { value: PrivilegedAccessReason; label: string }[] = [
  { value: "customer_support", label: "Customer support request" },
  { value: "active_dispute", label: "Active dispute" },
  { value: "safety_investigation", label: "Safety investigation" },
  { value: "abuse_investigation", label: "Abuse investigation" },
  { value: "legal_regulatory", label: "Legal or regulatory request" },
  { value: "technical_recovery", label: "Technical recovery requested by user" },
];

/**
 * Bespoke — thin wrapper over the same reason-capture pattern as
 * ReasonFormModal, but with compliance-specific copy and a mandatory
 * acknowledgement, gating access to a customer's private project content.
 * Every submission is logged (actor, reason, case reference, timestamp)
 * and surfaces a persistent "Privileged Access" banner for the rest of
 * that view.
 */
export default function AccessPrivateProjectModal({ open, onClose, onSubmit }: AccessPrivateProjectModalProps) {
  const titleId = useId();
  const [reason, setReason] = useState<PrivilegedAccessReason>("customer_support");
  const [caseReference, setCaseReference] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setReason("customer_support");
      setCaseReference("");
      setAcknowledged(false);
      setError("");
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!caseReference.trim()) {
      setError("A case or ticket reference is required.");
      return;
    }
    if (!acknowledged) {
      setError("Confirm the acknowledgement to continue.");
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ reason, caseReference: caseReference.trim() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 id={titleId} className="mb-2 text-xl font-black text-slate-900">
          Access private project content
        </h2>
        <p className="mb-5 text-sm leading-relaxed text-slate-500">This customer&apos;s private project content is not visible by default. Every access is recorded with your name, the reason, and the case reference.</p>

        <label className="block text-sm font-bold text-slate-700">
          Reason for access
          <select className={`${fieldClass} mt-2`} value={reason} onChange={(e) => setReason(e.target.value as PrivilegedAccessReason)}>
            {REASON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-sm font-bold text-slate-700">
          Case or ticket reference
          <input
            className={`${fieldClass} mt-2`}
            value={caseReference}
            onChange={(e) => {
              setCaseReference(e.target.value);
              if (error) setError("");
            }}
            placeholder="e.g. SUP-1042"
          />
        </label>

        <label className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-[#2ec440]"
            checked={acknowledged}
            onChange={(e) => {
              setAcknowledged(e.target.checked);
              if (error) setError("");
            }}
          />
          <span className="text-amber-900">I understand this access is logged and will be visible in the audit log, and that I am only viewing what is necessary for this case.</span>
        </label>

        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" data-dialog-close disabled={busy} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:opacity-60">
            {busy ? "Working…" : "View private content"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
