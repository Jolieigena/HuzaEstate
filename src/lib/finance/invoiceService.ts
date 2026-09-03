import { FinanceStoreEngine } from "./store";
import { newId, newReference } from "./ids";
import { sumMoney, zeroMoney, subtractMoney, addMoney } from "./money";
import type { Currency, Invoice, InvoiceLineItem, InvoiceType, PartyRole } from "./types";

export interface DraftInvoiceInput {
  issuerId: string;
  issuerRole: PartyRole;
  recipientId: string;
  executionProjectId?: string;
  contractId?: string;
  milestoneId?: string;
  changeOrderId?: string;
  invoiceType: InvoiceType;
  dueDate: string;
  currency: Currency;
  lineItems: Omit<InvoiceLineItem, "id" | "lineTotal">[];
  notes?: string;
}

function computeLineTotal(item: Omit<InvoiceLineItem, "id" | "lineTotal">): InvoiceLineItem {
  const gross = { amountMinor: item.unitPrice.amountMinor * item.quantity, currency: item.unitPrice.currency };
  const lineTotal = item.discount ? subtractMoney(gross, item.discount) : gross;
  return { ...item, id: newId("li"), lineTotal };
}

export const InvoiceService = {
  getAll(): Invoice[] {
    return FinanceStoreEngine.getStore().invoices;
  },

  getById(id: string): Invoice | undefined {
    return FinanceStoreEngine.getStore().invoices.find((i) => i.id === id);
  },

  getForAccount(accountId: string): Invoice[] {
    return FinanceStoreEngine.getStore().invoices.filter((i) => i.issuerId === accountId || i.recipientId === accountId);
  },

  getForExecutionProject(executionProjectId: string): Invoice[] {
    return FinanceStoreEngine.getStore().invoices.filter((i) => i.executionProjectId === executionProjectId);
  },

  nextReference(): string {
    const count = FinanceStoreEngine.getStore().invoices.length;
    return newReference("INV", count + 1);
  },

  createDraft(input: DraftInvoiceInput): Invoice {
    return FinanceStoreEngine.mutate((s) => {
      const lineItems = input.lineItems.map(computeLineTotal);
      const subtotal = sumMoney(lineItems.map((li) => li.lineTotal), input.currency);
      const discountTotal = sumMoney(lineItems.map((li) => li.discount ?? zeroMoney(input.currency)), input.currency);
      const taxTotal = zeroMoney(input.currency);
      const total = addMoney(subtotal, taxTotal);
      const config = s.paymentConfiguration;
      const invoice: Invoice = {
        id: newId("invoice"),
        reference: newReference("INV", s.invoices.length + 1),
        issuerId: input.issuerId,
        issuerRole: input.issuerRole,
        recipientId: input.recipientId,
        executionProjectId: input.executionProjectId,
        contractId: input.contractId,
        milestoneId: input.milestoneId,
        changeOrderId: input.changeOrderId,
        invoiceType: input.invoiceType,
        dueDate: input.dueDate,
        currency: input.currency,
        lineItems,
        subtotal,
        taxTotal,
        discountTotal,
        total,
        amountPaid: zeroMoney(input.currency),
        amountOutstanding: total,
        status: "draft",
        notes: input.notes,
        feeConfigVersion: config.activeFeeConfigVersion,
        creditNoteIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      s.invoices = [...s.invoices, invoice];
      return invoice;
    });
  },

  issue(invoiceId: string, actorAccountId: string): Invoice | undefined {
    const updated = FinanceStoreEngine.mutate((s) => {
      const invoice = s.invoices.find((i) => i.id === invoiceId);
      if (!invoice || invoice.status !== "draft") return invoice;
      invoice.status = "issued";
      invoice.issueDate = new Date().toISOString();
      invoice.updatedAt = new Date().toISOString();
      s.invoices = s.invoices.map((i) => (i.id === invoiceId ? invoice : i));
      return invoice;
    });
    if (updated && updated.status === "issued") {
      FinanceStoreEngine.appendAudit("invoice_issued", actorAccountId, "invoice", invoiceId, `Invoice ${updated.reference} issued for ${updated.total.amountMinor} ${updated.total.currency}.`);
      FinanceStoreEngine.notifyAccount("customer", updated.recipientId, "Invoice issued", `${updated.reference} is ready for review.`, `/invoices/${invoiceId}`);
    }
    return updated;
  },

  markViewed(invoiceId: string): Invoice | undefined {
    return FinanceStoreEngine.mutate((s) => {
      const invoice = s.invoices.find((i) => i.id === invoiceId);
      if (!invoice || invoice.status !== "issued") return invoice;
      invoice.status = "viewed";
      invoice.viewedAt = new Date().toISOString();
      s.invoices = s.invoices.map((i) => (i.id === invoiceId ? invoice : i));
      return invoice;
    });
  },

  cancel(invoiceId: string, actorAccountId: string, reason: string): Invoice | undefined {
    const updated = FinanceStoreEngine.mutate((s) => {
      const invoice = s.invoices.find((i) => i.id === invoiceId);
      if (!invoice) return undefined;
      if (invoice.amountPaid.amountMinor > 0) return invoice; // must credit-note instead of cancel once paid
      if (!["draft", "issued", "viewed"].includes(invoice.status)) return invoice;
      invoice.status = "cancelled";
      invoice.cancelledAt = new Date().toISOString();
      invoice.cancelReason = reason;
      invoice.updatedAt = new Date().toISOString();
      s.invoices = s.invoices.map((i) => (i.id === invoiceId ? invoice : i));
      return invoice;
    });
    if (updated && updated.status === "cancelled") FinanceStoreEngine.appendAudit("invoice_cancelled", actorAccountId, "invoice", invoiceId, `Invoice ${updated.reference} cancelled: ${reason}`, reason);
    return updated;
  },

  createCreditNote(invoiceId: string, amountMinorPortion: number, reason: string, issuedBy: string): Invoice | undefined {
    const updated = FinanceStoreEngine.mutate((s) => {
      const invoice = s.invoices.find((i) => i.id === invoiceId);
      if (!invoice) return undefined;
      const creditId = newId("credit");
      invoice.creditNoteIds = [...invoice.creditNoteIds, creditId];
      invoice.status = "credited";
      invoice.updatedAt = new Date().toISOString();
      s.invoices = s.invoices.map((i) => (i.id === invoiceId ? invoice : i));
      return invoice;
    });
    if (updated) FinanceStoreEngine.appendAudit("credit_note_created", issuedBy, "invoice", invoiceId, `Credit note issued for ${amountMinorPortion} ${updated.currency}: ${reason}`, reason);
    return updated;
  },

  /** Applies a successful payment amount to the invoice balance. Used by PaymentService — never called directly from the UI. */
  applyPayment(invoiceId: string, paidAmount: { amountMinor: number; currency: Currency }): Invoice | undefined {
    return FinanceStoreEngine.mutate((s) => {
      const invoice = s.invoices.find((i) => i.id === invoiceId);
      if (!invoice) return undefined;
      invoice.amountPaid = addMoney(invoice.amountPaid, paidAmount);
      invoice.amountOutstanding = subtractMoney(invoice.total, invoice.amountPaid);
      invoice.status = invoice.amountOutstanding.amountMinor <= 0 ? "paid" : "partially_paid";
      invoice.updatedAt = new Date().toISOString();
      s.invoices = s.invoices.map((i) => (i.id === invoiceId ? invoice : i));
      return invoice;
    });
  },

  /** Reduces the invoice's paid balance to reflect a completed refund (Phase 21). */
  applyRefund(invoiceId: string, refundAmount: { amountMinor: number; currency: Currency }): Invoice | undefined {
    return FinanceStoreEngine.mutate((s) => {
      const invoice = s.invoices.find((i) => i.id === invoiceId);
      if (!invoice) return undefined;
      invoice.amountPaid = subtractMoney(invoice.amountPaid, refundAmount);
      invoice.amountOutstanding = subtractMoney(invoice.total, invoice.amountPaid);
      invoice.status = invoice.amountPaid.amountMinor <= 0 ? "credited" : invoice.amountOutstanding.amountMinor > 0 ? "partially_paid" : "paid";
      invoice.updatedAt = new Date().toISOString();
      s.invoices = s.invoices.map((i) => (i.id === invoiceId ? invoice : i));
      return invoice;
    });
  },

  markDisputed(invoiceId: string): Invoice | undefined {
    return FinanceStoreEngine.mutate((s) => {
      const invoice = s.invoices.find((i) => i.id === invoiceId);
      if (!invoice) return undefined;
      invoice.status = "disputed";
      invoice.updatedAt = new Date().toISOString();
      s.invoices = s.invoices.map((i) => (i.id === invoiceId ? invoice : i));
      return invoice;
    });
  },
};
