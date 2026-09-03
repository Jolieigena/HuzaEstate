// HuzaEstate Payments, Milestone Funding, Invoicing, Contracts & Financial
// Operations module — typed data model.
//
// PROTOTYPE NOTICE: every record produced by this module is demonstration
// data. HuzaEstate does not hold, store or transfer real customer money.
// Only "mock" provider mode is functional; "sandbox" and "live" modes are
// architected but inert until a licensed payment provider, banking
// arrangement and legal/compliance review are actually in place.

export type Currency = "RWF" | "USD";

/** Integer minor-unit amount — never a float. RWF has a minor-unit factor of
 *  1 (matches the existing plain-RWF-integer convention used across the
 *  execution/renovate modules); USD has a factor of 100. */
export interface Money {
  amountMinor: number;
  currency: Currency;
}

export type ProviderMode = "mock" | "sandbox" | "live";

export type PaymentMethod = "mobile_money" | "card" | "bank_transfer" | "provider_wallet";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  mobile_money: "Mobile Money",
  card: "Card (provider-hosted)",
  bank_transfer: "Bank Transfer",
  provider_wallet: "Provider Wallet",
};

// ---------------------------------------------------------------------------
// Status models (Phase 6)
// ---------------------------------------------------------------------------

export type PaymentStatus =
  | "draft"
  | "awaiting_customer"
  | "pending_provider"
  | "authorisation_required"
  | "processing"
  | "successful"
  | "failed"
  | "cancelled"
  | "expired"
  | "partially_refunded"
  | "refunded"
  | "reversed"
  | "disputed";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  draft: "Draft",
  awaiting_customer: "Awaiting Customer",
  pending_provider: "Pending Provider",
  authorisation_required: "Authorisation Required",
  processing: "Processing",
  successful: "Successful",
  failed: "Failed",
  cancelled: "Cancelled",
  expired: "Expired",
  partially_refunded: "Partially Refunded",
  refunded: "Refunded",
  reversed: "Reversed",
  disputed: "Disputed",
};

export type FundingStatus =
  | "not_funded"
  | "funding_pending"
  | "provider_confirmed"
  | "protected_by_provider"
  | "release_requested"
  | "release_under_review"
  | "release_approved"
  | "release_rejected"
  | "released"
  | "refund_requested"
  | "refunded"
  | "disputed"
  | "frozen";

export const FUNDING_STATUS_LABELS: Record<FundingStatus, string> = {
  not_funded: "Not Funded",
  funding_pending: "Funding Pending",
  provider_confirmed: "Provider Confirmed",
  protected_by_provider: "Protected by Provider",
  release_requested: "Release Requested",
  release_under_review: "Release Under Review",
  release_approved: "Release Approved",
  release_rejected: "Release Rejected",
  released: "Released",
  refund_requested: "Refund Requested",
  refunded: "Refunded",
  disputed: "Disputed",
  frozen: "Frozen",
};

export type SettlementStatus = "not_scheduled" | "scheduled" | "processing" | "completed" | "failed" | "returned" | "on_hold";

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  not_scheduled: "Not Scheduled",
  scheduled: "Scheduled",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
  returned: "Returned",
  on_hold: "On Hold",
};

export type InvoiceStatus = "draft" | "issued" | "viewed" | "partially_paid" | "paid" | "overdue" | "cancelled" | "credited" | "disputed";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  issued: "Issued",
  viewed: "Viewed",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
  credited: "Credited",
  disputed: "Disputed",
};

export type ReconciliationStatus =
  | "matched"
  | "pending"
  | "amount_mismatch"
  | "currency_mismatch"
  | "missing_provider_record"
  | "missing_internal_record"
  | "duplicate"
  | "requires_investigation"
  | "resolved";

export const RECONCILIATION_STATUS_LABELS: Record<ReconciliationStatus, string> = {
  matched: "Matched",
  pending: "Pending",
  amount_mismatch: "Amount Mismatch",
  currency_mismatch: "Currency Mismatch",
  missing_provider_record: "Missing Provider Record",
  missing_internal_record: "Missing Internal Record",
  duplicate: "Duplicate",
  requires_investigation: "Requires Investigation",
  resolved: "Resolved",
};

export type RefundStatus = "requested" | "under_review" | "approved" | "rejected" | "submitted_to_provider" | "processing" | "completed" | "failed" | "cancelled";

export const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  requested: "Requested",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  submitted_to_provider: "Submitted to Provider",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

export type RefundReason = "duplicate_payment" | "cancelled_service" | "overpayment" | "failed_project_start" | "agreed_adjustment" | "dispute_resolution" | "other";

export const REFUND_REASON_LABELS: Record<RefundReason, string> = {
  duplicate_payment: "Duplicate payment",
  cancelled_service: "Cancelled service",
  overpayment: "Overpayment",
  failed_project_start: "Failed project start",
  agreed_adjustment: "Agreed adjustment",
  dispute_resolution: "Dispute resolution",
  other: "Other",
};

export type DisputeStatus = "open" | "evidence_pending" | "under_review" | "resolved_favour_customer" | "resolved_favour_recipient" | "resolved_partial" | "withdrawn" | "escalated_to_admin";

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  open: "Open",
  evidence_pending: "Evidence Pending",
  under_review: "Under Review",
  resolved_favour_customer: "Resolved — Favour Customer",
  resolved_favour_recipient: "Resolved — Favour Recipient",
  resolved_partial: "Resolved — Partial",
  withdrawn: "Withdrawn",
  escalated_to_admin: "Escalated to Admin",
};

export type DisputeCategory =
  | "service_not_delivered"
  | "milestone_incomplete"
  | "work_differs_from_scope"
  | "duplicate_charge"
  | "incorrect_amount"
  | "unauthorised_payment"
  | "refund_not_received"
  | "professional_service_concern"
  | "other";

export const DISPUTE_CATEGORY_LABELS: Record<DisputeCategory, string> = {
  service_not_delivered: "Service not delivered",
  milestone_incomplete: "Milestone incomplete",
  work_differs_from_scope: "Work differs from approved scope",
  duplicate_charge: "Duplicate charge",
  incorrect_amount: "Incorrect amount",
  unauthorised_payment: "Unauthorised payment",
  refund_not_received: "Refund not received",
  professional_service_concern: "Professional-service concern",
  other: "Other",
};

export type ContractStatus = "draft" | "under_contractor_review" | "under_customer_review" | "correction_requested" | "active" | "amended" | "completed" | "terminated" | "cancelled";

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Draft",
  under_contractor_review: "Under Contractor Review",
  under_customer_review: "Under Customer Review",
  correction_requested: "Correction Requested",
  active: "Active",
  amended: "Amended",
  completed: "Completed",
  terminated: "Terminated",
  cancelled: "Cancelled",
};

export type InvoiceType = "professional_review_fee" | "design_service" | "deposit" | "milestone" | "change_order" | "material_procurement" | "final_payment" | "refund_adjustment" | "other";

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  professional_review_fee: "Professional Review Fee",
  design_service: "Design Service",
  deposit: "Deposit",
  milestone: "Milestone",
  change_order: "Change Order",
  material_procurement: "Material Procurement",
  final_payment: "Final Payment",
  refund_adjustment: "Refund Adjustment",
  other: "Other",
};

export type PartyRole = "customer" | "contractor" | "professional" | "administrator";

// ---------------------------------------------------------------------------
// Fee configuration (Phase 19) — versioned, never mutated in place
// ---------------------------------------------------------------------------

export interface FeeConfiguration {
  id: string;
  version: number;
  effectiveFrom: string;
  platformFeeType: "fixed" | "percentage";
  platformFeeValue: number; // fixed: minor units; percentage: basis points (100 = 1%)
  minFeeMinor?: number;
  maxFeeMinor?: number;
  feePayer: "customer" | "recipient";
  providerFeeNote: string;
  promotionalWaiver: boolean;
  createdBy: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Contracts (Phase 5 / 7 / 8)
// ---------------------------------------------------------------------------

export interface ContractAcknowledgement {
  id: string;
  accountId: string;
  role: PartyRole;
  at: string;
  contractVersion: number;
  termsVersion: string;
  confirmationStatement: string;
}

export interface ContractMilestoneRef {
  milestoneId: string;
  title: string;
  amount: Money;
}

export interface ContractAmendment {
  id: string;
  contractId: string;
  changeOrderId?: string;
  changeRequestId?: string;
  previousContractValue: Money;
  changeOrderValue: Money;
  revisedContractValue: Money;
  previousCompletionDate: string;
  revisedCompletionDate: string;
  scheduleImpactDays: number;
  changedScope: string;
  reason: string;
  approvals: ContractAcknowledgement[];
  effectiveDate: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  version: number;
  executionProjectId: string;
  sourceQuotationId?: string;
  customerId: string;
  contractorId?: string;
  professionalId?: string;
  projectName: string;
  scopeSummary: string;
  inclusions: string[];
  exclusions: string[];
  agreedAmount: Money;
  milestones: ContractMilestoneRef[];
  changeOrderRules: string;
  paymentScheduleSummary: string;
  timelineSummary: string;
  inspectionResponsibilities: string;
  customerResponsibilities: string;
  contractorResponsibilities: string;
  professionalResponsibilities?: string;
  warrantySummary: string;
  disputeProcess: string;
  cancellationTerms: string;
  attachedDocumentIds: string[];
  termsVersion: string;
  status: ContractStatus;
  acknowledgements: ContractAcknowledgement[];
  correctionRequests: { id: string; byAccountId: string; role: PartyRole; note: string; at: string; resolvedAt?: string }[];
  amendments: ContractAmendment[];
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
}

// ---------------------------------------------------------------------------
// Invoices (Phase 5 / 9)
// ---------------------------------------------------------------------------

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: Money;
  taxCategory?: string;
  discount?: Money;
  lineTotal: Money;
  relatedScopeItem?: string;
  relatedMilestoneId?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  reference: string; // e.g. INV-0001
  issuerId: string;
  issuerRole: PartyRole;
  recipientId: string;
  executionProjectId?: string;
  contractId?: string;
  milestoneId?: string;
  changeOrderId?: string;
  invoiceType: InvoiceType;
  issueDate?: string;
  dueDate: string;
  currency: Currency;
  lineItems: InvoiceLineItem[];
  subtotal: Money;
  taxTotal: Money;
  discountTotal: Money;
  total: Money;
  amountPaid: Money;
  amountOutstanding: Money;
  status: InvoiceStatus;
  notes?: string;
  providerReference?: string;
  feeConfigVersion: number;
  viewedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  creditNoteIds: string[];
  replacesInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditNote {
  id: string;
  invoiceId: string;
  amount: Money;
  reason: string;
  issuedBy: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Payments (Phase 5 / 11-14)
// ---------------------------------------------------------------------------

export interface PaymentStatusHistoryEntry {
  status: PaymentStatus;
  at: string;
  note?: string;
  source: "customer" | "provider" | "admin" | "system";
}

export interface PaymentFeeBreakdown {
  serviceAmount: Money;
  platformFee: Money;
  providerFee: Money;
  taxes: Money;
  totalCharge: Money;
  expectedRecipientAmount: Money;
  feeConfigVersion: number;
}

export interface Payment {
  id: string;
  idempotencyKey: string;
  invoiceId: string;
  executionProjectId?: string;
  payerId: string;
  recipientId: string;
  provider: string;
  providerMode: ProviderMode;
  method: PaymentMethod;
  fees: PaymentFeeBreakdown;
  amount: Money; // total charged to payer (== fees.totalCharge)
  status: PaymentStatus;
  providerReference?: string;
  maskedPayerDetail?: string; // e.g. masked phone or card last-4
  createdAt: string;
  authorisedAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureCategory?: string;
  cancelledAt?: string;
  expiresAt?: string;
  refundedAmount: Money;
  reconciliationStatus: ReconciliationStatus;
  statusHistory: PaymentStatusHistoryEntry[];
}

// ---------------------------------------------------------------------------
// Milestone funding & release (Phase 15 / 16)
// ---------------------------------------------------------------------------

export interface ReleaseDecision {
  id: string;
  decidedBy: string;
  role: PartyRole;
  decision: "approved" | "rejected" | "clarification_requested";
  reason?: string;
  at: string;
}

export interface FundingAllocation {
  id: string;
  contractId: string;
  executionProjectId: string;
  milestoneId: string;
  customerId: string;
  recipientId: string;
  amount: Money;
  provider: string;
  providerMode: ProviderMode;
  status: FundingStatus;
  paymentId?: string;
  fundingDate?: string;
  eligibilityConditions: string[];
  releaseRequestedAt?: string;
  releaseRequestedBy?: string;
  releaseEvidenceSummary?: string;
  releaseDecisions: ReleaseDecision[];
  releaseDecisionDeadline?: string;
  disputeId?: string;
  settlementId?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Settlements (Phase 5 / 18)
// ---------------------------------------------------------------------------

export interface Settlement {
  id: string;
  recipientId: string;
  paymentId?: string;
  fundingAllocationId?: string;
  grossAmount: Money;
  platformFee: Money;
  providerFee: Money;
  taxWithholding: Money;
  netAmount: Money;
  status: SettlementStatus;
  expectedDate: string;
  completedDate?: string;
  providerReference?: string;
  reconciliationStatus: ReconciliationStatus;
  relatedExecutionProjectId?: string;
  relatedInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Refunds & disputes (Phase 21 / 22)
// ---------------------------------------------------------------------------

export interface RefundRequest {
  id: string;
  paymentId: string;
  requestedBy: string;
  reason: RefundReason;
  reasonNote?: string;
  evidenceDocumentIds: string[];
  maxRefundable: Money;
  previouslyRefunded: Money;
  requestedAmount: Money;
  status: RefundStatus;
  recipientResponseNote?: string;
  reviewedBy?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface PaymentDispute {
  id: string;
  paymentId?: string;
  fundingAllocationId?: string;
  invoiceId?: string;
  openedBy: string;
  category: DisputeCategory;
  description: string;
  evidenceDocumentIds: string[];
  status: DisputeStatus;
  freezesRelease: boolean;
  adminCaseId?: string; // links into src/lib/admin Dispute records
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

// ---------------------------------------------------------------------------
// Reconciliation (Phase 25)
// ---------------------------------------------------------------------------

export interface ReconciliationRecord {
  id: string;
  paymentId?: string;
  settlementId?: string;
  invoiceId?: string;
  fundingAllocationId?: string;
  internalAmount?: Money;
  providerAmount?: Money;
  status: ReconciliationStatus;
  note?: string;
  assignedToAdminId?: string;
  resolvedBy?: string;
  resolutionReason?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

// ---------------------------------------------------------------------------
// Webhook events (Phase 24)
// ---------------------------------------------------------------------------

export interface WebhookEventRecord {
  id: string;
  provider: string;
  eventType: string;
  relatedPaymentId?: string;
  receivedAt: string;
  processedAt?: string;
  safeMetadata: Record<string, string | number | boolean>;
}

// ---------------------------------------------------------------------------
// Configuration (Phase 27)
// ---------------------------------------------------------------------------

export interface LiveModeChecklist {
  providerAccountApproved: boolean;
  requiredContractsCompleted: boolean;
  complianceReviewCompleted: boolean;
  securityReviewCompleted: boolean;
  webhookVerified: boolean;
  refundProcessTested: boolean;
  reconciliationTested: boolean;
  supportProcessReady: boolean;
  legalWordingApproved: boolean;
}

export interface PaymentConfiguration {
  paymentsEnabled: boolean;
  currentProvider: string;
  providerMode: ProviderMode;
  supportedMethods: PaymentMethod[];
  supportedCurrencies: Currency[];
  minimumAmountMinor: number;
  maximumAmountMinor: number;
  paymentExpiryMinutes: number;
  refundRulesSummary: string;
  activeFeeConfigVersion: number;
  fundingFeatureEnabled: boolean;
  releaseWorkflowEnabled: boolean;
  settlementScheduleDays: number;
  webhookHealth: "healthy" | "unknown" | "failing";
  webhookLastTestedAt?: string;
  maintenanceMessage?: string;
  liveModeChecklist: LiveModeChecklist;
  updatedAt: string;
  updatedBy: string;
}

// ---------------------------------------------------------------------------
// Audit & notifications (Phase 28 / 29)
// ---------------------------------------------------------------------------

export type FinanceAuditAction =
  | "contract_created" | "contract_acknowledged" | "contract_amended"
  | "invoice_drafted" | "invoice_issued" | "invoice_cancelled" | "credit_note_created"
  | "payment_initiated" | "provider_status_received" | "payment_successful" | "payment_failed"
  | "funding_confirmed" | "release_requested" | "release_approved" | "release_rejected"
  | "settlement_completed" | "refund_requested" | "refund_approved" | "refund_completed"
  | "dispute_opened" | "dispute_resolved" | "transaction_frozen"
  | "reconciliation_resolved" | "configuration_changed" | "live_mode_toggled";

export interface FinanceAuditEvent {
  id: string;
  action: FinanceAuditAction;
  actorAccountId: string;
  resourceType: "contract" | "invoice" | "payment" | "funding" | "settlement" | "refund" | "dispute" | "reconciliation" | "configuration";
  resourceId: string;
  summary: string;
  reason?: string;
  at: string;
}

export type FinanceNotificationAudience = "customer" | "professional" | "admin";

export interface FinanceNotification {
  id: string;
  audience: FinanceNotificationAudience;
  accountId: string;
  title: string;
  body: string;
  linkHref: string;
  read: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Root store shape
// ---------------------------------------------------------------------------

export interface FinanceStore {
  contracts: Contract[];
  invoices: Invoice[];
  payments: Payment[];
  fundingAllocations: FundingAllocation[];
  settlements: Settlement[];
  refundRequests: RefundRequest[];
  disputes: PaymentDispute[];
  reconciliationRecords: ReconciliationRecord[];
  feeConfigVersions: FeeConfiguration[];
  paymentConfiguration: PaymentConfiguration;
  webhookEventLog: WebhookEventRecord[];
  auditEvents: FinanceAuditEvent[];
  notifications: FinanceNotification[];
}
