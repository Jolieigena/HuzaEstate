import { FinanceStoreEngine } from "./store";
import { FundingService } from "./fundingService";
import { newId } from "./ids";
import { applyBasisPoints, subtractMoney, zeroMoney } from "./money";
import type { FundingAllocation, Invoice, Payment, Settlement } from "./types";

const MARKETPLACE_COMMISSION_BASIS_POINTS = 500; // 5%
const PAYOUT_PROVIDER_FEE_BASIS_POINTS = 100; // 1%

function buildSettlement(input: Omit<Settlement, "id" | "platformFee" | "providerFee" | "taxWithholding" | "netAmount" | "status" | "reconciliationStatus" | "createdAt" | "updatedAt">): Settlement {
  const platformFee = applyBasisPoints(input.grossAmount, MARKETPLACE_COMMISSION_BASIS_POINTS);
  const providerFee = applyBasisPoints(input.grossAmount, PAYOUT_PROVIDER_FEE_BASIS_POINTS);
  const taxWithholding = zeroMoney(input.grossAmount.currency);
  const netAmount = subtractMoney(subtractMoney(input.grossAmount, platformFee), providerFee);
  const now = new Date().toISOString();
  return { ...input, id: newId("settle"), platformFee, providerFee, taxWithholding, netAmount, status: "scheduled", reconciliationStatus: "pending", createdAt: now, updatedAt: now };
}

export const SettlementService = {
  getAll(): Settlement[] {
    return FinanceStoreEngine.getStore().settlements;
  },
  getById(id: string): Settlement | undefined {
    return FinanceStoreEngine.getStore().settlements.find((s) => s.id === id);
  },
  getForAccount(recipientId: string): Settlement[] {
    return FinanceStoreEngine.getStore().settlements.filter((s) => s.recipientId === recipientId);
  },

  scheduleFromPayment(payment: Payment, invoice: Invoice): Settlement {
    const settlementScheduleDays = FinanceStoreEngine.getStore().paymentConfiguration.settlementScheduleDays;
    const settlement = buildSettlement({
      recipientId: payment.recipientId,
      paymentId: payment.id,
      grossAmount: payment.fees.serviceAmount,
      expectedDate: new Date(Date.now() + settlementScheduleDays * 86_400_000).toISOString(),
      relatedInvoiceId: invoice.id,
    });
    FinanceStoreEngine.mutate((s) => {
      s.settlements = [...s.settlements, settlement];
    });
    FinanceStoreEngine.notifyAccount("professional", settlement.recipientId, "Settlement scheduled", `Your settlement for ${invoice.reference} is scheduled.`, "/professional/settlements");
    return settlement;
  },

  scheduleFromFundingApproval(funding: FundingAllocation): Settlement {
    const settlementScheduleDays = FinanceStoreEngine.getStore().paymentConfiguration.settlementScheduleDays;
    const settlement = buildSettlement({
      recipientId: funding.recipientId,
      fundingAllocationId: funding.id,
      grossAmount: funding.amount,
      expectedDate: new Date(Date.now() + settlementScheduleDays * 86_400_000).toISOString(),
      relatedExecutionProjectId: funding.executionProjectId,
    });
    FinanceStoreEngine.mutate((s) => {
      s.settlements = [...s.settlements, settlement];
    });
    return settlement;
  },

  /** Demonstration-only action ("Simulate Settlement Completion") — a real
   *  deployment would receive this from a provider payout webhook. */
  simulateCompletion(settlementId: string): Settlement | undefined {
    const updated = FinanceStoreEngine.mutate((s) => {
      const settlement = s.settlements.find((x) => x.id === settlementId);
      if (!settlement || settlement.status === "completed") return settlement;
      settlement.status = "completed";
      settlement.completedDate = new Date().toISOString();
      settlement.reconciliationStatus = "matched";
      settlement.updatedAt = new Date().toISOString();
      s.settlements = s.settlements.map((x) => (x.id === settlementId ? settlement : x));
      return settlement;
    });
    if (!updated) return updated;
    FinanceStoreEngine.appendAudit("settlement_completed", "system", "settlement", settlementId, `Settlement completed: net ${updated.netAmount.amountMinor} ${updated.netAmount.currency}.`);
    FinanceStoreEngine.notifyAccount("professional", updated.recipientId, "Settlement completed", "Your settlement has completed.", "/professional/settlements");
    if (updated.fundingAllocationId) FundingService.markReleased(updated.fundingAllocationId);
    return updated;
  },

  markFailed(settlementId: string, _reason: string): Settlement | undefined {
    return FinanceStoreEngine.mutate((s) => {
      const settlement = s.settlements.find((x) => x.id === settlementId);
      if (!settlement) return undefined;
      settlement.status = "failed";
      settlement.updatedAt = new Date().toISOString();
      s.settlements = s.settlements.map((x) => (x.id === settlementId ? settlement : x));
      return settlement;
    });
  },
};
