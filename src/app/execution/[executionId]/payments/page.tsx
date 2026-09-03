"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useExecutionProject } from "@/lib/execution/hooks";
import { MILESTONE_STATUS_LABELS, PAYMENT_ELIGIBILITY_LABELS } from "@/lib/execution/types";
import { useContractForExecutionProject, useFundingForExecution, useInvoicesForExecution, useSettlement } from "@/lib/finance/hooks";
import { ContractService } from "@/lib/finance/contractService";
import { FundingService } from "@/lib/finance/fundingService";
import { SettlementService } from "@/lib/finance/settlementService";
import { DisputeService } from "@/lib/finance/disputeService";
import { canDecideRelease, canOpenFundingDispute, canRequestRelease } from "@/lib/finance/permissions";
import { formatMoney } from "@/lib/finance/money";
import { getAccountName } from "@/lib/finance/accountLookup";
import type { FundingAllocation } from "@/lib/finance/types";
import { useToast } from "@/lib/toast-context";
import ReasonModal from "@/components/finance/modals/ReasonModal";
import ReleaseDecisionModal from "@/components/finance/modals/ReleaseDecisionModal";
import DisputeModal from "@/components/finance/modals/DisputeModal";
import { PageFrame, Card, FinancePill, EmptyState, PrimaryButton, SecondaryButton, PrototypeBanner, SectionHeading } from "@/components/finance/ui";

function SettlementBadge({ settlementId }: { settlementId?: string }) {
  const settlement = useSettlement(settlementId);
  if (!settlement) return <FinancePill status="not_scheduled" />;
  return <FinancePill status={settlement.status} />;
}

export default function ExecutionPaymentsPage({ params }: { params: Promise<{ executionId: string }> }) {
  const { executionId } = use(params);
  const { account, isAuthReady } = useAuth();
  const { project, isLoading } = useExecutionProject(executionId);
  const contract = useContractForExecutionProject(executionId);
  const fundingAllocations = useFundingForExecution(executionId);
  const invoices = useInvoicesForExecution(executionId);
  const { showToast } = useToast();

  const [releaseRequestFor, setReleaseRequestFor] = useState<string | null>(null);
  const [decisionFor, setDecisionFor] = useState<FundingAllocation | null>(null);
  const [disputeFor, setDisputeFor] = useState<FundingAllocation | null>(null);

  useEffect(() => {
    if (project) ContractService.getOrCreateForExecutionProject(project);
  }, [project]);

  if (!isAuthReady || !account) return null;
  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading…</div>;
  if (!project) {
    return (
      <PageFrame title="Milestone Payments" description="">
        <EmptyState title="Project not found" description="This execution project doesn't exist or you don't have access to it." />
      </PageFrame>
    );
  }
  if (project.customerId !== account.id && project.contractorId !== account.id) {
    return (
      <PageFrame title="Milestone Payments" description="">
        <EmptyState title="Access denied" description="You don't have access to this project's payments." />
      </PageFrame>
    );
  }

  const isCustomer = project.customerId === account.id;

  return (
    <PageFrame title={`${project.name} — Milestone Payments`} description="Funding, release and settlement status for each milestone, driven by the Mock provider until a licensed provider is configured.">
      <div className="mb-6">
        <PrototypeBanner />
      </div>

      <div className="space-y-4">
        {project.milestones.map((milestone) => {
          const invoice = invoices.find((i) => i.milestoneId === milestone.id);
          const funding = fundingAllocations.find((f) => f.milestoneId === milestone.id);

          return (
            <Card key={milestone.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{milestone.title}</p>
                  <p className="text-xs text-slate-500">
                    Completion: {MILESTONE_STATUS_LABELS[milestone.status]} · Eligibility: {PAYMENT_ELIGIBILITY_LABELS[milestone.paymentEligibility]}
                  </p>
                </div>
                <span className="font-black text-slate-900">{milestone.contractValueAllocation.toLocaleString()} {project.currency}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatusBlock label="Invoice">{invoice ? <FinancePill status={invoice.status} /> : <FinancePill status="not_scheduled" />}</StatusBlock>
                <StatusBlock label="Funding">{funding ? <FinancePill status={funding.status} /> : <FinancePill status="not_funded" />}</StatusBlock>
                <StatusBlock label="Release">{funding?.releaseDecisions.length ? <FinancePill status={funding.status} /> : <span className="text-xs text-slate-400">—</span>}</StatusBlock>
                <StatusBlock label="Settlement">{funding?.settlementId ? <SettlementBadge settlementId={funding.settlementId} /> : <FinancePill status="not_scheduled" />}</StatusBlock>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {invoice && invoice.recipientId === account.id && invoice.amountOutstanding.amountMinor > 0 && !["cancelled", "disputed"].includes(invoice.status) && (
                  <Link href={`/invoices/${invoice.id}`} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2ec440]">
                    Pay Invoice
                  </Link>
                )}
                {!invoice && !isCustomer && (
                  <Link href="/professional/invoices" className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:border-[#2ec440] hover:text-[#219b31]">
                    Issue Milestone Invoice
                  </Link>
                )}
                {funding && !isCustomer && canRequestRelease(account.id, funding) && (
                  <SecondaryButton className="!min-h-0 !py-2 text-xs" onClick={() => setReleaseRequestFor(funding.id)}>
                    Request Release
                  </SecondaryButton>
                )}
                {funding && isCustomer && canDecideRelease(account.id, funding) && (
                  <PrimaryButton className="!min-h-0 !py-2 text-xs" onClick={() => setDecisionFor(funding)}>
                    Review Release Request
                  </PrimaryButton>
                )}
                {funding?.status === "release_approved" && funding.settlementId && (
                  <SecondaryButton className="!min-h-0 !py-2 text-xs" onClick={() => { SettlementService.simulateCompletion(funding.settlementId!); showToast("Settlement completion simulated.", "success"); }}>
                    Simulate Settlement Completion
                  </SecondaryButton>
                )}
                {funding && canOpenFundingDispute(account.id, funding) && (
                  <SecondaryButton className="!min-h-0 !py-2 text-xs" onClick={() => setDisputeFor(funding)}>
                    Open Dispute
                  </SecondaryButton>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {contract && (
        <Card className="mt-6">
          <SectionHeading>Contract</SectionHeading>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {contract.projectName} — {formatMoney(contract.agreedAmount)} with {getAccountName(isCustomer ? contract.contractorId : contract.customerId)}
            </p>
            <Link href={`/contracts/${contract.id}`} className="text-sm font-bold text-[#219b31] hover:underline">
              View Contract
            </Link>
          </div>
        </Card>
      )}

      <ReasonModal
        open={Boolean(releaseRequestFor)}
        title="Request milestone release"
        description="Summarize the completion evidence, inspection result and any approved change orders for the customer to review."
        reasonLabel="Evidence summary"
        confirmLabel="Request Release"
        onClose={() => setReleaseRequestFor(null)}
        onConfirm={async (evidence) => {
          if (releaseRequestFor) FundingService.requestRelease(releaseRequestFor, account.id, evidence);
          showToast("Release requested.", "success");
        }}
      />
      <ReleaseDecisionModal
        funding={decisionFor}
        open={Boolean(decisionFor)}
        onClose={() => setDecisionFor(null)}
        onDecide={async (decision, reason) => {
          if (decisionFor) FundingService.decideRelease(decisionFor.id, account.id, decision, reason);
          showToast(decision === "approved" ? "Release approved." : decision === "rejected" ? "Release rejected." : "Clarification requested.", "info");
        }}
      />
      <DisputeModal
        open={Boolean(disputeFor)}
        contextLabel={disputeFor ? `Milestone funding for ${project.name}` : ""}
        onClose={() => setDisputeFor(null)}
        onConfirm={async (category, description) => {
          if (disputeFor) DisputeService.open({ openedBy: account.id, category, description, fundingAllocationId: disputeFor.id });
          showToast("Dispute opened — release is frozen until it's resolved.", "info");
        }}
      />
    </PageFrame>
  );
}

function StatusBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      {children}
    </div>
  );
}
