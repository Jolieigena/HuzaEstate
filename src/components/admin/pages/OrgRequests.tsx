"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { AdminApi, type AdminOrgRequest, type OrgRequestReason, type OrgRequestStatus } from "@/lib/admin/api";
import { useToast } from "@/lib/toast-context";
import { AdminTable, Card, EmptyState, PageFrame, RequirePermission, SecondaryButton, StatusPill, formatDateTime } from "../ui";

const REASON_LABELS: Record<OrgRequestReason, string> = {
  add_country: "Add a country",
  remove_country: "Remove a country",
  billing: "Billing",
  account_access: "Account access",
  other: "Other",
};

const STATUS_TABS: { key: "all" | OrgRequestStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "resolved", label: "Resolved" },
];

// A single cross-organisation inbox for the "please change something about our organisation"
// requests org admins submit from their locked Countries field (see
// org-admin/pages/Organisation.tsx's "Request a change" button). Resolving one here is a status
// flip, not automation — the actual change still happens through /admin/organizations/[id].
export function OrgRequestsListPage() {
  const { token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const canView = useIsAdministrator();
  const [status, setStatus] = useState<"all" | OrgRequestStatus>("open");
  const [requests, setRequests] = useState<AdminOrgRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!isAuthReady || !token || !canView) return;
    let cancelled = false;
    AdminApi.listOrgRequests(token, { status }).then((result) => {
      if (cancelled) return;
      if (result.ok) setRequests(result.data);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, status, reloadCount]);

  async function resolve(request: AdminOrgRequest) {
    if (!token) return;
    setBusyId(request.id);
    const result = await AdminApi.resolveOrgRequest(token, request.id);
    setBusyId(null);
    if (result.ok) {
      showToast("Request marked resolved.");
      setReloadCount((n) => n + 1);
    } else showToast(result.error, "error");
  }

  return (
    <PageFrame title="Requests">
      <RequirePermission granted={canView}>
        <div role="tablist" aria-label="Request status" className="mb-5 flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => {
            const active = status === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={active}
                onClick={() => setStatus(tab.key)}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {error ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">{error}</Card>
        ) : !requests ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading requests…</p>
        ) : requests.length ? (
          <AdminTable headers={["Organisation", "Requested by", "Reason", "Message", "Status", "Received", "Action"]}>
            {requests.map((r) => (
              <tr key={r.id} className="align-top transition-colors hover:bg-slate-50/50">
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{r.organizationName ?? "—"}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{r.requestedByName ?? "—"}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{REASON_LABELS[r.reason]}</td>
                <td className="px-6 py-4 max-w-70 text-sm text-slate-500">{r.message || "—"}</td>
                <td className="px-6 py-4"><StatusPill status={r.status} /></td>
                <td className="px-6 py-4 text-xs text-slate-500">{formatDateTime(r.createdAt)}</td>
                <td className="px-6 py-4">
                  {r.status === "open" && (
                    <SecondaryButton className="min-h-9 px-3 py-1.5 text-xs" disabled={busyId === r.id} onClick={() => resolve(r)}>
                      Mark resolved
                    </SecondaryButton>
                  )}
                </td>
              </tr>
            ))}
          </AdminTable>
        ) : (
          <EmptyState title="No requests" description="Change requests from organisation admins will appear here." />
        )}
      </RequirePermission>
    </PageFrame>
  );
}
