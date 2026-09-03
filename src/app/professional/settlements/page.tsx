"use client";

import { useAuth } from "@/lib/auth-context";
import { useSettlements } from "@/lib/finance/hooks";
import { SettlementService } from "@/lib/finance/settlementService";
import { formatMoney } from "@/lib/finance/money";
import { formatDate } from "@/lib/finance/format";
import { useToast } from "@/lib/toast-context";
import { ExecutionProjectService } from "@/lib/execution/executionService";
import { PageFrame, Card, FinancePill, EmptyState, SecondaryButton, PrototypeBanner } from "@/components/finance/ui";

export default function ProfessionalSettlementsPage() {
  const { account, isAuthReady } = useAuth();
  const settlements = useSettlements(account?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const { showToast } = useToast();

  if (!isAuthReady || !account) return null;

  return (
    <PageFrame title="Settlements" description="Gross amount, platform fee, provider fee and net payout for every settlement — never labeled as an available balance until completed.">
      <div className="mb-6">
        <PrototypeBanner />
      </div>

      {settlements.length === 0 ? (
        <EmptyState title="No settlements yet" description="Settlements appear once a release is approved or a direct service payment succeeds." />
      ) : (
        <div className="space-y-3">
          {settlements.map((s) => {
            const project = s.relatedExecutionProjectId ? ExecutionProjectService.getById(s.relatedExecutionProjectId) : undefined;
            return (
              <Card key={s.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{project?.name ?? "Professional service"}</p>
                    <p className="text-xs text-slate-500">Expected {formatDate(s.expectedDate)}{s.completedDate ? ` · Completed ${formatDate(s.completedDate)}` : ""}</p>
                  </div>
                  <FinancePill status={s.status} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-y-1.5 text-sm sm:grid-cols-4">
                  <Row label="Gross" value={formatMoney(s.grossAmount)} />
                  <Row label="Platform fee" value={`-${formatMoney(s.platformFee)}`} />
                  <Row label="Provider fee" value={`-${formatMoney(s.providerFee)}`} />
                  <Row label="Net" value={formatMoney(s.netAmount)} bold />
                </dl>
                {s.status === "scheduled" && (
                  <div className="mt-3">
                    <SecondaryButton
                      className="!min-h-0 !py-2 text-xs"
                      onClick={() => {
                        SettlementService.simulateCompletion(s.id);
                        showToast("Settlement completion simulated.", "success");
                      }}
                    >
                      Simulate Settlement Completion
                    </SecondaryButton>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </PageFrame>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={bold ? "font-black text-slate-900" : "font-semibold text-slate-700"}>{value}</dd>
    </div>
  );
}
