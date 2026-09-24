import type { FinanceStore, FeeConfiguration, PaymentConfiguration } from "./types";

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
  createdBy: "system",
  createdAt: "2026-05-01T00:00:00.000Z",
};

const PAYMENT_CONFIG: PaymentConfiguration = {
  paymentsEnabled: true,
  currentProvider: "Mock provider",
  providerMode: "mock",
  supportedMethods: ["mobile_money", "card", "bank_transfer"],
  supportedCurrencies: ["RWF", "USD"],
  minimumAmountMinor: 100_00,
  maximumAmountMinor: 500_000_000,
  paymentExpiryMinutes: 30,
  refundRulesSummary: "Refunds are reviewed case by case by an administrator.",
  activeFeeConfigVersion: 1,
  fundingFeatureEnabled: true,
  releaseWorkflowEnabled: true,
  settlementScheduleDays: 7,
  webhookHealth: "unknown",
  liveModeChecklist: {
    providerAccountApproved: false,
    requiredContractsCompleted: false,
    complianceReviewCompleted: false,
    securityReviewCompleted: false,
    webhookVerified: false,
    refundProcessTested: false,
    reconciliationTested: false,
    supportProcessReady: false,
    legalWordingApproved: false,
  },
  updatedAt: "2026-05-01T00:00:00.000Z",
  updatedBy: "system",
};

/** Real financial records live in payment-service (see lib/postingPlans/api.ts) —
 *  this local store only ever backed the separate finance-module prototype
 *  (contracts/invoices/settlements/refunds/disputes), which has no backend of
 *  its own yet. Starts empty rather than carrying fabricated records. */
export function financeSeed(): FinanceStore {
  return {
    contracts: [],
    invoices: [],
    payments: [],
    fundingAllocations: [],
    settlements: [],
    refundRequests: [],
    disputes: [],
    reconciliationRecords: [],
    feeConfigVersions: [FEE_CONFIG_V1],
    paymentConfiguration: PAYMENT_CONFIG,
    webhookEventLog: [],
    auditEvents: [],
    notifications: [],
  };
}
