"use client";

import { useAuth } from "@/lib/auth-context";
import { useHasPermission } from "@/lib/admin/hooks";
import { useSettlements } from "@/lib/finance/hooks";
import { SettlementService } from "@/lib/finance/settlementService";
import { getAccountName } from "@/lib/finance/accountLookup";
import { formatMoney } from "@/lib/finance/money";
import { formatDate } from "@/lib/finance/format";
import { useToast } from "@/lib/toast-context";
import { FinancePill } from "@/components/finance/ui";
import { PageFrame, Card, RequirePermission, EmptyState, SecondaryButton } from "@/components/admin/ui";

export default function AdminSettlementsPage() {
  const { account } = useAuth();
  const canView = useHasPermission(account?.id, "finance.view");
  const canConfigure = useHasPermission(account?.id, "finance.configure");
  const settlements = useSettlements().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const { showToast } = useToast();

  return (
    <PageFrame title="Settlements" description="Recipient payouts. Provider-confirmed amounts are never edited manually — only resolved through reconciliation.">
      <RequirePermission granted={canView}>
        <Card className="overflow-x-auto">
          {settlements.length === 0 ? (
            <EmptyState title="No settlements" description="Settlements will appear here once a release is approved or a service payment succeeds." />
          ) : (
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-3">Recipient</th>
                  <th className="pb-2 pr-3">Gross</th>
                  <th className="pb-2 pr-3">Net</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2 pr-3">Expected</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settlements.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 pr-3">{getAccountName(s.recipientId)}</td>
                    <td className="py-2.5 pr-3">{formatMoney(s.grossAmount)}</td>
                    <td className="py-2.5 pr-3 font-semibold text-slate-900">{formatMoney(s.netAmount)}</td>
                    <td className="py-2.5 pr-3"><FinancePill status={s.status} /></td>
                    <td className="py-2.5 pr-3 text-xs text-slate-500">{formatDate(s.expectedDate)}</td>
                    <td className="py-2.5">
                      {canConfigure && s.status === "scheduled" && (
                        <SecondaryButton
                          className="!min-h-0 !py-1.5 text-xs"
                          onClick={() => {
                            SettlementService.simulateCompletion(s.id);
                            showToast("Settlement completion simulated.", "success");
                          }}
                        >
                          Simulate Completion
                        </SecondaryButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </RequirePermission>
    </PageFrame>
  );
}
