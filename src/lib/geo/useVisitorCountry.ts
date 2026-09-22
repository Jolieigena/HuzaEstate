"use client";

import { useEffect, useState } from "react";
import { COUNTRY_OPTIONS, type CountryOption } from "@/lib/countries";

const CACHE_KEY = "huzaestate_visitor_country_v1";

/** Best-effort IP geolocation, entirely client-side (no backend involved).
 *  Silently resolves to null on any failure — a blocked/offline/rate-limited
 *  lookup should never surface an error to the visitor, it just means no
 *  default country is pre-selected. Result is cached in localStorage so a
 *  page navigation doesn't re-fetch it every time.
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
    try {
      const cached = window.localStorage.getItem(CACHE_KEY);
      if (cached) {
        const match = COUNTRY_OPTIONS.find((c) => c.code === cached);
        if (match) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCountry(match);
          return;
        }
      }
    } catch {
      // ignore — fall through to a live lookup
    }

    let cancelled = false;
    fetch("https://ipapi.co/json/")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { country_code?: string }) => {
        if (cancelled || !data.country_code) return;
        const match = COUNTRY_OPTIONS.find((c) => c.code === data.country_code);
        if (match) {
          setCountry(match);
          try {
            window.localStorage.setItem(CACHE_KEY, match.code);
          } catch {
            // best-effort only
          }
        }
      })
      .catch(() => {
        // Blocked, offline, rate-limited — no default, not an error the visitor sees.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return country;
}
