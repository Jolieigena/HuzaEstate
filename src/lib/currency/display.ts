"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { currencyForCountryCode, MAJOR_CURRENCIES } from "@/lib/currencies";
import { useCurrentCountry } from "@/lib/geo/useCurrentCountry";

// Listings keep the currency the seller typed. Buyers see every price in one currency: the one they picked, otherwise the
// currency of the country they are in. Rates come from the property service (units per 1 USD, refreshed daily there).

const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:8081/api/property-service";
const CHOSEN_KEY = "huzaestate_display_currency";
const RATES_KEY = "huzaestate_rates";
const RATES_MAX_AGE_MS = 6 * 60 * 60 * 1000;

interface Snapshot {
  rates: Record<string, number> | null;
  chosen: string | null;
}

let state: Snapshot = { rates: null, chosen: null };
const SERVER_STATE: Snapshot = { rates: null, chosen: null };
const listeners = new Set<() => void>();
let started = false;

function setState(next: Partial<Snapshot>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  let chosen: string | null = null;
  try {
    chosen = localStorage.getItem(CHOSEN_KEY);
    const saved = JSON.parse(localStorage.getItem(RATES_KEY) || "null");
    if (saved?.rates && Date.now() - saved.at < RATES_MAX_AGE_MS) {
      setState({ rates: saved.rates, chosen });
      return;
    }
    if (saved?.rates) state = { ...state, rates: saved.rates };
  } catch {}
  setState({ chosen });
  fetch(`${PROPERTY_API_URL}/properties/rates`)
    .then((res) => (res.ok ? res.json() : null))
    .then((body) => {
      if (!body?.rates) return;
      setState({ rates: body.rates });
      try { localStorage.setItem(RATES_KEY, JSON.stringify({ rates: body.rates, at: Date.now() })); } catch {}
    })
    .catch(() => {});
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function codeOf(currency?: string): string {
  return (currency || "USD").replace(/\/.*$/, "").trim().toUpperCase() || "USD";
}

function roundForDisplay(value: number): number {
  if (value < 1000) return Math.round(value);
  // Three significant figures: a converted price is an estimate, so it should not look exact.
  const digits = Math.floor(Math.log10(value)) + 1;
  const step = Math.pow(10, Math.max(digits - 3, 0));
  return Math.round(value / step) * step;
}

export interface DisplayCurrency {
  /** The currency prices are shown in, or null while it is not known yet (prices then show as the seller typed them). */
  currency: string | null;
  setCurrency: (code: string) => void;
  options: string[];
  convert: (price: number, from?: string) => number;
  /** The price in US dollars, for comparing against dollar amounts. Unchanged when rates are not loaded. */
  toUsd: (price: number, from?: string) => number;
  format: (price: number, from?: string) => string;
  formatCompact: (price: number, from?: string) => string;
  /** One total over amounts in different currencies, in the buyer's currency. Without rates, one total per currency. */
  formatSum: (amounts: [number, string][]) => string[];
}

export function useDisplayCurrency(): DisplayCurrency {
  const snap = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  const country = useCurrentCountry();
  useEffect(start, []);

  const local = currencyForCountryCode(country?.code) ?? null;
  const wanted = snap.chosen || local;
  const rates = snap.rates;
  // Only convert when both sides have a rate; otherwise the seller's own price is the honest thing to show.
  const currency = wanted && rates && rates[wanted] ? wanted : null;

  const setCurrency = useCallback((code: string) => {
    try { localStorage.setItem(CHOSEN_KEY, code); } catch {}
    setState({ chosen: code });
  }, []);

  const convert = useCallback((price: number, from?: string) => {
    const source = codeOf(from);
    if (!currency || !rates || source === currency || !rates[source]) return price;
    return (price / rates[source]) * rates[currency];
  }, [currency, rates]);

  const toUsd = useCallback((price: number, from?: string) => {
    const source = codeOf(from);
    return rates && rates[source] ? price / rates[source] : price;
  }, [rates]);

  const shown = useCallback((from?: string) => {
    const source = codeOf(from);
    return currency && rates && rates[source] ? currency : source;
  }, [currency, rates]);

  const format = useCallback((price: number, from?: string) => {
    const code = shown(from);
    const converted = code === codeOf(from) ? price : roundForDisplay(convert(price, from));
    const text = Math.round(converted).toLocaleString("en-US");
    return code === "USD" ? `$${text}` : `${code} ${text}`;
  }, [convert, shown]);

  const formatCompact = useCallback((price: number, from?: string) => {
    const code = shown(from);
    const value = convert(price, from);
    const prefix = code === "USD" ? "$" : `${code} `;
    if (value >= 1_000_000_000) return `${prefix}${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1000) return `${prefix}${(value / 1000).toFixed(0)}k`;
    return `${prefix}${Math.round(value)}`;
  }, [convert, shown]);

  const formatSum = useCallback((amounts: [number, string][]) => {
    if (!currency) return amounts.map(([amount, from]) => format(amount, from));
    const sum = amounts.reduce((all, [amount, from]) => all + convert(amount, from), 0);
    return [format(sum, currency)];
  }, [currency, convert, format]);

  // Every currency we have a rate for and can name, with the majors and the buyer's own currency first.
  const options = (() => {
    const first = [...MAJOR_CURRENCIES as readonly string[]];
    if (local && !first.includes(local)) first.push(local);
    if (!rates) return first;
    const rest = Object.keys(rates).filter((c) => !first.includes(c)).sort();
    return [...first.filter((c) => rates[c]), ...rest];
  })();

  return { currency, setCurrency, options, convert, toUsd, format, formatCompact, formatSum };
}
