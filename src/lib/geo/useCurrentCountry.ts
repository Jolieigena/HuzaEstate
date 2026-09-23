"use client";

import { useEffect, useState } from "react";
import { COUNTRY_OPTIONS, type CountryOption } from "@/lib/countries";
import { useVisitorCountry } from "./useVisitorCountry";

export const SELECTED_COUNTRY_KEY = "huzaestate_selected_country_v1";

/** Whatever a visitor explicitly picked in the old navbar country picker,
 *  if anything — used by /properties to seed its Country filter's default
 *  value. Plain localStorage rather than a full store module: this is a
 *  single per-visitor preference read once on mount, not domain data
 *  multiple components need to stay live-synced on. */
export function getSelectedCountryName(): string | null {
  try {
    return window.localStorage.getItem(SELECTED_COUNTRY_KEY);
  } catch {
    return null;
  }
}

/** The country to show for this visitor: whatever they previously picked,
 *  falling back to best-effort IP detection (see useVisitorCountry). Null
 *  until either resolves — callers (the logo/avatar flag badges) should
 *  render nothing rather than guess. */
export function useCurrentCountry(): CountryOption | null {
  const detected = useVisitorCountry();
  // Starts at null (matching SSR) — reading localStorage in a lazy useState
  // initializer would return a real value on the client's first render
  // while the server rendered null, a genuine hydration mismatch. Same
  // reasoning as useVisitorCountry.ts itself.
  const [selected, setSelected] = useState<CountryOption | null>(null);

  useEffect(() => {
    const savedName = getSelectedCountryName();
    const saved = savedName ? COUNTRY_OPTIONS.find((c) => c.name === savedName) : undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setSelected(saved);
  }, []);

  return selected ?? detected;
}
