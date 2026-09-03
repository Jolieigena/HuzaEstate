"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useContract } from "@/lib/finance/hooks";
import { ContractService } from "@/lib/finance/contractService";
import { canAcknowledgeContract, canViewContract } from "@/lib/finance/permissions";
import { formatMoney } from "@/lib/finance/money";
import { formatDate, formatDateTime, PROTOTYPE_ACKNOWLEDGEMENT_LABEL } from "@/lib/finance/format";
import { getAccountName } from "@/lib/finance/accountLookup";
import type { PartyRole } from "@/lib/finance/types";
import { useToast } from "@/lib/toast-context";
import AcknowledgeContractModal from "./modals/AcknowledgeContractModal";
import ReasonModal from "./modals/ReasonModal";
import { PageFrame, Card, FinancePill, EmptyState, PrimaryButton, SecondaryButton, SectionHeading, PrototypeBanner } from "./ui";

function roleFor(contract: { customerId: string; contractorId?: string; professionalId?: string }, accountId: string): PartyRole {
  if (contract.customerId === accountId) return "customer";
  if (contract.contractorId === accountId) return "contractor";
  if (contract.professionalId === accountId) return "professional";
  return "administrator";
}

export default function ContractDetailView({ contractId }: { contractId: string }) {
  const { account, isAuthReady } = useAuth();
  const contract = useContract(contractId);
  const [ackOpen, setAckOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const { showToast } = useToast();

  if (!isAuthReady || !account) return null;

  if (!contract || !canViewContract(account.id, contract)) {
    return (
      <PageFrame title="Contract" description="">
        <EmptyState title="Contract not found" description="This contract doesn't exist, or you don't have access to it." />
      </PageFrame>
    );
  }

  const role = roleFor(contract, account.id);
  const canAck = canAcknowledgeContract(account.id, contract);

  return (
    <PageFrame title={contract.projectName} description={`Contract v${contract.version} · Terms ${contract.termsVersion}`} action={<FinancePill status={contract.status} />}>
      <div className="mb-6">
        <PrototypeBanner />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <SectionHeading>Scope</SectionHeading>
            <p className="mb-3 text-sm text-slate-700">{contract.scopeSummary}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Inclusions</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                  {contract.inclusions.length > 0 ? contract.inclusions.map((i, idx) => <li key={idx}>{i}</li>) : <li className="text-slate-400">None listed</li>}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Exclusions</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                  {contract.exclusions.length > 0 ? contract.exclusions.map((i, idx) => <li key={idx}>{i}</li>) : <li className="text-slate-400">None listed</li>}
                </ul>
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeading>Milestones & payment schedule</SectionHeading>
            <p className="mb-3 text-sm text-slate-700">{contract.paymentScheduleSummary}</p>
            <ul className="divide-y divide-slate-100">
              {contract.milestones.map((m) => (
                <li key={m.milestoneId} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-slate-800">{m.title}</span>
                  <span className="font-bold text-slate-900">{formatMoney(m.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionHeading>Responsibilities & terms</SectionHeading>
            <dl className="space-y-3 text-sm">
              <div><dt className="font-bold text-slate-800">Timeline</dt><dd className="text-slate-600">{contract.timelineSummary}</dd></div>
              <div><dt className="font-bold text-slate-800">Change orders</dt><dd className="text-slate-600">{contract.changeOrderRules}</dd></div>
              <div><dt className="font-bold text-slate-800">Inspections</dt><dd className="text-slate-600">{contract.inspectionResponsibilities}</dd></div>
              <div><dt className="font-bold text-slate-800">Customer responsibilities</dt><dd className="text-slate-600">{contract.customerResponsibilities}</dd></div>
              <div><dt className="font-bold text-slate-800">Contractor responsibilities</dt><dd className="text-slate-600">{contract.contractorResponsibilities}</dd></div>
              <div><dt className="font-bold text-slate-800">Warranty</dt><dd className="text-slate-600">{contract.warrantySummary}</dd></div>
              <div><dt className="font-bold text-slate-800">Dispute process</dt><dd className="text-slate-600">{contract.disputeProcess}</dd></div>
              <div><dt className="font-bold text-slate-800">Cancellation terms</dt><dd className="text-slate-600">{contract.cancellationTerms}</dd></div>
            </dl>
          </Card>

          {contract.amendments.length > 0 && (
            <Card>
              <SectionHeading>Amendment history</SectionHeading>
              <ul className="space-y-3">
                {contract.amendments.map((a) => (
                  <li key={a.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                    <p className="font-bold text-slate-900">{formatMoney(a.previousContractValue)} → {formatMoney(a.revisedContractValue)}</p>
                    <p className="mt-1 text-slate-600">{a.reason}</p>
                    <p className="mt-1 text-xs text-slate-400">Effective {formatDate(a.effectiveDate)}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <SectionHeading>Agreed amount</SectionHeading>
            <p className="text-2xl font-black text-slate-900">{formatMoney(contract.agreedAmount)}</p>
          </Card>

          <Card>
            <SectionHeading>Acknowledgements</SectionHeading>
            {contract.acknowledgements.length === 0 ? (
              <p className="text-sm text-slate-500">No one has acknowledged this version yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {contract.acknowledgements.map((a) => (
                  <li key={a.id}>
                    <p className="font-semibold text-slate-800">{getAccountName(a.accountId)} ({a.role})</p>
                    <p className="text-xs text-slate-400">{formatDateTime(a.at)} · v{a.contractVersion}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-slate-400">{PROTOTYPE_ACKNOWLEDGEMENT_LABEL}</p>
          </Card>

          <Card>
            <SectionHeading>Actions</SectionHeading>
            <div className="flex flex-col gap-2">
              {canAck && <PrimaryButton onClick={() => setAckOpen(true)}>Acknowledge Contract</PrimaryButton>}
              {contract.status !== "active" && contract.status !== "completed" && (
                <SecondaryButton onClick={() => setCorrectionOpen(true)}>Request Correction</SecondaryButton>
              )}
              {!canAck && contract.status === "active" && <p className="text-xs text-slate-500">Contract is Active — both parties have acknowledged this version.</p>}
            </div>
          </Card>
        </div>
      </div>

      <AcknowledgeContractModal
        contract={contract}
        open={ackOpen}
        onClose={() => setAckOpen(false)}
        onConfirm={async (statement) => {
          ContractService.acknowledge(contract.id, account.id, role, statement);
          showToast("Contract acknowledged.", "success");
        }}
      />
      <ReasonModal
        open={correctionOpen}
        title="Request a correction"
        description="Describe what needs to change before you can acknowledge this contract."
        reasonLabel="What needs to be corrected?"
        confirmLabel="Request Correction"
        onClose={() => setCorrectionOpen(false)}
        onConfirm={async (note) => {
          ContractService.requestCorrection(contract.id, account.id, role, note);
          showToast("Correction requested.", "info");
        }}
      />
    </PageFrame>
  );
}
