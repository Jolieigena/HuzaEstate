// Customer/professional-side authorization checks for the finance module.
// Admin-side permissions live in src/lib/admin/permissions.ts (the
// finance.* Permission entries added there). These checks are ownership-
// based (does this account id appear on this record) plus a few explicit
// "X cannot approve their own Y" rules the spec calls out — mirroring the
// style of src/lib/execution/permissions.ts's canPerformExecutionAction.

import type { Contract, FundingAllocation, Invoice, Payment } from "./types";

export function canViewInvoice(accountId: string, invoice: Invoice): boolean {
  return invoice.issuerId === accountId || invoice.recipientId === accountId;
}

export function canPayInvoice(accountId: string, invoice: Invoice): boolean {
  if (invoice.recipientId !== accountId) return false;
  if (["cancelled", "paid", "disputed"].includes(invoice.status)) return false;
  return invoice.amountOutstanding.amountMinor > 0;
}

export function canIssueInvoice(accountId: string, roles: string[]): boolean {
  return roles.includes("professional") || roles.includes("contractor");
}

export function canCancelInvoice(accountId: string, invoice: Invoice): boolean {
  return invoice.issuerId === accountId && invoice.amountPaid.amountMinor === 0 && ["draft", "issued", "viewed"].includes(invoice.status);
}

export function canViewPayment(accountId: string, payment: Payment): boolean {
  return payment.payerId === accountId || payment.recipientId === accountId;
}

export function canRequestRefund(accountId: string, payment: Payment): boolean {
  return payment.payerId === accountId && ["successful", "partially_refunded"].includes(payment.status);
}

export function canOpenPaymentDispute(accountId: string, payment: Payment): boolean {
  return (payment.payerId === accountId || payment.recipientId === accountId) && payment.status === "successful";
}

export function canViewContract(accountId: string, contract: Contract): boolean {
  return contract.customerId === accountId || contract.contractorId === accountId || contract.professionalId === accountId;
}

export function canAcknowledgeContract(accountId: string, contract: Contract): boolean {
  if (!canViewContract(accountId, contract)) return false;
  if (!["draft", "under_contractor_review", "under_customer_review", "correction_requested"].includes(contract.status)) return false;
  return !contract.acknowledgements.some((a) => a.accountId === accountId && a.contractVersion === contract.version);
}

/** Contractor/professional can request a release only for their own funded milestone, and only once it's actually funded. */
export function canRequestRelease(accountId: string, funding: FundingAllocation): boolean {
  return funding.recipientId === accountId && ["provider_confirmed", "protected_by_provider", "release_rejected"].includes(funding.status);
}

/** Only the customer decides — the contractor cannot approve their own release, and an administrator cannot decide on the customer's behalf outside a legally reviewed dispute process. */
export function canDecideRelease(accountId: string, funding: FundingAllocation): boolean {
  return funding.customerId === accountId && funding.status === "release_requested";
}

export function canOpenFundingDispute(accountId: string, funding: FundingAllocation): boolean {
  return (funding.customerId === accountId || funding.recipientId === accountId) && !["disputed", "frozen"].includes(funding.status);
}
