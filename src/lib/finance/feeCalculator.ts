// Pure, side-effect-free fee calculation — safe to import from both the
// client store and the server-side Route Handler in
// src/app/api/finance/payments/calculate/route.ts, so the two stay
// identical instead of drifting.

import { applyBasisPoints, clampMoney, zeroMoney } from "./money";
import type { Currency, FeeConfiguration, Money, PaymentFeeBreakdown } from "./types";

export function computeFeeBreakdown(serviceAmount: Money, feeConfig: FeeConfiguration): PaymentFeeBreakdown {
  let platformFee: Money =
    feeConfig.platformFeeType === "percentage"
      ? applyBasisPoints(serviceAmount, feeConfig.platformFeeValue)
      : { amountMinor: feeConfig.platformFeeValue, currency: serviceAmount.currency };
  if (feeConfig.promotionalWaiver) platformFee = zeroMoney(serviceAmount.currency);
  platformFee = clampMoney(platformFee, feeConfig.minFeeMinor, feeConfig.maxFeeMinor);

  // Provider fee is an estimate — no real provider is configured yet.
  const providerFee = applyBasisPoints(serviceAmount, 150);
  const taxes = zeroMoney(serviceAmount.currency);

  const totalCharge: Money = { amountMinor: serviceAmount.amountMinor + platformFee.amountMinor + providerFee.amountMinor + taxes.amountMinor, currency: serviceAmount.currency };
  const expectedRecipientAmount: Money = feeConfig.feePayer === "recipient" ? { amountMinor: serviceAmount.amountMinor - platformFee.amountMinor - providerFee.amountMinor, currency: serviceAmount.currency } : serviceAmount;

  return { serviceAmount, platformFee, providerFee, taxes, totalCharge, expectedRecipientAmount, feeConfigVersion: feeConfig.version };
}

export function sumLineItemsMinor(lineItems: { lineTotal: { amountMinor: number } }[]): number {
  return lineItems.reduce((sum, li) => sum + li.lineTotal.amountMinor, 0);
}

export function currencyFromLineItems(lineItems: { unitPrice: { currency: Currency } }[], fallback: Currency): Currency {
  return lineItems[0]?.unitPrice.currency ?? fallback;
}
