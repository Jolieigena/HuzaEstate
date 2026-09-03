"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAdminState, useHasPermission } from "@/lib/admin/hooks";
import { ADMIN_ROLE_LABELS } from "@/lib/admin/permissions";
import type { AuditLogEntry } from "@/lib/admin/types";
import { Card, EmptyState, PageFrame, PrimaryButton, RequirePermission, fieldClass, formatDateTime } from "../ui";

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AuditPage() {
  const { account } = useAuth();
  const state = useAdminState();
  const canView = useHasPermission(account?.id, "audit.view");
  const canExport = useHasPermission(account?.id, "audit.export");
  const [search, setSearch] = useState("");
  const [resourceType, setResourceType] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const resourceTypes = useMemo(() => Array.from(new Set(state.auditLog.map((e) => e.resourceType))), [state.auditLog]);

  const filtered = useMemo(
    () =>
      state.auditLog.filter((entry) => {
        const q = search.trim().toLowerCase();
        const matchesSearch = !q || [entry.actorName, entry.action, entry.resourceType, entry.resourceId, entry.reason ?? ""].some((field) => field.toLowerCase().includes(q));
        return matchesSearch && (resourceType === "all" || entry.resourceType === resourceType);
      }),
    [state.auditLog, search, resourceType]
  );

  return (
    <PageFrame
      title="Audit Logs"
      description="Append-only record of administrative actions. Entries cannot be edited or deleted from this prototype UI — production audit integrity requires server-side, tamper-evident storage."
      action={
        canExport ? (
          <PrimaryButton
            onClick={() =>
              downloadCsv(
                "huzaestate-audit-log.csv",
                [["Date", "Actor", "Role", "Action", "Resource type", "Resource ID", "Reason", "Result"], ...filtered.map((e) => [formatDateTime(e.at), e.actorName, e.actorRole, e.action, e.resourceType, e.resourceId, e.reason ?? "", e.result])]
              )
            }
          >
            Export audit data (CSV)
          </PrimaryButton>
        ) : undefined
      }
    >
      <RequirePermission granted={canView}>
        <Card className="mb-5">
          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
            <label className="text-sm font-bold text-slate-700">
              Search
              <input className={`${fieldClass} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Actor, action, resource or reason" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Resource type
              <select className={`${fieldClass} mt-1`} value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
                <option value="all">All resource types</option>
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <p className="mb-3 text-xs font-semibold text-slate-400">{filtered.length} of {state.auditLog.length} events</p>

        {filtered.length ? (
          <Card className="p-0">
            <ul className="divide-y divide-slate-100">
              {filtered.map((entry) => (
                <AuditRow key={entry.id} entry={entry} expanded={expanded === entry.id} onToggle={() => setExpanded(expanded === entry.id ? null : entry.id)} />
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState title="No audit events" description="Try a different search or filter." />
        )}
      </RequirePermission>
    </PageFrame>
  );
}

function AuditRow({ entry, expanded, onToggle }: { entry: AuditLogEntry; expanded: boolean; onToggle: () => void }) {
  return (
    <li>
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="grid w-full gap-2 p-4 text-left transition-colors hover:bg-slate-50 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center">
        <div>
          <p className="text-sm font-bold text-slate-900">{entry.action.replace(/_/g, " ")}</p>
          <p className="text-xs text-slate-500">{entry.resourceType.replace(/_/g, " ")} · {entry.resourceId}</p>
        </div>
        <p className="text-xs text-slate-500">{entry.actorName} · {entry.actorRole === "system" ? "System" : ADMIN_ROLE_LABELS[entry.actorRole]}</p>
        <p className="text-xs text-slate-500">{formatDateTime(entry.at)}</p>
        <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-bold ${entry.result === "blocked" ? "bg-red-50 text-red-700" : "bg-[#2ec440]/10 text-[#219b31]"}`}>{entry.result}</span>
      </button>
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            {entry.previousValueSummary && (
              <div>
                <dt className="text-xs text-slate-400">Previous value</dt>
                <dd className="mt-1 font-semibold text-slate-700">{entry.previousValueSummary}</dd>
              </div>
            )}
            {entry.newValueSummary && (
              <div>
                <dt className="text-xs text-slate-400">New value</dt>
                <dd className="mt-1 font-semibold text-slate-700">{entry.newValueSummary}</dd>
              </div>
            )}
            {entry.reason && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-400">Reason</dt>
                <dd className="mt-1 font-semibold text-slate-700">{entry.reason}</dd>
              </div>
            )}
            {entry.relatedCase && (
              <div>
                <dt className="text-xs text-slate-400">Related case</dt>
                <dd className="mt-1 font-semibold text-slate-700">{entry.relatedCase}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </li>
  );
}
