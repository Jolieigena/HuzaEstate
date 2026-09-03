import { Currency, Money } from "./types";

/** Minor-unit factor per currency. RWF is kept as whole units (matches the
 *  existing plain-integer RWF convention used across execution/renovate);
 *  USD subdivides into cents. */
const MINOR_UNIT_FACTOR: Record<Currency, number> = { RWF: 1, USD: 100 };

export function toMinor(majorAmount: number, currency: Currency): number {
  return Math.round(majorAmount * MINOR_UNIT_FACTOR[currency]);
}

export function toMajor(amountMinor: number, currency: Currency): number {
  return amountMinor / MINOR_UNIT_FACTOR[currency];
}

export function money(majorAmount: number, currency: Currency): Money {
  return { amountMinor: toMinor(majorAmount, currency), currency };
}

export function zeroMoney(currency: Currency): Money {
  return { amountMinor: 0, currency };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
}

export function subtractMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  return { amountMinor: a.amountMinor - b.amountMinor, currency: a.currency };
}

export function sumMoney(items: Money[], currency: Currency): Money {
  return items.reduce((acc, item) => addMoney(acc, item), zeroMoney(currency));
}

export function isPositive(m: Money): boolean {
  return m.amountMinor > 0;
}

export function moneyEquals(a: Money, b: Money): boolean {
  return a.currency === b.currency && a.amountMinor === b.amountMinor;
}

/** Percentage in basis points (100 = 1%) applied to a Money amount, rounded to the nearest minor unit. */
export function applyBasisPoints(amount: Money, basisPoints: number): Money {
  return { amountMinor: Math.round((amount.amountMinor * basisPoints) / 10000), currency: amount.currency };
}

export function clampMoney(amount: Money, min?: number, max?: number): Money {
  let value = amount.amountMinor;
  if (min !== undefined) value = Math.max(value, min);
  if (max !== undefined) value = Math.min(value, max);
  return { amountMinor: value, currency: amount.currency };
}

export function formatMoney(amount: Money): string {
  const major = toMajor(amount.amountMinor, amount.currency);
  return new Intl.NumberFormat("en-RW", { style: "currency", currency: amount.currency, maximumFractionDigits: amount.currency === "USD" ? 2 : 0 }).format(major);
}
