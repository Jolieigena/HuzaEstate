"use client";

import { useCallback } from "react";
import { useDisplayCurrency } from "@/lib/currency/display";

/** How the Build and Renovate studios show money: the costs the studios work out (in RWF, from Kigali prices) and the quotes are shown in
 *  the visitor's own currency (their country by IP, or the one they picked), and a budget the person typed stays in the currency they typed it in. */
export interface StudioMoney {
  /** The currency estimates are shown in; RWF until the exchange rates have loaded. */
  code: string;
  /** Currencies the budget can be typed in. */
  options: string[];
  /** An amount in RWF as a number in the shown currency. */
  fromRwf: (amountRwf: number) => number;
  /** An amount in RWF as text, e.g. "GBP 5,170". */
  format: (amountRwf: number) => string;
  /** The same, short: "GBP 5.2k". */
  compact: (amountRwf: number) => string;
  /** A typed amount in RWF, for checking it against the Kigali costs. Unchanged while the exchange rates have not loaded. */
  toRwf: (amount: number, currency: string) => number;
}

export function useStudioMoney(): StudioMoney {
  const money = useDisplayCurrency();
  const code = money.currency ?? "RWF";
  const fromRwf = useCallback((amountRwf: number) => money.convert(amountRwf, "RWF"), [money]);
  const format = useCallback((amountRwf: number) => money.format(amountRwf, "RWF"), [money]);
  const compact = useCallback((amountRwf: number) => money.formatCompact(amountRwf, "RWF"), [money]);
  const toRwf = useCallback((amount: number, currency: string) => money.toUsd(amount, currency) / money.toUsd(1, "RWF"), [money]);
  return { code, options: money.options, fromRwf, format, compact, toRwf };
}

/** What a person typed, as they typed it: "$5,000" or "KES 500,000". */
export function formatTyped(amount: number, currency: string): string {
  const text = Math.round(amount).toLocaleString("en-US");
  return currency === "USD" ? `$${text}` : `${currency} ${text}`;
}

/** The same, short: "$5k", "KES 500k", "RWF 8.0M". */
export function formatTypedCompact(amount: number, currency: string): string {
  const prefix = currency === "USD" ? "$" : `${currency} `;
  if (amount >= 1_000_000_000) return `${prefix}${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${prefix}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${prefix}${(amount / 1_000).toFixed(0)}k`;
  return `${prefix}${Math.round(amount)}`;
}
