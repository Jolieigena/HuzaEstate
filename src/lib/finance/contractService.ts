import type { ExecutionProject } from "@/lib/execution/types";
import { FinanceStoreEngine } from "./store";
import { newId } from "./ids";
import { money } from "./money";
import type { Contract, ContractAmendment, PartyRole } from "./types";

function isFullyAcknowledged(contract: Contract): boolean {
  const roles = new Set(contract.acknowledgements.map((a) => a.role));
  const needsProfessional = Boolean(contract.professionalId);
  return roles.has("customer") && (roles.has("contractor") || roles.has("professional")) && (!needsProfessional || roles.has("professional"));
}

export const ContractService = {
  getAll(): Contract[] {
    return FinanceStoreEngine.getStore().contracts;
  },

  getById(id: string): Contract | undefined {
    return FinanceStoreEngine.getStore().contracts.find((c) => c.id === id);
  },

  getByExecutionProjectId(executionProjectId: string): Contract | undefined {
    return FinanceStoreEngine.getStore().contracts.find((c) => c.executionProjectId === executionProjectId);
  },

  getForAccount(accountId: string): Contract[] {
    return FinanceStoreEngine.getStore().contracts.filter((c) => c.customerId === accountId || c.contractorId === accountId || c.professionalId === accountId);
  },

  /** Lazily generates a Draft contract from an accepted quotation's
   *  ExecutionProject the first time anyone opens a contract-related
   *  screen for it, so no existing acceptance flow needs to be modified. */
  getOrCreateForExecutionProject(project: ExecutionProject): Contract {
    const existing = ContractService.getByExecutionProjectId(project.id);
    if (existing) return existing;

    return FinanceStoreEngine.mutate((s) => {
      const raceCheck = s.contracts.find((c) => c.executionProjectId === project.id);
      if (raceCheck) return raceCheck;

      const contract: Contract = {
        id: newId("contract"),
        version: 1,
        executionProjectId: project.id,
        sourceQuotationId: project.sourceQuotationId,
        customerId: project.customerId,
        contractorId: project.contractorId,
        projectName: project.name,
        scopeSummary: project.approvedScopeSummary || "Scope as per the accepted contractor quotation.",
        inclusions: [],
        exclusions: [],
        agreedAmount: money(project.contractValue, project.currency),
        milestones: project.milestones.map((m) => ({ milestoneId: m.id, title: m.title, amount: money(m.contractValueAllocation, project.currency) })),
        changeOrderRules: "Change orders require quantity surveyor costing, professional review, and customer approval before the contract value is amended.",
        paymentScheduleSummary: "Milestone-based: each milestone is invoiced on submission and funded before the contractor can request release.",
        timelineSummary: `Start ${project.startDate}, target completion ${project.targetCompletionDate}.`,
        inspectionResponsibilities: "Required inspections must pass before a milestone becomes payment eligible.",
        customerResponsibilities: "Timely review of milestone submissions and change requests.",
        contractorResponsibilities: "Site safety, material quality, and schedule adherence per approved work packages.",
        warrantySummary: "See attached warranty records for this project.",
        disputeProcess: "Either party may open a payment dispute, which freezes any pending release until resolved.",
        cancellationTerms: "Cancellation prior to milestone funding requires no penalty; funded milestones follow the refund process.",
        attachedDocumentIds: [],
        termsVersion: "finance-terms-v1",
        status: "draft",
        acknowledgements: [],
        correctionRequests: [],
        amendments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      s.contracts = [...s.contracts, contract];
      return contract;
    });
  },

  acknowledge(contractId: string, accountId: string, role: PartyRole, confirmationStatement: string): Contract | undefined {
    const updated = FinanceStoreEngine.mutate((s) => {
      const contract = s.contracts.find((c) => c.id === contractId);
      if (!contract) return undefined;
      if (contract.acknowledgements.some((a) => a.accountId === accountId && a.contractVersion === contract.version)) return contract;

      contract.acknowledgements = [
        ...contract.acknowledgements,
        { id: newId("ack"), accountId, role, at: new Date().toISOString(), contractVersion: contract.version, termsVersion: contract.termsVersion, confirmationStatement },
      ];
      if (isFullyAcknowledged(contract)) {
        contract.status = "active";
        contract.activatedAt = new Date().toISOString();
      } else {
        contract.status = role === "customer" ? "under_contractor_review" : "under_customer_review";
      }
      contract.updatedAt = new Date().toISOString();
      s.contracts = s.contracts.map((c) => (c.id === contractId ? contract : c));
      return contract;
    });

    if (updated) {
      FinanceStoreEngine.appendAudit("contract_acknowledged", accountId, "contract", contractId, `${role} acknowledged contract v${updated.version}${updated.status === "active" ? " — contract is now Active." : "."}`);
      if (updated.status === "active") {
        const other = role === "customer" ? updated.contractorId : updated.customerId;
        if (other) FinanceStoreEngine.notifyAccount(role === "customer" ? "professional" : "customer", other, "Contract acknowledged", `${updated.projectName} contract is now Active.`, `/contracts/${contractId}`);
      }
    }
    return updated;
  },

  requestCorrection(contractId: string, accountId: string, role: PartyRole, note: string): Contract | undefined {
    return FinanceStoreEngine.mutate((s) => {
      const contract = s.contracts.find((c) => c.id === contractId);
      if (!contract) return undefined;
      contract.correctionRequests = [...contract.correctionRequests, { id: newId("corr"), byAccountId: accountId, role, note, at: new Date().toISOString() }];
      contract.status = "correction_requested";
      contract.updatedAt = new Date().toISOString();
      s.contracts = s.contracts.map((c) => (c.id === contractId ? contract : c));
      return contract;
    });
  },

  createAmendment(contractId: string, input: Omit<ContractAmendment, "id" | "contractId" | "createdAt">): Contract | undefined {
    const updated = FinanceStoreEngine.mutate((s) => {
      const contract = s.contracts.find((c) => c.id === contractId);
      if (!contract) return undefined;
      const amendment: ContractAmendment = { ...input, id: newId("amend"), contractId, createdAt: new Date().toISOString() };
      contract.amendments = [...contract.amendments, amendment];
      contract.agreedAmount = amendment.revisedContractValue;
      contract.status = "amended";
      contract.version += 1;
      contract.updatedAt = new Date().toISOString();
      s.contracts = s.contracts.map((c) => (c.id === contractId ? contract : c));
      return contract;
    });
    if (updated) FinanceStoreEngine.appendAudit("contract_amended", "system", "contract", contractId, `Contract amended — revised value ${updated.agreedAmount.amountMinor} ${updated.agreedAmount.currency}.`);
    return updated;
  },
};
