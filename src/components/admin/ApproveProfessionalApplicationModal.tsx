"use client";

import { useId, useState, FormEvent } from "react";
import Dialog from "@/components/Dialog";
import type { ProfessionalProfile } from "@/lib/professional/types";
import { fieldClass } from "./ui";

interface ApproveProfessionalApplicationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { note: string }) => void | Promise<void>;
  profile: ProfessionalProfile;
}

/** Bespoke — the spec wants a full approval summary (services, expiry,
 * declaration) rather than a single reason field, so this doesn't reuse
 * ReasonFormModal. */
export default function ApproveProfessionalApplicationModal({ open, onClose, onSubmit, profile }: ApproveProfessionalApplicationModalProps) {
  const titleId = useId();
  const [note, setNote] = useState("");
  const [declared, setDeclared] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setNote("");
      setDeclared(false);
      setError("");
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!declared) {
      setError("Confirm the verification declaration to continue.");
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ note: note.trim() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 id={titleId} className="mb-2 text-xl font-black text-slate-900">
          Approve application
        </h2>
        <p className="mb-5 text-sm leading-relaxed text-slate-500">This activates Professional Workspace access for the applicant and applies a demo-verified status. It is recorded in the audit log.</p>

        <dl className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
          <div>
            <dt className="text-xs text-slate-400">Applicant</dt>
            <dd className="mt-1 font-bold text-slate-800">{profile.displayName}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Profession</dt>
            <dd className="mt-1 font-bold text-slate-800">{profile.primarySpecialisation}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-slate-400">Approved services</dt>
            <dd className="mt-1 font-semibold text-slate-700">{profile.services.length ? profile.services.map((s) => s.name).join(", ") : "None listed"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Credential expiry</dt>
            <dd className="mt-1 font-semibold text-slate-700">{profile.licenceExpiry ? new Date(profile.licenceExpiry).toLocaleDateString() : "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Public profile status</dt>
            <dd className="mt-1 font-semibold text-slate-700">Will become visible as demo verified</dd>
          </div>
        </dl>

        <label className="mt-4 block text-sm font-bold text-slate-700">
          Internal note (optional)
          <textarea className={`${fieldClass} mt-2 min-h-20`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything worth recording for future reviewers." />
        </label>

        <label className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 p-3.5 text-sm">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#2ec440]" checked={declared} onChange={(e) => { setDeclared(e.target.checked); if (error) setError(""); }} />
          <span className="text-slate-700">I have reviewed the submitted information and documents. This demo verification is a prototype status, not a real-world credential check.</span>
        </label>

        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" data-dialog-close disabled={busy} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:opacity-60">
            {busy ? "Working…" : "Approve application"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
