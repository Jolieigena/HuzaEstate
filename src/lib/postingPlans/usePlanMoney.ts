"use client";

import { useCallback } from "react";
import { useDisplayCurrency } from "@/lib/currency/display";
import { toMajor } from "@/lib/finance/money";
import type { Money } from "@/lib/finance/types";

/** Plan prices are set, and charged, in US dollars. This shows them in the visitor's own currency (the one their IP points to, or
 *  the one they switched to), the same way listing prices are shown, and falls back to dollars until the rates have loaded. */
export function usePlanMoney() {
  const display = useDisplayCurrency();
  const show = useCallback((amount: Money) => display.format(toMajor(amount.amountMinor, amount.currency), amount.currency), [display]);
  /** True when what is shown is not in the currency the plan is charged in. */
  const converted = display.currency !== null && display.currency !== "USD";
  return { show, converted };
}
