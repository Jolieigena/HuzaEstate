import { FinanceStoreEngine } from "./store";
import { InvoiceService } from "./invoiceService";
import { newId } from "./ids";
import { addMoney, subtractMoney } from "./money";
import { getActiveProvider } from "./provider";
import type { Money, Payment, RefundReason, RefundRequest } from "./types";

export const RefundService = {
  getAll(): RefundRequest[] {
    return FinanceStoreEngine.getStore().refundRequests;
  },
  getById(id: string): RefundRequest | undefined {
    return FinanceStoreEngine.getStore().refundRequests.find((r) => r.id === id);
  },
  getForPayment(paymentId: string): RefundRequest[] {
    return FinanceStoreEngine.getStore().refundRequests.filter((r) => r.paymentId === paymentId);
  },
  getForAccount(accountId: string): RefundRequest[] {
    const s = FinanceStoreEngine.getStore();
    return s.refundRequests.filter((r) => {
      const payment = s.payments.find((p) => p.id === r.paymentId);
      return r.requestedBy === accountId || payment?.payerId === accountId || payment?.recipientId === accountId;
    });
  },

  maxRefundable(payment: Payment): Money {
    return subtractMoney(payment.amount, payment.refundedAmount);
  },

  request(payment: Payment, requestedBy: string, reason: RefundReason, requestedAmount: Money, reasonNote?: string): RefundRequest {
    const previouslyRefunded = payment.refundedAmount;
    const maxRefundable = RefundService.maxRefundable(payment);
    const refund = FinanceStoreEngine.mutate((s) => {
      const record: RefundRequest = {
        id: newId("refund"),
        paymentId: payment.id,
        requestedBy,
        reason,
        reasonNote,
        evidenceDocumentIds: [],
        maxRefundable,
        previouslyRefunded,
        requestedAmount,
        status: "requested",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      s.refundRequests = [...s.refundRequests, record];
      return record;
    });
    FinanceStoreEngine.appendAudit("refund_requested", requestedBy, "refund", refund.id, `Refund requested for payment ${payment.id}: ${requestedAmount.amountMinor} ${requestedAmount.currency}.`, reasonNote);
    return refund;
  },

  review(refundId: string, reviewedBy: string, decision: "approved" | "rejected", note: string): RefundRequest | undefined {
    const updated = FinanceStoreEngine.mutate((s) => {
      const refund = s.refundRequests.find((r) => r.id === refundId);
      if (!refund || refund.status !== "requested") return refund;
      refund.status = decision === "approved" ? "approved" : "rejected";
      refund.reviewedBy = reviewedBy;
      refund.reviewNote = note;
      refund.updatedAt = new Date().toISOString();
      s.refundRequests = s.refundRequests.map((r) => (r.id === refundId ? refund : r));
      return refund;
    });
    if (!updated) return updated;
    FinanceStoreEngine.appendAudit(decision === "approved" ? "refund_approved" : "reconciliation_resolved", reviewedBy, "refund", refundId, note, note);
    return updated;
  },

  /** Submits an approved refund to the (mock) provider — never marks it complete without provider confirmation. */
  async submitToProvider(refundId: string): Promise<RefundRequest | undefined> {
    const refund = RefundService.getById(refundId);
    if (!refund || refund.status !== "approved") return refund;
    const config = FinanceStoreEngine.getStore().paymentConfiguration;
    const provider = getActiveProvider(config);
    const result = await provider.requestRefund(refund.paymentId, refund.requestedAmount);

    return FinanceStoreEngine.mutate((s) => {
      const r = s.refundRequests.find((x) => x.id === refundId);
      if (!r) return undefined;
      r.status = "processing";
      r.updatedAt = new Date().toISOString();
      s.refundRequests = s.refundRequests.map((x) => (x.id === refundId ? r : x));
      void result;
      return r;
    });
  },

  /** Demonstration-only ("Simulate Provider Processing") — a real deployment confirms this from a provider webhook, never from the browser alone. */
  simulateProviderCompletion(refundId: string): RefundRequest | undefined {
    const updated = FinanceStoreEngine.mutate((s) => {
      const refund = s.refundRequests.find((r) => r.id === refundId);
      if (!refund || refund.status !== "processing") return refund;
      refund.status = "completed";
      refund.completedAt = new Date().toISOString();
      refund.updatedAt = refund.completedAt;
      s.refundRequests = s.refundRequests.map((r) => (r.id === refundId ? refund : r));

      const payment = s.payments.find((p) => p.id === refund.paymentId);
      if (payment) {
        payment.refundedAmount = addMoney(payment.refundedAmount, refund.requestedAmount);
        const fullyRefunded = payment.refundedAmount.amountMinor >= payment.amount.amountMinor;
        payment.status = fullyRefunded ? "refunded" : "partially_refunded";
        payment.statusHistory = [...payment.statusHistory, { status: payment.status, at: refund.completedAt!, note: `Refund ${refundId} completed.`, source: "provider" }];
        s.payments = s.payments.map((p) => (p.id === payment.id ? payment : p));
      }
      return refund;
    });
    if (!updated) return updated;

    const payment = FinanceStoreEngine.getStore().payments.find((p) => p.id === updated.paymentId);
    if (payment) InvoiceService.applyRefund(payment.invoiceId, updated.requestedAmount);

    FinanceStoreEngine.appendAudit("refund_completed", "system", "refund", refundId, `Refund of ${updated.requestedAmount.amountMinor} ${updated.requestedAmount.currency} completed.`);
    if (payment) FinanceStoreEngine.notifyAccount("customer", payment.payerId, "Refund completed", "Your refund has been completed by the provider.", `/payments/${payment.id}`);
    return updated;
  },
};
