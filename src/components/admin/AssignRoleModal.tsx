"use client";

import { useId, useMemo, useState, FormEvent } from "react";
import Dialog from "@/components/Dialog";
import { ADMIN_ROLE_LABELS, PERMISSION_LABELS, ROLE_PERMISSIONS } from "@/lib/admin/permissions";
import type { AdminRole, AdminUserRecord } from "@/lib/admin/types";
import { fieldClass } from "./ui";

interface AssignRoleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { accountId: string; role: AdminRole; reason: string; expiresAt?: string }) => void | Promise<void>;
  users: AdminUserRecord[];
  /** Pre-select a specific account (e.g. opened from that user's detail page). */
  presetAccountId?: string;
}

const ROLE_OPTIONS = Object.keys(ADMIN_ROLE_LABELS) as AdminRole[];

/** Bespoke modal for granting or changing a staff member's administrative
 * role — too structurally different (account picker + role picker + live
 * permission preview) to fit ReasonFormModal's single reason field. */
export default function AssignRoleModal({ open, onClose, onSubmit, users, presetAccountId }: AssignRoleModalProps) {
  const titleId = useId();
  const [accountId, setAccountId] = useState(presetAccountId ?? "");
  const [role, setRole] = useState<AdminRole>("operations_admin");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setAccountId(presetAccountId ?? "");
      setRole("operations_admin");
      setReason("");
      setExpiresAt("");
      setError("");
    }
  }

  const sortedUsers = useMemo(() => [...users].sort((a, b) => a.name.localeCompare(b.name)), [users]);
  const permissions = ROLE_PERMISSIONS[role] ?? [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      setError("Choose a staff member.");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason for this assignment.");
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ accountId, role, reason: reason.trim(), expiresAt: expiresAt || undefined });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName="max-w-xl">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 id={titleId} className="mb-2 text-xl font-black text-slate-900">
          Assign administrative role
        </h2>
        <p className="mb-5 text-sm leading-relaxed text-slate-500">Grants access to the Administration Portal. The assignment, permissions and reason are recorded in the audit log.</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold text-slate-700">
            Staff member
            <select className={`${fieldClass} mt-2`} value={accountId} onChange={(e) => setAccountId(e.target.value)} disabled={Boolean(presetAccountId)}>
              <option value="">Select an account…</option>
              {sortedUsers.map((user) => (
                <option key={user.accountId} value={user.accountId}>
                  {user.name} · {user.email}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Role
            <select className={`${fieldClass} mt-2`} value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
              {ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {ADMIN_ROLE_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">This role grants</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {permissions.map((permission) => (
              <li key={permission} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                {PERMISSION_LABELS[permission]}
              </li>
            ))}
          </ul>
        </div>

        <label className="mt-4 block text-sm font-bold text-slate-700">
          Reason
          <textarea className={`${fieldClass} mt-2 min-h-20`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this role being assigned?" />
        </label>

        <label className="mt-4 block text-sm font-bold text-slate-700">
          Optional expiry
          <input type="date" className={`${fieldClass} mt-2`} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </label>

        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" data-dialog-close disabled={busy} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:opacity-60">
            {busy ? "Working…" : "Assign role"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
