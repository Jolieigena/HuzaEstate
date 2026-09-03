"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useHasPermission } from "@/lib/admin/hooks";
import { useReconciliation } from "@/lib/finance/hooks";
import { ReconciliationService } from "@/lib/finance/reconciliationService";
import { formatMoney } from "@/lib/finance/money";
import { formatDateTime } from "@/lib/finance/format";
import { useToast } from "@/lib/toast-context";
import ReasonModal from "@/components/finance/modals/ReasonModal";
import { FinancePill } from "@/components/finance/ui";
import { PageFrame, Card, RequirePermission, EmptyState, SecondaryButton, PrimaryButton } from "@/components/admin/ui";

function exportReport(rows: ReturnType<typeof useReconciliation>) {
  const header = ["id", "status", "internalAmount", "providerAmount", "assignedTo", "note"].join(",");
  const lines = rows.map((r) =>
    [r.id, r.status, r.internalAmount?.amountMinor ?? "", r.providerAmount?.amountMinor ?? "", r.assignedToAdminId ?? "", JSON.stringify(r.note ?? "")].join(",")
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "huzaestate-reconciliation-report.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AdminReconciliationPage() {
  const { account } = useAuth();
  const canReconcile = useHasPermission(account?.id, "finance.reconciliation");
  const canExport = useHasPermission(account?.id, "finance.export");
  const records = useReconciliation().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const { showToast } = useToast();
  const [resolveTarget, setResolveTarget] = useState<string | null>(null);
  const [noteTarget, setNoteTarget] = useState<string | null>(null);

  if (!account) return null;

  return (
    <PageFrame
      title="Reconciliation"
      description="Compare HuzaEstate payment records against provider transactions, funding, settlements and refunds. Provider-confirmed amounts cannot be edited manually — only resolved with a reason."
      action={canExport && records.length > 0 ? <PrimaryButton onClick={() => exportReport(records)}>Export Report</PrimaryButton> : undefined}
    >
      <RequirePermission granted={canReconcile}>
        {records.length === 0 ? (
          <EmptyState title="Nothing to reconcile" description="Reconciliation records appear when a payment, settlement or refund needs comparison against the provider." />
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <Card key={r.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{r.paymentId ?? r.settlementId ?? r.invoiceId ?? r.id}</p>
                    <p className="text-xs text-slate-500">Updated {formatDateTime(r.updatedAt)}{r.assignedToAdminId ? ` · Assigned to ${r.assignedToAdminId}` : ""}</p>
                  </div>
                  <FinancePill status={r.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Internal amount</p>
                    <p className="font-semibold text-slate-800">{r.internalAmount ? formatMoney(r.internalAmount) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Provider amount</p>
                    <p className="font-semibold text-slate-800">{r.providerAmount ? formatMoney(r.providerAmount) : "—"}</p>
                  </div>
                </div>
                {r.note && <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{r.note}</p>}
                {r.status !== "resolved" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <SecondaryButton className="!min-h-0 !py-1.5 text-xs" onClick={() => ReconciliationService.assign(r.id, account.id)}>
                      Assign to Me
                    </SecondaryButton>
                    <SecondaryButton className="!min-h-0 !py-1.5 text-xs" onClick={() => setNoteTarget(r.id)}>
                      Add Note
                    </SecondaryButton>
                    <SecondaryButton className="!min-h-0 !py-1.5 text-xs" onClick={() => setResolveTarget(r.id)}>
                      Mark Resolved
                    </SecondaryButton>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </RequirePermission>

      <ReasonModal
        open={Boolean(noteTarget)}
        title="Add investigation note"
        description="Notes are visible to other finance administrators."
        reasonLabel="Note"
        confirmLabel="Add Note"
        onClose={() => setNoteTarget(null)}
        onConfirm={async (note) => {
          if (noteTarget) ReconciliationService.addNote(noteTarget, note);
          showToast("Note added.", "success");
        }}
      />
      <ReasonModal
        open={Boolean(resolveTarget)}
        title="Resolve reconciliation issue"
        description="Explain how this was resolved. This does not change any provider-confirmed amount."
        reasonLabel="Resolution reason"
        confirmLabel="Mark Resolved"
        onClose={() => setResolveTarget(null)}
        onConfirm={async (reason) => {
          if (resolveTarget) ReconciliationService.markResolved(resolveTarget, account.id, reason);
          showToast("Reconciliation issue resolved.", "success");
        }}
      />
    </PageFrame>
  );
}
