// Phase 31 prototype financial data. Seeded once (guarded by
// FinanceStorageService.hasSeeded()) so it never overwrites a returning
// visitor's local changes. Every record is clearly demonstration data —
// see PROTOTYPE_TRANSACTION_LABEL usage throughout the UI.
//
// IDs are reused from the existing execution/quotation seed data
// (src/lib/execution/seed.ts) rather than invented, per the module's
// "reuse shared record IDs" requirement:
//  - exec-build-kigali (Kigali Family Home), milestone m-1 / m-2
//  - exec-renovate-gacuriro (Gacuriro Family Home Refresh), milestone mr-1 / mr-2
//  - accounts: demo-user (customer), imara-user (contractor), aline-user
//    (architect, pro-1), diane-user (quantity surveyor, pro-3), admin-ops

import { money, zeroMoney, applyBasisPoints, subtractMoney } from "./money";
import { computeFeeBreakdown } from "./feeCalculator";
import { newId } from "./ids";
import type {
  FinanceStore,
  Contract,
  Invoice,
  Payment,
  FundingAllocation,
  Settlement,
  RefundRequest,
  ReconciliationRecord,
  FeeConfiguration,
  PaymentConfiguration,
  FinanceAuditEvent,
  FinanceNotification,
  PaymentStatusHistoryEntry,
} from "./types";

const FEE_CONFIG_V1: FeeConfiguration = {
  id: "feeconfig-v1",
  version: 1,
  effectiveFrom: "2026-05-01T00:00:00.000Z",
  platformFeeType: "percentage",
  platformFeeValue: 250, // 2.5%
  minFeeMinor: 2000,
  feePayer: "customer",
  providerFeeNote: "Provider fee is an estimate until a licensed provider is configured (Mock mode).",
  promotionalWaiver: false,
  createdBy: "admin-super",
  createdAt: "2026-05-01T00:00:00.000Z",
};

function feeBreakdown(serviceAmount: ReturnType<typeof money>) {
  return computeFeeBreakdown(serviceAmount, FEE_CONFIG_V1);
}

function history(entries: { status: PaymentStatusHistoryEntry["status"]; at: string; note?: string; source?: PaymentStatusHistoryEntry["source"] }[]): PaymentStatusHistoryEntry[] {
  return entries.map((e) => ({ status: e.status, at: e.at, note: e.note, source: e.source ?? "system" }));
}

export function financeSeed(): FinanceStore {
  const rwf = (v: number) => money(v, "RWF");

  // -------------------------------------------------------------------
  // Contracts
  // -------------------------------------------------------------------
  const contractKigali: Contract = {
    id: "contract-kigali",
    version: 1,
    executionProjectId: "exec-build-kigali",
    sourceQuotationId: "quote-imara-1",
    customerId: "demo-user",
    contractorId: "imara-user",
    projectName: "Kigali Family Home",
    scopeSummary: "New-build single family home construction per the accepted contractor quotation and approved design version.",
    inclusions: ["Foundation and structural works", "Roofing", "Plumbing and electrical rough-in", "Finishes as per approved scope"],
    exclusions: ["Furniture and movable fittings", "Landscaping beyond boundary wall"],
    agreedAmount: rwf(145_000_000),
    milestones: [
      { milestoneId: "m-1", title: "Milestone 1: Substructure & Slab Completion", amount: rwf(29_000_000) },
      { milestoneId: "m-2", title: "Milestone 2: Ground Floor Frame & First Floor Concrete Slab", amount: rwf(43_500_000) },
    ],
    changeOrderRules: "Change orders require quantity surveyor costing, professional review, and customer approval before the contract value is amended.",
    paymentScheduleSummary: "Milestone-based: each milestone is invoiced on submission and funded before contractor release request.",
    timelineSummary: "Start 2026-06-01, target completion 2026-12-15.",
    inspectionResponsibilities: "Structural and MEP milestones require sign-off by the assigned engineer prior to payment eligibility.",
    customerResponsibilities: "Timely review of milestone submissions and change requests.",
    contractorResponsibilities: "Site safety, material quality, and schedule adherence per approved work packages.",
    professionalResponsibilities: "Independent inspection and milestone verification.",
    warrantySummary: "12-month structural warranty from handover date; see attached warranty records.",
    disputeProcess: "Either party may open a payment dispute, which freezes any pending release until resolved.",
    cancellationTerms: "Cancellation prior to milestone funding requires no penalty; funded milestones follow the refund process.",
    attachedDocumentIds: [],
    termsVersion: "finance-terms-v1",
    status: "active",
    acknowledgements: [
      { id: newId("ack"), accountId: "imara-user", role: "contractor", at: "2026-06-03T10:00:00.000Z", contractVersion: 1, termsVersion: "finance-terms-v1", confirmationStatement: "I confirm this contract summary reflects the accepted quotation and I agree to the terms." },
      { id: newId("ack"), accountId: "demo-user", role: "customer", at: "2026-06-04T15:30:00.000Z", contractVersion: 1, termsVersion: "finance-terms-v1", confirmationStatement: "I confirm this contract summary reflects the accepted quotation and I agree to the terms." },
    ],
    correctionRequests: [],
    amendments: [],
    createdAt: "2026-06-02T09:00:00.000Z",
    updatedAt: "2026-06-04T15:30:00.000Z",
    activatedAt: "2026-06-04T15:30:00.000Z",
  };

  const contractGacuriro: Contract = {
    id: "contract-gacuriro",
    version: 1,
    executionProjectId: "exec-renovate-gacuriro",
    sourceQuotationId: "quote-imara-renovate",
    customerId: "demo-user",
    contractorId: "imara-user",
    projectName: "Gacuriro Family Home Refresh",
    scopeSummary: "Kitchen and bathroom renovation including demolition, rough-in utilities, tiling and electrical final fix.",
    inclusions: ["Demolition and disposal", "Plumbing and electrical rough-in", "Tiling and finishes"],
    exclusions: ["Structural alterations", "Appliance purchase"],
    agreedAmount: rwf(28_200_000),
    milestones: [
      { milestoneId: "mr-1", title: "Milestone 1: Demolition & Rough-in Utilities", amount: rwf(8_500_000) },
      { milestoneId: "mr-2", title: "Milestone 2: Tiling, Ceiling & Electrical Final Fix", amount: rwf(11_000_000) },
    ],
    changeOrderRules: "Change orders require quantity surveyor costing, professional review, and customer approval before the contract value is amended.",
    paymentScheduleSummary: "Milestone-based: each milestone is invoiced on submission and funded before contractor release request.",
    timelineSummary: "Start 2026-07-15, target completion 2026-09-30.",
    inspectionResponsibilities: "Plumbing and electrical milestones require inspection sign-off prior to payment eligibility.",
    customerResponsibilities: "Timely review of milestone submissions and change requests.",
    contractorResponsibilities: "Site safety, material quality, and schedule adherence per approved work packages.",
    warrantySummary: "6-month workmanship warranty from handover date.",
    disputeProcess: "Either party may open a payment dispute, which freezes any pending release until resolved.",
    cancellationTerms: "Cancellation prior to milestone funding requires no penalty; funded milestones follow the refund process.",
    attachedDocumentIds: [],
    termsVersion: "finance-terms-v1",
    status: "active",
    acknowledgements: [
      { id: newId("ack"), accountId: "imara-user", role: "contractor", at: "2026-07-16T10:00:00.000Z", contractVersion: 1, termsVersion: "finance-terms-v1", confirmationStatement: "I confirm this contract summary reflects the accepted quotation and I agree to the terms." },
      { id: newId("ack"), accountId: "demo-user", role: "customer", at: "2026-07-17T12:00:00.000Z", contractVersion: 1, termsVersion: "finance-terms-v1", confirmationStatement: "I confirm this contract summary reflects the accepted quotation and I agree to the terms." },
    ],
    correctionRequests: [],
    amendments: [],
    createdAt: "2026-07-15T09:00:00.000Z",
    updatedAt: "2026-07-17T12:00:00.000Z",
    activatedAt: "2026-07-17T12:00:00.000Z",
  };

  // -------------------------------------------------------------------
  // Scenario 1: Funded Build milestone (Kigali, m-1) — invoice + payment
  // behind the funding, Provider Confirmed, release not yet requested.
  // -------------------------------------------------------------------
  const kigaliM1Fees = feeBreakdown(rwf(29_000_000));
  const invoiceKigaliM1: Invoice = {
    id: "invoice-kigali-m1",
    reference: "INV-0001",
    issuerId: "imara-user",
    issuerRole: "contractor",
    recipientId: "demo-user",
    executionProjectId: "exec-build-kigali",
    contractId: "contract-kigali",
    milestoneId: "m-1",
    invoiceType: "milestone",
    issueDate: "2026-07-05T08:00:00.000Z",
    dueDate: "2026-07-12T08:00:00.000Z",
    currency: "RWF",
    lineItems: [{ id: newId("li"), description: "Milestone 1: Substructure & Slab Completion", quantity: 1, unit: "milestone", unitPrice: rwf(29_000_000), lineTotal: rwf(29_000_000), relatedMilestoneId: "m-1" }],
    subtotal: rwf(29_000_000),
    taxTotal: zeroMoney("RWF"),
    discountTotal: zeroMoney("RWF"),
    total: rwf(29_000_000),
    amountPaid: rwf(29_000_000),
    amountOutstanding: zeroMoney("RWF"),
    status: "paid",
    providerReference: "mock_ref_kigali_m1",
    feeConfigVersion: 1,
    viewedAt: "2026-07-05T09:00:00.000Z",
    creditNoteIds: [],
    createdAt: "2026-07-05T08:00:00.000Z",
    updatedAt: "2026-07-10T11:00:00.000Z",
  };
  const paymentKigaliM1: Payment = {
    id: "payment-kigali-m1",
    idempotencyKey: "seed-payment-kigali-m1",
    invoiceId: "invoice-kigali-m1",
    executionProjectId: "exec-build-kigali",
    payerId: "demo-user",
    recipientId: "imara-user",
    provider: "huza_mock_provider",
    providerMode: "mock",
    method: "mobile_money",
    fees: kigaliM1Fees,
    amount: kigaliM1Fees.totalCharge,
    status: "successful",
    providerReference: "mock_ref_kigali_m1",
    maskedPayerDetail: "•••• •• 812",
    createdAt: "2026-07-08T08:00:00.000Z",
    authorisedAt: "2026-07-08T08:02:00.000Z",
    completedAt: "2026-07-10T11:00:00.000Z",
    refundedAmount: zeroMoney("RWF"),
    reconciliationStatus: "matched",
    statusHistory: history([
      { status: "draft", at: "2026-07-08T08:00:00.000Z" },
      { status: "pending_provider", at: "2026-07-08T08:01:00.000Z" },
      { status: "processing", at: "2026-07-08T08:02:00.000Z", source: "provider" },
      { status: "successful", at: "2026-07-10T11:00:00.000Z", note: "Confirmed by Mock Provider webhook.", source: "provider" },
    ]),
  };
  const fundingKigaliM1: FundingAllocation = {
    id: "funding-kigali-m1",
    contractId: "contract-kigali",
    executionProjectId: "exec-build-kigali",
    milestoneId: "m-1",
    customerId: "demo-user",
    recipientId: "imara-user",
    amount: rwf(29_000_000),
    provider: "huza_mock_provider",
    providerMode: "mock",
    status: "provider_confirmed",
    paymentId: "payment-kigali-m1",
    fundingDate: "2026-07-10T11:00:00.000Z",
    eligibilityConditions: ["Milestone accepted by customer", "Structural inspection passed"],
    releaseDecisions: [],
    createdAt: "2026-07-10T11:00:00.000Z",
    updatedAt: "2026-07-10T11:00:00.000Z",
  };

  // -------------------------------------------------------------------
  // Scenario 2: Renovation milestone (Gacuriro, mr-2) — invoice issued,
  // demonstration payment successful, milestone awaiting inspection.
  // -------------------------------------------------------------------
  const gacuriroM2Fees = feeBreakdown(rwf(11_000_000));
  const invoiceGacuriroM2: Invoice = {
    id: "invoice-gacuriro-mr2",
    reference: "INV-0002",
    issuerId: "imara-user",
    issuerRole: "contractor",
    recipientId: "demo-user",
    executionProjectId: "exec-renovate-gacuriro",
    contractId: "contract-gacuriro",
    milestoneId: "mr-2",
    invoiceType: "milestone",
    issueDate: "2026-08-20T08:00:00.000Z",
    dueDate: "2026-08-27T08:00:00.000Z",
    currency: "RWF",
    lineItems: [{ id: newId("li"), description: "Milestone 2: Tiling, Ceiling & Electrical Final Fix", quantity: 1, unit: "milestone", unitPrice: rwf(11_000_000), lineTotal: rwf(11_000_000), relatedMilestoneId: "mr-2" }],
    subtotal: rwf(11_000_000),
    taxTotal: zeroMoney("RWF"),
    discountTotal: zeroMoney("RWF"),
    total: rwf(11_000_000),
    amountPaid: rwf(11_000_000),
    amountOutstanding: zeroMoney("RWF"),
    status: "paid",
    providerReference: "mock_ref_gacuriro_mr2",
    feeConfigVersion: 1,
    viewedAt: "2026-08-20T09:00:00.000Z",
    creditNoteIds: [],
    createdAt: "2026-08-20T08:00:00.000Z",
    updatedAt: "2026-08-22T10:00:00.000Z",
  };
  const paymentGacuriroM2: Payment = {
    id: "payment-gacuriro-mr2",
    idempotencyKey: "seed-payment-gacuriro-mr2",
    invoiceId: "invoice-gacuriro-mr2",
    executionProjectId: "exec-renovate-gacuriro",
    payerId: "demo-user",
    recipientId: "imara-user",
    provider: "huza_mock_provider",
    providerMode: "mock",
    method: "mobile_money",
    fees: gacuriroM2Fees,
    amount: gacuriroM2Fees.totalCharge,
    status: "successful",
    providerReference: "mock_ref_gacuriro_mr2",
    maskedPayerDetail: "•••• •• 812",
    createdAt: "2026-08-21T08:00:00.000Z",
    authorisedAt: "2026-08-21T08:02:00.000Z",
    completedAt: "2026-08-22T10:00:00.000Z",
    refundedAmount: zeroMoney("RWF"),
    reconciliationStatus: "amount_mismatch",
    statusHistory: history([
      { status: "draft", at: "2026-08-21T08:00:00.000Z" },
      { status: "pending_provider", at: "2026-08-21T08:01:00.000Z" },
      { status: "processing", at: "2026-08-21T08:02:00.000Z", source: "provider" },
      { status: "successful", at: "2026-08-22T10:00:00.000Z", note: "Confirmed by Mock Provider webhook.", source: "provider" },
    ]),
  };
  const fundingGacuriroM2: FundingAllocation = {
    id: "funding-gacuriro-mr2",
    contractId: "contract-gacuriro",
    executionProjectId: "exec-renovate-gacuriro",
    milestoneId: "mr-2",
    customerId: "demo-user",
    recipientId: "imara-user",
    amount: rwf(11_000_000),
    provider: "huza_mock_provider",
    providerMode: "mock",
    status: "provider_confirmed",
    paymentId: "payment-gacuriro-mr2",
    fundingDate: "2026-08-22T10:00:00.000Z",
    eligibilityConditions: ["Milestone accepted by customer", "Electrical isolation test passed"],
    releaseDecisions: [],
    createdAt: "2026-08-22T10:00:00.000Z",
    updatedAt: "2026-08-22T10:00:00.000Z",
  };

  // -------------------------------------------------------------------
  // Scenario 3: Professional service (architectural review) — invoice,
  // demonstration payment completed, settlement scheduled.
  // -------------------------------------------------------------------
  const reviewFees = feeBreakdown(rwf(350_000));
  const invoiceReview: Invoice = {
    id: "invoice-review-aline-1",
    reference: "INV-0003",
    issuerId: "aline-user",
    issuerRole: "professional",
    recipientId: "demo-user",
    invoiceType: "professional_review_fee",
    issueDate: "2026-08-25T08:00:00.000Z",
    dueDate: "2026-09-01T08:00:00.000Z",
    currency: "RWF",
    lineItems: [{ id: newId("li"), description: "Architectural review — Kigali Family Home design", quantity: 1, unit: "service", unitPrice: rwf(350_000), lineTotal: rwf(350_000) }],
    subtotal: rwf(350_000),
    taxTotal: zeroMoney("RWF"),
    discountTotal: zeroMoney("RWF"),
    total: rwf(350_000),
    amountPaid: rwf(350_000),
    amountOutstanding: zeroMoney("RWF"),
    status: "paid",
    providerReference: "mock_ref_review_aline_1",
    feeConfigVersion: 1,
    viewedAt: "2026-08-25T09:00:00.000Z",
    creditNoteIds: [],
    createdAt: "2026-08-25T08:00:00.000Z",
    updatedAt: "2026-08-26T09:00:00.000Z",
  };
  const paymentReview: Payment = {
    id: "payment-review-aline-1",
    idempotencyKey: "seed-payment-review-aline-1",
    invoiceId: "invoice-review-aline-1",
    payerId: "demo-user",
    recipientId: "aline-user",
    provider: "huza_mock_provider",
    providerMode: "mock",
    method: "card",
    fees: reviewFees,
    amount: reviewFees.totalCharge,
    status: "successful",
    providerReference: "mock_ref_review_aline_1",
    maskedPayerDetail: "Visa •••• 4242",
    createdAt: "2026-08-25T09:00:00.000Z",
    authorisedAt: "2026-08-25T09:01:00.000Z",
    completedAt: "2026-08-26T09:00:00.000Z",
    refundedAmount: zeroMoney("RWF"),
    reconciliationStatus: "matched",
    statusHistory: history([
      { status: "draft", at: "2026-08-25T09:00:00.000Z" },
      { status: "processing", at: "2026-08-25T09:01:00.000Z", source: "provider" },
      { status: "successful", at: "2026-08-26T09:00:00.000Z", note: "Confirmed by Mock Provider webhook.", source: "provider" },
    ]),
  };
  const grossReview = rwf(350_000);
  const reviewPlatformFee = applyBasisPoints(grossReview, 500); // 5% marketplace commission
  const reviewProviderFee = applyBasisPoints(grossReview, 100); // 1% payout fee
  const settlementReview: Settlement = {
    id: "settlement-review-aline-1",
    recipientId: "aline-user",
    paymentId: "payment-review-aline-1",
    grossAmount: grossReview,
    platformFee: reviewPlatformFee,
    providerFee: reviewProviderFee,
    taxWithholding: zeroMoney("RWF"),
    netAmount: subtractMoney(subtractMoney(grossReview, reviewPlatformFee), reviewProviderFee),
    status: "scheduled",
    expectedDate: "2026-09-10T00:00:00.000Z",
    reconciliationStatus: "matched",
    relatedInvoiceId: "invoice-review-aline-1",
    createdAt: "2026-08-26T09:00:00.000Z",
    updatedAt: "2026-08-26T09:00:00.000Z",
  };

  // -------------------------------------------------------------------
  // Scenario 4: Refund case — quantity surveyor consultation, partially
  // refunded, complete status history.
  // -------------------------------------------------------------------
  const consultFees = feeBreakdown(rwf(150_000));
  const invoiceConsult: Invoice = {
    id: "invoice-consult-diane-1",
    reference: "INV-0004",
    issuerId: "diane-user",
    issuerRole: "professional",
    recipientId: "demo-user",
    invoiceType: "professional_review_fee",
    issueDate: "2026-08-10T08:00:00.000Z",
    dueDate: "2026-08-17T08:00:00.000Z",
    currency: "RWF",
    lineItems: [{ id: newId("li"), description: "Quantity surveying consultation", quantity: 1, unit: "service", unitPrice: rwf(150_000), lineTotal: rwf(150_000) }],
    subtotal: rwf(150_000),
    taxTotal: zeroMoney("RWF"),
    discountTotal: zeroMoney("RWF"),
    total: rwf(150_000),
    amountPaid: rwf(150_000),
    amountOutstanding: zeroMoney("RWF"),
    status: "paid",
    providerReference: "mock_ref_consult_diane_1",
    feeConfigVersion: 1,
    viewedAt: "2026-08-10T09:00:00.000Z",
    creditNoteIds: [],
    createdAt: "2026-08-10T08:00:00.000Z",
    updatedAt: "2026-08-18T10:00:00.000Z",
  };
  const paymentConsult: Payment = {
    id: "payment-consult-diane-1",
    idempotencyKey: "seed-payment-consult-diane-1",
    invoiceId: "invoice-consult-diane-1",
    payerId: "demo-user",
    recipientId: "diane-user",
    provider: "huza_mock_provider",
    providerMode: "mock",
    method: "mobile_money",
    fees: consultFees,
    amount: consultFees.totalCharge,
    status: "partially_refunded",
    providerReference: "mock_ref_consult_diane_1",
    maskedPayerDetail: "•••• •• 812",
    createdAt: "2026-08-10T09:00:00.000Z",
    authorisedAt: "2026-08-10T09:01:00.000Z",
    completedAt: "2026-08-11T09:00:00.000Z",
    refundedAmount: rwf(50_000),
    reconciliationStatus: "matched",
    statusHistory: history([
      { status: "draft", at: "2026-08-10T09:00:00.000Z" },
      { status: "processing", at: "2026-08-10T09:01:00.000Z", source: "provider" },
      { status: "successful", at: "2026-08-11T09:00:00.000Z", source: "provider" },
      { status: "partially_refunded", at: "2026-08-19T14:00:00.000Z", note: "Partial refund approved: scope reduced after site visit.", source: "admin" },
    ]),
  };
  const refundConsult: RefundRequest = {
    id: "refund-consult-diane-1",
    paymentId: "payment-consult-diane-1",
    requestedBy: "demo-user",
    reason: "agreed_adjustment",
    reasonNote: "Site visit portion of the consultation was not required; agreed to a partial refund with the quantity surveyor.",
    evidenceDocumentIds: [],
    maxRefundable: rwf(150_000),
    previouslyRefunded: zeroMoney("RWF"),
    requestedAmount: rwf(50_000),
    status: "completed",
    reviewedBy: "admin-ops",
    reviewNote: "Approved — amount matches the agreed adjustment.",
    createdAt: "2026-08-18T10:00:00.000Z",
    updatedAt: "2026-08-19T14:00:00.000Z",
    completedAt: "2026-08-19T14:00:00.000Z",
  };

  // -------------------------------------------------------------------
  // Scenario 5: Reconciliation issue — demonstration amount mismatch.
  // -------------------------------------------------------------------
  const reconciliationIssue: ReconciliationRecord = {
    id: "recon-gacuriro-mr2",
    paymentId: "payment-gacuriro-mr2",
    invoiceId: "invoice-gacuriro-mr2",
    internalAmount: rwf(11_000_000),
    providerAmount: rwf(10_950_000),
    status: "amount_mismatch",
    note: "Mock provider settlement report shows RWF 50,000 less than the internal invoice total — investigating provider fee deduction discrepancy.",
    assignedToAdminId: "admin-ops",
    createdAt: "2026-08-23T09:00:00.000Z",
    updatedAt: "2026-08-23T09:00:00.000Z",
  };

  // -------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------
  const paymentConfiguration: PaymentConfiguration = {
    paymentsEnabled: true,
    currentProvider: "HuzaEstate Mock Provider",
    providerMode: "mock",
    supportedMethods: ["mobile_money", "card", "bank_transfer"],
    supportedCurrencies: ["RWF", "USD"],
    minimumAmountMinor: 1_000,
    maximumAmountMinor: 500_000_000,
    paymentExpiryMinutes: 30,
    refundRulesSummary: "Refunds are reviewed by finance staff and processed through the configured provider once approved. No refund is marked complete until the provider confirms it.",
    activeFeeConfigVersion: 1,
    fundingFeatureEnabled: true,
    releaseWorkflowEnabled: true,
    settlementScheduleDays: 5,
    webhookHealth: "healthy",
    webhookLastTestedAt: "2026-08-30T09:00:00.000Z",
    liveModeChecklist: {
      providerAccountApproved: false,
      requiredContractsCompleted: false,
      complianceReviewCompleted: false,
      securityReviewCompleted: false,
      webhookVerified: true,
      refundProcessTested: true,
      reconciliationTested: true,
      supportProcessReady: false,
      legalWordingApproved: false,
    },
    updatedAt: "2026-05-01T00:00:00.000Z",
    updatedBy: "admin-super",
  };

  // -------------------------------------------------------------------
  // Audit trail (append-only, populated for the seeded scenarios)
  // -------------------------------------------------------------------
  const auditEvents: FinanceAuditEvent[] = [
    { id: newId("faudit"), action: "contract_created", actorAccountId: "system", resourceType: "contract", resourceId: "contract-kigali", summary: "Contract generated from accepted quotation quote-imara-1.", at: "2026-06-02T09:00:00.000Z" },
    { id: newId("faudit"), action: "contract_acknowledged", actorAccountId: "demo-user", resourceType: "contract", resourceId: "contract-kigali", summary: "Customer acknowledged contract v1; contract became Active.", at: "2026-06-04T15:30:00.000Z" },
    { id: newId("faudit"), action: "invoice_issued", actorAccountId: "imara-user", resourceType: "invoice", resourceId: "invoice-kigali-m1", summary: "Milestone invoice INV-0001 issued for RWF 29,000,000.", at: "2026-07-05T08:00:00.000Z" },
    { id: newId("faudit"), action: "payment_successful", actorAccountId: "system", resourceType: "payment", resourceId: "payment-kigali-m1", summary: "Mock Provider confirmed payment for INV-0001.", at: "2026-07-10T11:00:00.000Z" },
    { id: newId("faudit"), action: "funding_confirmed", actorAccountId: "system", resourceType: "funding", resourceId: "funding-kigali-m1", summary: "Milestone m-1 funding confirmed by provider.", at: "2026-07-10T11:00:00.000Z" },
    { id: newId("faudit"), action: "contract_created", actorAccountId: "system", resourceType: "contract", resourceId: "contract-gacuriro", summary: "Contract generated from accepted quotation quote-imara-renovate.", at: "2026-07-15T09:00:00.000Z" },
    { id: newId("faudit"), action: "invoice_issued", actorAccountId: "imara-user", resourceType: "invoice", resourceId: "invoice-gacuriro-mr2", summary: "Milestone invoice INV-0002 issued for RWF 11,000,000.", at: "2026-08-20T08:00:00.000Z" },
    { id: newId("faudit"), action: "payment_successful", actorAccountId: "system", resourceType: "payment", resourceId: "payment-gacuriro-mr2", summary: "Mock Provider confirmed payment for INV-0002.", at: "2026-08-22T10:00:00.000Z" },
    { id: newId("faudit"), action: "reconciliation_resolved", actorAccountId: "system", resourceType: "reconciliation", resourceId: "recon-gacuriro-mr2", summary: "Amount mismatch detected against provider settlement report; assigned to admin-ops.", at: "2026-08-23T09:00:00.000Z" },
    { id: newId("faudit"), action: "invoice_issued", actorAccountId: "aline-user", resourceType: "invoice", resourceId: "invoice-review-aline-1", summary: "Professional review invoice INV-0003 issued for RWF 350,000.", at: "2026-08-25T08:00:00.000Z" },
    { id: newId("faudit"), action: "payment_successful", actorAccountId: "system", resourceType: "payment", resourceId: "payment-review-aline-1", summary: "Mock Provider confirmed payment for INV-0003.", at: "2026-08-26T09:00:00.000Z" },
    { id: newId("faudit"), action: "refund_requested", actorAccountId: "demo-user", resourceType: "refund", resourceId: "refund-consult-diane-1", summary: "Partial refund requested for INV-0004 (agreed adjustment).", at: "2026-08-18T10:00:00.000Z" },
    { id: newId("faudit"), action: "refund_approved", actorAccountId: "admin-ops", resourceType: "refund", resourceId: "refund-consult-diane-1", summary: "Partial refund of RWF 50,000 approved.", at: "2026-08-19T13:00:00.000Z" },
    { id: newId("faudit"), action: "refund_completed", actorAccountId: "system", resourceType: "refund", resourceId: "refund-consult-diane-1", summary: "Mock Provider confirmed partial refund completion.", at: "2026-08-19T14:00:00.000Z" },
  ];

  const notifications: FinanceNotification[] = [
    { id: newId("fnotif"), audience: "customer", accountId: "demo-user", title: "Milestone funding confirmed", body: "Your payment for Milestone 1 (Kigali Family Home) has been confirmed by the provider.", linkHref: "/execution/exec-build-kigali/payments", read: true, createdAt: "2026-07-10T11:00:00.000Z" },
    { id: newId("fnotif"), audience: "professional", accountId: "imara-user", title: "Payment received by provider", body: "Payment for INV-0002 (Gacuriro Family Home Refresh) has been confirmed.", linkHref: "/professional/invoices/invoice-gacuriro-mr2", read: false, createdAt: "2026-08-22T10:00:00.000Z" },
    { id: newId("fnotif"), audience: "professional", accountId: "aline-user", title: "Settlement processing", body: "Your settlement for INV-0003 is scheduled for 2026-09-10.", linkHref: "/professional/settlements", read: false, createdAt: "2026-08-26T09:00:00.000Z" },
    { id: newId("fnotif"), audience: "admin", accountId: "admin-ops", title: "Reconciliation mismatch", body: "A demonstration amount mismatch was assigned to you for INV-0002.", linkHref: "/admin/finance/reconciliation", read: false, createdAt: "2026-08-23T09:00:00.000Z" },
    { id: newId("fnotif"), audience: "customer", accountId: "demo-user", title: "Refund completed", body: "A partial refund of RWF 50,000 for INV-0004 has been completed.", linkHref: "/payments/payment-consult-diane-1", read: false, createdAt: "2026-08-19T14:00:00.000Z" },
  ];

  return {
    contracts: [contractKigali, contractGacuriro],
    invoices: [invoiceKigaliM1, invoiceGacuriroM2, invoiceReview, invoiceConsult],
    payments: [paymentKigaliM1, paymentGacuriroM2, paymentReview, paymentConsult],
    fundingAllocations: [fundingKigaliM1, fundingGacuriroM2],
    settlements: [settlementReview],
    refundRequests: [refundConsult],
    disputes: [],
    reconciliationRecords: [reconciliationIssue],
    feeConfigVersions: [FEE_CONFIG_V1],
    paymentConfiguration,
    webhookEventLog: [],
    auditEvents,
    notifications,
  };
}
