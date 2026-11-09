"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { REQUESTABLE_ROLE_LABELS, ROLE_REQUEST_STATUS_LABELS, RoleRequestsApi, type RoleRequestRecord, type RoleRequestStatus } from "@/lib/roleRequests/api";
import { useToast } from "@/lib/toast-context";
import { openVerificationDocument } from "@/lib/verificationDocs";
import { Card, EmptyState, PageFrame, PrimaryButton, RequirePermission, StatusPill, fieldClass, formatDateTime } from "../ui";

const STATUSES = Object.keys(ROLE_REQUEST_STATUS_LABELS) as RoleRequestStatus[];
const TABS: { key: "all" | RoleRequestStatus; label: string }[] = [...STATUSES.map((key) => ({ key, label: ROLE_REQUEST_STATUS_LABELS[key] })), { key: "all", label: "All" }];

function RequestRow({ record, onDecided }: { record: RoleRequestRecord; onDecided: (next: RoleRequestRecord) => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const decide = async (decision: "approve" | "decline") => {
    if (!token || busy) return;
    setBusy(true);
    const result = await RoleRequestsApi.decide(token, record.id, decision, note.trim() || undefined);
    setBusy(false);
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    showToast(decision === "approve" ? "Role added." : "Request declined.");
    onDecided(result.data);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black text-slate-900">
            {record.userName ?? "An account"} · {REQUESTABLE_ROLE_LABELS[record.role]}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {record.userEmail && (
              <a href={`mailto:${record.userEmail}`} className="hover:text-[#219b31]">
                {record.userEmail}
              </a>
            )}
            {record.userRoles?.length ? ` · has ${record.userRoles.join(", ").replace(/_/g, " ")}` : ""}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Asked {formatDateTime(record.createdAt)}
            {record.country ? ` · ${record.country}` : ""}
            {record.professionalKind ? ` · ${record.professionalKind}` : ""}
          </p>
        </div>
        <StatusPill status={ROLE_REQUEST_STATUS_LABELS[record.status]} />
      </div>
      {record.details && (
        <p className="mt-3 text-sm text-slate-600">
          {[record.details.companyName, record.details.specialisations?.join(", "), record.details.categories?.join(", "), record.details.city, record.details.phone, record.details.yearsExperience !== undefined ? `${record.details.yearsExperience} years` : ""].filter(Boolean).join(" · ")}
        </p>
      )}
      {(record.details?.documents?.length || record.details?.workLink) && (
        <div className="mt-3 rounded-xl border border-slate-200 p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Documents</p>
          <ul className="space-y-1.5">
            {record.details.documents?.map((doc) => (
              <li key={doc.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-slate-700">
                  <span className="font-bold text-slate-900">{DOCUMENT_LABELS[doc.kind] ?? doc.kind}</span> · {doc.name}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    if (!token) return;
                    const problem = await openVerificationDocument(doc.key, token);
                    if (problem) showToast(problem, "error");
                  }}
                  className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-[#2ec440] hover:text-[#219b31]"
                >
                  Open
                </button>
              </li>
            ))}
            {record.details.workLink && (
              <li className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-slate-700">
                  <span className="font-bold text-slate-900">Link to their work</span> · {record.details.workLink}
                </span>
                <a href={record.details.workLink} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-[#2ec440] hover:text-[#219b31]">
                  Open
                </a>
              </li>
            )}
          </ul>
        </div>
      )}
      {record.note && <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">“{record.note}”</p>}
      {record.adminNote && record.status !== "pending" && <p className="mt-3 text-sm text-slate-500">Note: {record.adminNote}</p>}

      {record.status === "pending" && (
        <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="block text-sm font-bold text-slate-700">
            Note for the person <span className="font-normal text-slate-400">(optional)</span>
            <input className={`${fieldClass} mt-1`} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
          </label>
          <button type="button" disabled={busy} onClick={() => decide("decline")} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Decline
          </button>
          <PrimaryButton type="button" disabled={busy} onClick={() => decide("approve")}>
            {busy ? "Saving…" : "Approve"}
          </PrimaryButton>
        </div>
      )}
    </Card>
  );
}

// Everyone asking for another role on their account. Approving adds the role and tells the person; declining tells them too.
const DOCUMENT_LABELS: Record<string, string> = {
  qualification: "Degree, licence or certificate",
  work: "Proof of work",
  business: "Business registration",
  id: "ID",
};

export function RoleRequestsListPage() {
  const { token, isAuthReady } = useAuth();
  const canView = useIsAdministrator();
  const [tab, setTab] = useState<"all" | RoleRequestStatus>("pending");
  const [requests, setRequests] = useState<RoleRequestRecord[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthReady || !token || !canView) return;
    let cancelled = false;
    RoleRequestsApi.listAll(token, tab).then((result) => {
      if (cancelled) return;
      if (result.ok) setRequests(result.data);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, tab]);

  return (
    <PageFrame title="Role requests">
      <RequirePermission granted={canView}>
        <div role="tablist" aria-label="Request status" className="mb-5 flex flex-wrap gap-2">
          {TABS.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setRequests(null);
                  setTab(item.key);
                }}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {error ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">{error}</Card>
        ) : requests === null ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading requests…</p>
        ) : requests.length === 0 ? (
          <EmptyState title="No requests here" description="Role requests from accounts will appear here." />
        ) : (
          <div className="space-y-5">
            {requests.map((record) => (
              <RequestRow
                key={record.id}
                record={record}
                onDecided={(next) => setRequests((list) => (list ? (tab === "pending" ? list.filter((r) => r.id !== next.id) : list.map((r) => (r.id === next.id ? next : r))) : list))}
              />
            ))}
          </div>
        )}
      </RequirePermission>
    </PageFrame>
  );
}
