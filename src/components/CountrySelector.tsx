"use client";

import { useEffect, useState } from "react";
import { COUNTRY_OPTIONS, type CountryOption } from "@/lib/countries";
import { useVisitorCountry } from "@/lib/geo/useVisitorCountry";

export const SELECTED_COUNTRY_KEY = "huzaestate_selected_country_v1";

/** Reads whatever the visitor last picked here (see CountrySelector below) —
 *  used by /properties to seed its Country filter's default value. Plain
 *  localStorage rather than a full store module: this is a single per-visitor
 *  preference read once on mount, not domain data multiple components need
 *  to stay live-synced on. */
export function getSelectedCountryName(): string | null {
  try {
    return window.localStorage.getItem(SELECTED_COUNTRY_KEY);
  } catch {
    return null;
  }
}

/** Small flag+name pill for the navbar: shows the IP-detected country (best
 *  effort, see useVisitorCountry), or whatever the visitor previously
 *  overrode here. Picking a country persists it and becomes the default
 *  Country filter on /properties — still fully editable there, this only
 *  sets the starting point. */
export default function CountrySelector() {
  const detected = useVisitorCountry();
  // Starts at null (matching SSR) — reading localStorage in a lazy useState
  // initializer would return a real value on the client's first render
  // while the server rendered null, a genuine hydration mismatch. See the
  // same reasoning in useVisitorCountry.ts.
  const [selected, setSelected] = useState<CountryOption | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const savedName = getSelectedCountryName();
    const saved = savedName ? COUNTRY_OPTIONS.find((c) => c.name === savedName) : undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setSelected(saved);
  }, []);

  const current = selected ?? detected;
  if (!current) return null; // nothing detected yet and nothing chosen — stay invisible rather than guess

  function choose(c: CountryOption) {
    setSelected(c);
    setOpen(false);
    try {
      window.localStorage.setItem(SELECTED_COUNTRY_KEY, c.name);
    } catch {
      // best-effort only
    }
  }

  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-full transition-colors"
        aria-label={`Region: ${current.name}`}
      >
        <span aria-hidden="true">{current.flag}</span>
        {current.name}
        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 w-48">
            {COUNTRY_OPTIONS.map((c) => (
              <button
                key={c.code}
                onClick={() => choose(c)}
                className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-[14px] font-medium transition-colors flex items-center gap-2 ${c.code === current.code ? "text-[#2ec440]" : "text-slate-700"}`}
              >
                <span aria-hidden="true">{c.flag}</span>
                {c.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
