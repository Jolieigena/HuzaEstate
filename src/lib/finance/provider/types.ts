// Provider abstraction (Phase 2). A single PaymentProvider interface covers
// every responsibility a real provider adapter would need; the named
// service interfaces the spec calls out (PaymentIntentService,
// ReleaseService, RefundService, SettlementService, ReconciliationService)
// are Picks of it so callers can depend on just the slice they need.
// ContractService/InvoiceService/FundingService live as HuzaEstate-side
// domain services (src/lib/finance/*Service.ts) rather than provider
// methods, since contract/invoice/funding records are internal to
// HuzaEstate, not something a payment provider stores.

import type { Currency, Money, PaymentMethod, ProviderMode } from "../types";

export class ProviderUnavailableError extends Error {
  constructor(message = "This provider mode is not configured yet.") {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}

export interface ProviderCheckoutSession {
  sessionId: string;
  providerReference: string;
  redirectUrl?: string;
  expiresAt: string;
}

export interface ProviderIntentResult {
  providerReference: string;
  status: "pending" | "requires_action" | "succeeded" | "failed";
  maskedDetail?: string;
  expiresAt?: string;
}

export interface ProviderBankInstruction {
  providerReference: string;
  beneficiaryName: string;
  beneficiaryAccountMasked: string;
  uniqueReference: string;
  expiresAt: string;
}

export interface ProviderTransactionRecord {
  providerReference: string;
  status: string;
  amountMinor: number;
  currency: Currency;
  capturedAt?: string;
}

export interface ProviderSettlementStatus {
  providerReference: string;
  status: string;
  expectedDate?: string;
  completedDate?: string;
}

export interface ProviderRefundResult {
  providerReference: string;
  status: string;
  amountMinor: number;
}

export interface ProviderReleaseResult {
  providerReference: string;
  status: string;
}

export interface PaymentProvider {
  readonly id: string;
  readonly displayName: string;
  readonly mode: ProviderMode;
  readonly supportedMethods: PaymentMethod[];
  readonly supportedCurrencies: Currency[];

  createCheckoutSession(paymentId: string, amount: Money, method: PaymentMethod): Promise<ProviderCheckoutSession>;
  initiateMobileMoneyRequest(paymentId: string, amount: Money, maskedPhone: string): Promise<ProviderIntentResult>;
  createBankTransferInstruction(paymentId: string, amount: Money): Promise<ProviderBankInstruction>;
  getPaymentStatus(providerReference: string): Promise<ProviderTransactionRecord>;
  requestRefund(providerReference: string, amount: Money): Promise<ProviderRefundResult>;
  requestFundRelease(providerReference: string, amount: Money): Promise<ProviderReleaseResult>;
  getSettlementStatus(providerReference: string): Promise<ProviderSettlementStatus>;
  getTransactionRecord(providerReference: string): Promise<ProviderTransactionRecord>;
}

export type PaymentIntentService = Pick<PaymentProvider, "createCheckoutSession" | "initiateMobileMoneyRequest" | "createBankTransferInstruction" | "getPaymentStatus">;
export type ReleaseService = Pick<PaymentProvider, "requestFundRelease">;
export type RefundService = Pick<PaymentProvider, "requestRefund">;
export type SettlementService = Pick<PaymentProvider, "getSettlementStatus">;
export type ReconciliationService = Pick<PaymentProvider, "getTransactionRecord">;
