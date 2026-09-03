import { FinanceStoreEngine } from "./store";
import { InvoiceService } from "./invoiceService";
import { FundingService } from "./fundingService";
import { SettlementService } from "./settlementService";
import { newId } from "./ids";
import { getActiveProvider, simulateProviderOutcome, type MockOutcome } from "./provider";
import type { FeeConfiguration, Invoice, Payment, PaymentMethod, PaymentStatus, PaymentStatusHistoryEntry } from "./types";

const ACTIVE_STATUSES: PaymentStatus[] = ["draft", "awaiting_customer", "pending_provider", "authorisation_required", "processing"];
const TERMINAL_RETRIABLE: PaymentStatus[] = ["failed", "expired", "cancelled"];

function pushHistory(payment: Payment, status: PaymentStatus, source: PaymentStatusHistoryEntry["source"], note?: string) {
  payment.statusHistory = [...payment.statusHistory, { status, at: new Date().toISOString(), note, source }];
  payment.status = status;
}

function feeConfigFor(version: number): FeeConfiguration {
  const s = FinanceStoreEngine.getStore();
  return s.feeConfigVersions.find((f) => f.version === version) ?? s.feeConfigVersions[s.feeConfigVersions.length - 1];
}

export class PaymentNotAllowedError extends Error {}

export const PaymentService = {
  getAll(): Payment[] {
    return FinanceStoreEngine.getStore().payments;
  },
  getById(id: string): Payment | undefined {
    return FinanceStoreEngine.getStore().payments.find((p) => p.id === id);
  },
  getForAccount(accountId: string): Payment[] {
    return FinanceStoreEngine.getStore().payments.filter((p) => p.payerId === accountId || p.recipientId === accountId);
  },
  getForInvoice(invoiceId: string): Payment[] {
    return FinanceStoreEngine.getStore().payments.filter((p) => p.invoiceId === invoiceId);
  },
  getActivePaymentForInvoice(invoiceId: string): Payment | undefined {
    return FinanceStoreEngine.getStore().payments.find((p) => p.invoiceId === invoiceId && ACTIVE_STATUSES.includes(p.status));
  },

  /** Server-authoritative fee calculation via /api/finance/payments/calculate. */
  async calculateFees(invoice: Invoice) {
    const feeConfig = feeConfigFor(invoice.feeConfigVersion);
    const res = await fetch("/api/finance/payments/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineItems: invoice.lineItems, currency: invoice.currency, feeConfig, clientTotalMinor: invoice.amountOutstanding.amountMinor }),
    });
    if (!res.ok) throw new Error("Could not verify payment amount with the server.");
    return res.json() as Promise<{ ok: boolean; matchesClientTotal: boolean; breakdown: Payment["fees"]; authoritativeTotalMinor: number }>;
  },

  /** Starts (or safely re-returns) a payment attempt for an invoice.
   *  Duplicate-payment protection: an existing in-flight payment for the
   *  same invoice is returned instead of creating a second one. */
  async startPayment(invoice: Invoice, payerId: string, method: PaymentMethod, maskedDetail?: string): Promise<Payment> {
    if (["cancelled", "paid", "disputed"].includes(invoice.status) || invoice.amountOutstanding.amountMinor <= 0) {
      throw new PaymentNotAllowedError("This invoice is no longer payable.");
    }
    const existingActive = PaymentService.getActivePaymentForInvoice(invoice.id);
    if (existingActive) return existingActive;

    const config = FinanceStoreEngine.getStore().paymentConfiguration;
    const provider = getActiveProvider(config); // throws ProviderUnavailableError for sandbox/live

    const calc = await PaymentService.calculateFees(invoice);
    const fees = calc.breakdown;

    let providerReference: string | undefined;
    let resolvedMaskedDetail = maskedDetail;
    let expiresAt: string | undefined;
    if (method === "mobile_money") {
      const intent = await provider.initiateMobileMoneyRequest(newId("payment"), fees.totalCharge, maskedDetail ?? "•••• ••••");
      providerReference = intent.providerReference;
      resolvedMaskedDetail = intent.maskedDetail;
      expiresAt = intent.expiresAt;
    } else if (method === "bank_transfer") {
      const instruction = await provider.createBankTransferInstruction(newId("payment"), fees.totalCharge);
      providerReference = instruction.providerReference;
      resolvedMaskedDetail = instruction.uniqueReference;
      expiresAt = instruction.expiresAt;
    } else {
      const session = await provider.createCheckoutSession(newId("payment"), fees.totalCharge, method);
      providerReference = session.providerReference;
      expiresAt = session.expiresAt;
    }

    const payment: Payment = FinanceStoreEngine.mutate((s) => {
      const record: Payment = {
        id: newId("payment"),
        idempotencyKey: newId("idem"),
        invoiceId: invoice.id,
        executionProjectId: invoice.executionProjectId,
        payerId,
        recipientId: invoice.issuerId,
        provider: provider.id,
        providerMode: provider.mode,
        method,
        fees,
        amount: fees.totalCharge,
        status: "draft",
        providerReference,
        maskedPayerDetail: resolvedMaskedDetail,
        createdAt: new Date().toISOString(),
        expiresAt,
        refundedAmount: { amountMinor: 0, currency: fees.totalCharge.currency },
        reconciliationStatus: "pending",
        statusHistory: [],
      };
      pushHistory(record, "draft", "customer");
      pushHistory(record, "processing", "system", "Provider intent created.");
      s.payments = [...s.payments, record];
      return record;
    });

    FinanceStoreEngine.appendAudit("payment_initiated", payerId, "payment", payment.id, `Payment initiated for invoice ${invoice.reference} via ${method}.`);
    return payment;
  },

  /** Applies a verified provider event to the payment — the only path that
   *  can mark a payment successful; never trusts a browser redirect alone. */
  async simulateOutcome(paymentId: string, outcome: MockOutcome): Promise<Payment | undefined> {
    const payment = PaymentService.getById(paymentId);
    if (!payment || !ACTIVE_STATUSES.includes(payment.status)) return payment;

    const result = await simulateProviderOutcome(paymentId, outcome, payment.amount.amountMinor, payment.amount.currency);
    if (!result.verified) throw new Error(result.error ?? "Webhook verification failed.");

    const updated = FinanceStoreEngine.mutate((s) => {
      const original = s.payments.find((x) => x.id === paymentId);
      if (!original) return undefined;
      const p = { ...original };
      const now = new Date().toISOString();
      if (outcome === "success") {
        pushHistory(p, "successful", "provider", "Confirmed by Mock Provider webhook.");
        p.completedAt = now;
      } else if (outcome === "failure") {
        pushHistory(p, "failed", "provider", "Declined by Mock Provider.");
        p.failedAt = now;
        p.failureCategory = "provider_declined";
      } else if (outcome === "expired") {
        pushHistory(p, "expired", "system", "Payment session expired.");
      } else {
        pushHistory(p, "cancelled", "customer", "Payment cancelled before completion.");
        p.cancelledAt = now;
      }
      s.payments = s.payments.map((x) => (x.id === paymentId ? p : x));
      return p;
    });

    if (!updated) return updated;
    FinanceStoreEngine.appendAudit(outcome === "success" ? "payment_successful" : "payment_failed", "system", "payment", paymentId, `Provider status received: ${outcome}.`);
    FinanceStoreEngine.appendAudit("provider_status_received", "system", "payment", paymentId, `Verified webhook event ${result.event?.eventId} applied.`);

    const invoice = InvoiceService.getById(updated.invoiceId);
    if (outcome === "success" && invoice) {
      InvoiceService.applyPayment(invoice.id, updated.fees.serviceAmount);
      FinanceStoreEngine.notifyAccount("customer", updated.payerId, "Payment successful", `Your payment for ${invoice.reference} was confirmed.`, `/payments/${paymentId}`);
      FinanceStoreEngine.notifyAccount("professional", updated.recipientId, "Payment received by provider", `Payment for ${invoice.reference} has been confirmed.`, `/professional/invoices/${invoice.id}`);

      if (invoice.milestoneId && invoice.contractId && invoice.executionProjectId) {
        FundingService.confirmFunding(invoice.contractId, invoice.executionProjectId, invoice.milestoneId, updated);
      } else {
        SettlementService.scheduleFromPayment(updated, invoice);
      }
    } else if (outcome === "failure" && invoice) {
      FinanceStoreEngine.notifyAccount("customer", updated.payerId, "Payment failed", `Your payment for ${invoice.reference} was not successful.`, `/payments/${paymentId}`);
    }

    return updated;
  },

  async retry(paymentId: string): Promise<Payment | undefined> {
    const payment = PaymentService.getById(paymentId);
    if (!payment || !TERMINAL_RETRIABLE.includes(payment.status)) return payment;
    const config = FinanceStoreEngine.getStore().paymentConfiguration;
    const provider = getActiveProvider(config);
    const intent = await provider.createCheckoutSession(paymentId, payment.amount, payment.method);

    return FinanceStoreEngine.mutate((s) => {
      const original = s.payments.find((x) => x.id === paymentId);
      if (!original) return undefined;
      const p = { ...original };
      p.providerReference = intent.providerReference;
      p.expiresAt = intent.expiresAt;
      pushHistory(p, "processing", "customer", "Payment retried.");
      s.payments = s.payments.map((x) => (x.id === paymentId ? p : x));
      return p;
    });
  },

  cancelPending(paymentId: string, actorAccountId: string): Payment | undefined {
    const updated = FinanceStoreEngine.mutate((s) => {
      const original = s.payments.find((x) => x.id === paymentId);
      if (!original || !ACTIVE_STATUSES.includes(original.status)) return original;
      const p = { ...original };
      pushHistory(p, "cancelled", "customer", "Cancelled by payer before completion.");
      p.cancelledAt = new Date().toISOString();
      s.payments = s.payments.map((x) => (x.id === paymentId ? p : x));
      return p;
    });
    if (updated && updated.status === "cancelled") FinanceStoreEngine.appendAudit("payment_failed", actorAccountId, "payment", paymentId, "Payment cancelled by payer.");
    return updated;
  },
};
