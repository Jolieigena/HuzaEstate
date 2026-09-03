import { FinanceStoreEngine } from "./store";
import { SettlementService } from "./settlementService";
import { newId } from "./ids";
import type { FundingAllocation, Payment, ReleaseDecision } from "./types";

const RELEASE_DECISION_WINDOW_DAYS = 3;

export const FundingService = {
  getAll(): FundingAllocation[] {
    return FinanceStoreEngine.getStore().fundingAllocations;
  },
  getById(id: string): FundingAllocation | undefined {
    return FinanceStoreEngine.getStore().fundingAllocations.find((f) => f.id === id);
  },
  getForExecutionProject(executionProjectId: string): FundingAllocation[] {
    return FinanceStoreEngine.getStore().fundingAllocations.filter((f) => f.executionProjectId === executionProjectId);
  },
  getForMilestone(executionProjectId: string, milestoneId: string): FundingAllocation | undefined {
    return FinanceStoreEngine.getStore().fundingAllocations.find((f) => f.executionProjectId === executionProjectId && f.milestoneId === milestoneId);
  },
  getForAccount(accountId: string): FundingAllocation[] {
    return FinanceStoreEngine.getStore().fundingAllocations.filter((f) => f.customerId === accountId || f.recipientId === accountId);
  },

  confirmFunding(contractId: string, executionProjectId: string, milestoneId: string, payment: Payment): FundingAllocation {
    const updated = FinanceStoreEngine.mutate((s) => {
      const now = new Date().toISOString();
      const existing = s.fundingAllocations.find((f) => f.executionProjectId === executionProjectId && f.milestoneId === milestoneId);
      if (existing) {
        existing.status = "provider_confirmed";
        existing.paymentId = payment.id;
        existing.fundingDate = now;
        existing.updatedAt = now;
        s.fundingAllocations = s.fundingAllocations.map((f) => (f.id === existing.id ? existing : f));
        return existing;
      }
      const created: FundingAllocation = {
        id: newId("funding"),
        contractId,
        executionProjectId,
        milestoneId,
        customerId: payment.payerId,
        recipientId: payment.recipientId,
        amount: payment.fees.serviceAmount,
        provider: payment.provider,
        providerMode: payment.providerMode,
        status: "provider_confirmed",
        paymentId: payment.id,
        fundingDate: now,
        eligibilityConditions: ["Milestone accepted by customer", "Required inspection passed"],
        releaseDecisions: [],
        createdAt: now,
        updatedAt: now,
      };
      s.fundingAllocations = [...s.fundingAllocations, created];
      return created;
    });
    FinanceStoreEngine.appendAudit("funding_confirmed", "system", "funding", updated.id, `Funding confirmed for milestone ${milestoneId}.`);
    FinanceStoreEngine.notifyAccount("customer", updated.customerId, "Milestone funding confirmed", "Your milestone payment has been confirmed by the provider.", `/execution/${executionProjectId}/payments`);
    return updated;
  },

  /** Contractor requests release once evidence, inspection and no blocking defects are in place (enforced by the UI/permissions layer). */
  requestRelease(fundingId: string, requestedBy: string, evidenceSummary: string): FundingAllocation | undefined {
    const updated = FinanceStoreEngine.mutate((s) => {
      const f = s.fundingAllocations.find((x) => x.id === fundingId);
      if (!f) return undefined;
      if (!["provider_confirmed", "protected_by_provider", "release_rejected"].includes(f.status)) return f;
      f.status = "release_requested";
      f.releaseRequestedAt = new Date().toISOString();
      f.releaseRequestedBy = requestedBy;
      f.releaseEvidenceSummary = evidenceSummary;
      f.releaseDecisionDeadline = new Date(Date.now() + RELEASE_DECISION_WINDOW_DAYS * 86_400_000).toISOString();
      f.updatedAt = new Date().toISOString();
      s.fundingAllocations = s.fundingAllocations.map((x) => (x.id === fundingId ? f : x));
      return f;
    });
    if (updated && updated.status === "release_requested") {
      FinanceStoreEngine.appendAudit("release_requested", requestedBy, "funding", fundingId, "Contractor requested milestone release.");
      FinanceStoreEngine.notifyAccount("customer", updated.customerId, "Release requested", "A contractor has requested release of milestone funds — review is required.", `/execution/${updated.executionProjectId}/payments`);
    }
    return updated;
  },

  /** Customer decides. Contractor cannot approve their own release, and an
   *  administrator cannot decide on the customer's behalf, so this only
   *  accepts a customer decision — enforced again here as defense in depth
   *  alongside the UI-level permission check in finance/permissions.ts. */
  decideRelease(fundingId: string, decidedBy: string, decision: ReleaseDecision["decision"], reason?: string): FundingAllocation | undefined {
    const updated = FinanceStoreEngine.mutate((s) => {
      const f = s.fundingAllocations.find((x) => x.id === fundingId);
      if (!f || f.status !== "release_requested") return f;
      f.releaseDecisions = [...f.releaseDecisions, { id: newId("reldec"), decidedBy, role: "customer", decision, reason, at: new Date().toISOString() }];
      if (decision === "approved") f.status = "release_approved";
      else if (decision === "rejected") f.status = "release_rejected";
      f.updatedAt = new Date().toISOString();
      s.fundingAllocations = s.fundingAllocations.map((x) => (x.id === fundingId ? f : x));
      return f;
    });
    if (!updated) return updated;

    if (decision === "approved") {
      FinanceStoreEngine.appendAudit("release_approved", decidedBy, "funding", fundingId, "Customer approved milestone release.");
      const settlement = SettlementService.scheduleFromFundingApproval(updated);
      FinanceStoreEngine.mutate((s) => {
        const f = s.fundingAllocations.find((x) => x.id === fundingId);
        if (f) {
          f.settlementId = settlement.id;
          s.fundingAllocations = s.fundingAllocations.map((x) => (x.id === fundingId ? f : x));
        }
      });
      FinanceStoreEngine.notifyAccount("professional", updated.recipientId, "Release approved", "Your milestone release has been approved and settlement is scheduled.", "/professional/settlements");
    } else if (decision === "rejected") {
      FinanceStoreEngine.appendAudit("release_rejected", decidedBy, "funding", fundingId, reason ?? "Customer rejected the release request.", reason);
      FinanceStoreEngine.notifyAccount("professional", updated.recipientId, "Release rejected", "Your milestone release request was rejected — see the reason on the milestone.", `/execution/${updated.executionProjectId}/payments`);
    } else {
      FinanceStoreEngine.notifyAccount("professional", updated.recipientId, "Clarification requested", "The customer requested clarification before deciding on the release.", `/execution/${updated.executionProjectId}/payments`);
    }
    return updated;
  },

  respondToClarification(fundingId: string, respondedBy: string, note: string): FundingAllocation | undefined {
    return FinanceStoreEngine.mutate((s) => {
      const f = s.fundingAllocations.find((x) => x.id === fundingId);
      if (!f) return undefined;
      f.releaseEvidenceSummary = `${f.releaseEvidenceSummary ?? ""}\n\nContractor response: ${note}`.trim();
      f.updatedAt = new Date().toISOString();
      s.fundingAllocations = s.fundingAllocations.map((x) => (x.id === fundingId ? f : x));
      return f;
    });
  },

  markReleased(fundingId: string): FundingAllocation | undefined {
    const updated = FinanceStoreEngine.mutate((s) => {
      const f = s.fundingAllocations.find((x) => x.id === fundingId);
      if (!f) return undefined;
      f.status = "released";
      f.updatedAt = new Date().toISOString();
      s.fundingAllocations = s.fundingAllocations.map((x) => (x.id === fundingId ? f : x));
      return f;
    });
    if (updated) FinanceStoreEngine.notifyAccount("professional", updated.recipientId, "Settlement completed", "Your milestone settlement has completed.", "/professional/settlements");
    return updated;
  },

  markDisputed(fundingId: string, disputeId: string): FundingAllocation | undefined {
    return FinanceStoreEngine.mutate((s) => {
      const f = s.fundingAllocations.find((x) => x.id === fundingId);
      if (!f) return undefined;
      f.status = "disputed";
      f.disputeId = disputeId;
      f.updatedAt = new Date().toISOString();
      s.fundingAllocations = s.fundingAllocations.map((x) => (x.id === fundingId ? f : x));
      return f;
    });
  },

  clearDispute(fundingId: string, restoredStatus: FundingAllocation["status"] = "provider_confirmed"): FundingAllocation | undefined {
    return FinanceStoreEngine.mutate((s) => {
      const f = s.fundingAllocations.find((x) => x.id === fundingId);
      if (!f) return undefined;
      f.status = restoredStatus;
      f.disputeId = undefined;
      f.updatedAt = new Date().toISOString();
      s.fundingAllocations = s.fundingAllocations.map((x) => (x.id === fundingId ? f : x));
      return f;
    });
  },

  freeze(fundingId: string, adminId: string, reason: string): FundingAllocation | undefined {
    const updated = FinanceStoreEngine.mutate((s) => {
      const f = s.fundingAllocations.find((x) => x.id === fundingId);
      if (!f) return undefined;
      f.status = "frozen";
      f.updatedAt = new Date().toISOString();
      s.fundingAllocations = s.fundingAllocations.map((x) => (x.id === fundingId ? f : x));
      return f;
    });
    if (updated) FinanceStoreEngine.appendAudit("transaction_frozen", adminId, "funding", fundingId, reason, reason);
    return updated;
  },
};
