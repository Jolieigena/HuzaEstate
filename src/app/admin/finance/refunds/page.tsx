"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useHasPermission } from "@/lib/admin/hooks";
import { useRefunds, useDisputes } from "@/lib/finance/hooks";
import { RefundService } from "@/lib/finance/refundService";
import { DisputeService } from "@/lib/finance/disputeService";
import { getAccountName } from "@/lib/finance/accountLookup";
import { formatMoney } from "@/lib/finance/money";
import { formatDateTime } from "@/lib/finance/format";
import { useToast } from "@/lib/toast-context";
import ReasonModal from "@/components/finance/modals/ReasonModal";
import { FinancePill } from "@/components/finance/ui";
import { PageFrame, Card, RequirePermission, EmptyState, SecondaryButton, DestructiveButton } from "@/components/admin/ui";

export default function AdminRefundsAndDisputesPage() {
  const { account } = useAuth();
  const canReview = useHasPermission(account?.id, "finance.refunds_review");
  const canDisputes = useHasPermission(account?.id, "finance.disputes");
  const refunds = useRefunds().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const disputes = useDisputes().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const { showToast } = useToast();

  const [reviewTarget, setReviewTarget] = useState<{ id: string; decision: "approved" | "rejected" } | null>(null);
  const [resolveTarget, setResolveTarget] = useState<{ id: string; resolution: "resolved_favour_customer" | "resolved_favour_recipient" | "resolved_partial" } | null>(null);

  if (!account) return null;

  return (
    <PageFrame title="Refunds & Disputes" description="Review refund requests and manage payment disputes. Refunds are never marked complete without provider confirmation.">
      <RequirePermission granted={canReview || canDisputes}>
        {canReview && (
          <Card className="mb-6">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Refund requests</h2>
            {refunds.length === 0 ? (
              <EmptyState title="No refund requests" description="Refund requests submitted by customers will appear here." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {refunds.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-semibold text-slate-800">{formatMoney(r.requestedAmount)} · {r.reason.replace(/_/g, " ")}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(r.createdAt)} · Payment {r.paymentId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <FinancePill status={r.status} />
                      {r.status === "requested" && (
                        <>
                          <SecondaryButton className="!min-h-0 !py-1.5 text-xs" onClick={() => setReviewTarget({ id: r.id, decision: "approved" })}>
                            Approve
                          </SecondaryButton>
                          <DestructiveButton className="!min-h-0 !py-1.5 text-xs" onClick={() => setReviewTarget({ id: r.id, decision: "rejected" })}>
                            Reject
                          </DestructiveButton>
                        </>
                      )}
                      {r.status === "approved" && (
                        <SecondaryButton
                          className="!min-h-0 !py-1.5 text-xs"
                          onClick={async () => {
                            await RefundService.submitToProvider(r.id);
                            showToast("Refund submitted to the Mock Provider.", "info");
                          }}
                        >
                          Submit to Provider
                        </SecondaryButton>
                      )}
                      {r.status === "processing" && (
                        <SecondaryButton
                          className="!min-h-0 !py-1.5 text-xs"
                          onClick={() => {
                            RefundService.simulateProviderCompletion(r.id);
                            showToast("Refund completion simulated.", "success");
                          }}
                        >
                          Simulate Provider Processing
                        </SecondaryButton>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {canDisputes && (
          <Card>
            <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Payment disputes</h2>
            {disputes.length === 0 ? (
              <EmptyState title="No disputes" description="Payment disputes opened by customers or recipients will appear here." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {disputes.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-semibold text-slate-800">{d.category.replace(/_/g, " ")} — {getAccountName(d.openedBy)}</p>
                      <p className="text-xs text-slate-500">{d.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <FinancePill status={d.status} />
                      {["open", "evidence_pending", "under_review"].includes(d.status) && (
                        <>
                          <SecondaryButton className="!min-h-0 !py-1.5 text-xs" onClick={() => setResolveTarget({ id: d.id, resolution: "resolved_favour_customer" })}>
                            Favour Customer
                          </SecondaryButton>
                          <SecondaryButton className="!min-h-0 !py-1.5 text-xs" onClick={() => setResolveTarget({ id: d.id, resolution: "resolved_favour_recipient" })}>
                            Favour Recipient
                          </SecondaryButton>
                          <SecondaryButton className="!min-h-0 !py-1.5 text-xs" onClick={() => setResolveTarget({ id: d.id, resolution: "resolved_partial" })}>
                            Partial
                          </SecondaryButton>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </RequirePermission>

      <ReasonModal
        open={Boolean(reviewTarget)}
        title={reviewTarget?.decision === "approved" ? "Approve refund" : "Reject refund"}
        description="Provide a note for the record."
        confirmLabel={reviewTarget?.decision === "approved" ? "Approve Refund" : "Reject Refund"}
        danger={reviewTarget?.decision === "rejected"}
        onClose={() => setReviewTarget(null)}
        onConfirm={async (note) => {
          if (reviewTarget) RefundService.review(reviewTarget.id, account.id, reviewTarget.decision, note);
          showToast(reviewTarget?.decision === "approved" ? "Refund approved." : "Refund rejected.", "info");
        }}
      />
      <ReasonModal
        open={Boolean(resolveTarget)}
        title="Resolve dispute"
        description="This unfreezes any linked milestone release and records the outcome in the audit trail."
        reasonLabel="Resolution note"
        confirmLabel="Resolve Dispute"
        onClose={() => setResolveTarget(null)}
        onConfirm={async (note) => {
          if (resolveTarget) DisputeService.resolve(resolveTarget.id, account.id, resolveTarget.resolution, note);
          showToast("Dispute resolved.", "success");
        }}
      />
    </PageFrame>
  );
}
