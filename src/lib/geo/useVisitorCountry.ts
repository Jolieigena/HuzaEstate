"use client";

import { useEffect, useState } from "react";
import { COUNTRY_OPTIONS, type CountryOption } from "@/lib/countries";
import { clearLegacyCountryKeys, lookupCountryCode, readCachedCountry, writeCachedCountry } from "./visitorCountry";

const findCountry = (code: string): CountryOption | undefined => COUNTRY_OPTIONS.find((c) => c.code === code);

/** Best-effort IP geolocation, entirely client-side (no backend involved).
 *  Silently resolves to null on any failure — a blocked/offline/rate-limited
 *  lookup should never surface an error to the visitor, it just means no
 *  default country is pre-selected.
 *
 *  The last answer is remembered in localStorage so pages can show it at once, but only for a few hours (see
 *  visitorCountry.ts): after that the visitor is looked up again, so someone who has travelled sees where they are now,
 *  not where they first opened the site. A remembered answer is shown straight away and then replaced if the new lookup
 *  disagrees.
 *
 *  State starts at null (matching what SSR renders, since there's no
 *  localStorage on the server) and is only set inside the effect below —
 *  a lazy useState initializer that read localStorage would return a real
 *  value on the client's very first (hydration) render while the server
 *  rendered null, which is a genuine hydration mismatch, not just a lint
 *  nag. Same reasoning as the sync setState in auth-context.tsx's own
 *  session-check effect. */
export function useVisitorCountry(): CountryOption | null {
  const [country, setCountry] = useState<CountryOption | null>(null);

  useEffect(() => {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      // storage blocked: every visit looks the visitor up
    }
    if (storage) clearLegacyCountryKeys(storage);

    const cached = storage ? readCachedCountry(storage) : null;
    const remembered = cached ? findCountry(cached.code) : undefined;
    if (remembered) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountry(remembered);
      if (cached?.fresh) return;
    }

    let cancelled = false;
    lookupCountryCode(fetch).then((code) => {
      if (cancelled || !code) return;
      const match = findCountry(code);
      if (!match) return;
      setCountry(match);
      if (storage) writeCachedCountry(storage, match.code);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return country;
}
