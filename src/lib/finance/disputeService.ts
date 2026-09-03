import { FinanceStoreEngine } from "./store";
import { FundingService } from "./fundingService";
import { InvoiceService } from "./invoiceService";
import { newId } from "./ids";
import type { DisputeCategory, PaymentDispute } from "./types";

export interface OpenDisputeInput {
  openedBy: string;
  category: DisputeCategory;
  description: string;
  paymentId?: string;
  fundingAllocationId?: string;
  invoiceId?: string;
}

export const DisputeService = {
  getAll(): PaymentDispute[] {
    return FinanceStoreEngine.getStore().disputes;
  },
  getById(id: string): PaymentDispute | undefined {
    return FinanceStoreEngine.getStore().disputes.find((d) => d.id === id);
  },
  getForAccount(accountId: string): PaymentDispute[] {
    const s = FinanceStoreEngine.getStore();
    return s.disputes.filter((d) => {
      if (d.openedBy === accountId) return true;
      const payment = s.payments.find((p) => p.id === d.paymentId);
      return payment?.payerId === accountId || payment?.recipientId === accountId;
    });
  },

  open(input: OpenDisputeInput): PaymentDispute {
    const dispute = FinanceStoreEngine.mutate((s) => {
      const record: PaymentDispute = {
        id: newId("dispute"),
        paymentId: input.paymentId,
        fundingAllocationId: input.fundingAllocationId,
        invoiceId: input.invoiceId,
        openedBy: input.openedBy,
        category: input.category,
        description: input.description,
        evidenceDocumentIds: [],
        status: "open",
        freezesRelease: Boolean(input.fundingAllocationId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      s.disputes = [...s.disputes, record];

      if (input.paymentId) {
        const payment = s.payments.find((p) => p.id === input.paymentId);
        if (payment) {
          payment.status = "disputed";
          payment.statusHistory = [...payment.statusHistory, { status: "disputed", at: record.createdAt, note: "Dispute opened.", source: "customer" }];
          s.payments = s.payments.map((p) => (p.id === payment.id ? payment : p));
        }
      }
      return record;
    });

    if (input.fundingAllocationId) FundingService.markDisputed(input.fundingAllocationId, dispute.id);
    if (input.invoiceId) InvoiceService.markDisputed(input.invoiceId);

    FinanceStoreEngine.appendAudit("dispute_opened", input.openedBy, "dispute", dispute.id, `${input.category} dispute opened.`, input.description);
    FinanceStoreEngine.notifyAccount("admin", "admin-super", "Dispute opened", `A ${input.category} dispute was opened and needs review.`, "/admin/finance/refunds");
    return dispute;
  },

  resolve(disputeId: string, resolvedBy: string, resolution: "resolved_favour_customer" | "resolved_favour_recipient" | "resolved_partial", note: string): PaymentDispute | undefined {
    const updated = FinanceStoreEngine.mutate((s) => {
      const dispute = s.disputes.find((d) => d.id === disputeId);
      if (!dispute) return undefined;
      dispute.status = resolution;
      dispute.resolvedAt = new Date().toISOString();
      dispute.resolutionNote = note;
      dispute.updatedAt = dispute.resolvedAt;
      s.disputes = s.disputes.map((d) => (d.id === disputeId ? dispute : d));
      return dispute;
    });
    if (!updated) return updated;
    if (updated.fundingAllocationId) FundingService.clearDispute(updated.fundingAllocationId);
    FinanceStoreEngine.appendAudit("dispute_resolved", resolvedBy, "dispute", disputeId, note, note);
    return updated;
  },

  withdraw(disputeId: string, actorId: string): PaymentDispute | undefined {
    const updated = FinanceStoreEngine.mutate((s) => {
      const dispute = s.disputes.find((d) => d.id === disputeId);
      if (!dispute) return undefined;
      dispute.status = "withdrawn";
      dispute.resolvedAt = new Date().toISOString();
      dispute.updatedAt = dispute.resolvedAt;
      s.disputes = s.disputes.map((d) => (d.id === disputeId ? dispute : d));
      return dispute;
    });
    if (updated?.fundingAllocationId) FundingService.clearDispute(updated.fundingAllocationId);
    if (updated) FinanceStoreEngine.appendAudit("dispute_resolved", actorId, "dispute", disputeId, "Dispute withdrawn by the party who opened it.");
    return updated;
  },
};
