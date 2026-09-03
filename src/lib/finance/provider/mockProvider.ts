import { newId } from "../ids";
import type { PaymentProvider } from "./types";

const DEFAULT_EXPIRY_MINUTES = 30;

function expiryIso(minutes = DEFAULT_EXPIRY_MINUTES): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

/**
 * Fully functional demonstration provider. Every intent it creates is
 * "pending" until confirmed by a real (mocked) webhook round trip through
 * /api/finance/webhooks/mock — this object never marks anything successful
 * on its own, matching "do not mark a payment successful from the browser
 * redirect alone" (Phase 11). Never collects PIN, OTP, CVV, or full card
 * data — only a masked phone number for the mobile-money display.
 */
export const mockProvider: PaymentProvider = {
  id: "huza_mock_provider",
  displayName: "HuzaEstate Mock Provider",
  mode: "mock",
  supportedMethods: ["mobile_money", "card", "bank_transfer"],
  supportedCurrencies: ["RWF", "USD"],

  async createCheckoutSession(_paymentId, _amount, _method) {
    return { sessionId: newId("sess"), providerReference: newId("mockref"), expiresAt: expiryIso() };
  },

  async initiateMobileMoneyRequest(_paymentId, _amount, maskedPhone) {
    return { providerReference: newId("mockref"), status: "pending", maskedDetail: maskedPhone, expiresAt: expiryIso() };
  },

  async createBankTransferInstruction(_paymentId, _amount) {
    return {
      providerReference: newId("mockref"),
      beneficiaryName: "HuzaEstate Demonstration Escrow (Mock)",
      beneficiaryAccountMasked: "•••• •••• 4471",
      uniqueReference: newId("bankref").toUpperCase(),
      expiresAt: expiryIso(60),
    };
  },

  async getPaymentStatus(providerReference) {
    return { providerReference, status: "pending", amountMinor: 0, currency: "RWF" };
  },

  async requestRefund(providerReference, amount) {
    return { providerReference, status: "processing", amountMinor: amount.amountMinor };
  },

  async requestFundRelease(providerReference, _amount) {
    return { providerReference, status: "processing" };
  },

  async getSettlementStatus(providerReference) {
    return { providerReference, status: "scheduled" };
  },

  async getTransactionRecord(providerReference) {
    return { providerReference, status: "unknown", amountMinor: 0, currency: "RWF" };
  },
};
