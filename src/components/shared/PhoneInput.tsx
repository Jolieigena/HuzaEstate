"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AsYouType, isValidPhoneNumber, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { useCurrentCountry } from "@/lib/geo/useCurrentCountry";
import { COUNTRY_OPTIONS, countryFlagUrl, type CountryOption } from "@/lib/countries";

// Maps a dial-code digit string (no "+") to the country it belongs to, e.g.
// "256" -> Uganda. Built once at module load, not per render. Where several
// countries share one calling code (+1 for the US/Canada/Caribbean, +7 for
// Russia/Kazakhstan), whichever appears first in COUNTRY_OPTIONS wins.
const CALLING_CODE_TO_COUNTRY = new Map<string, CountryOption>();
for (const c of COUNTRY_OPTIONS) {
  try {
    const code = getCountryCallingCode(c.code as CountryCode);
    if (!CALLING_CODE_TO_COUNTRY.has(code)) CALLING_CODE_TO_COUNTRY.set(code, c);
  } catch {
    // A handful of ISO codes in COUNTRY_OPTIONS have no distinct calling
    // code libphonenumber-js recognizes — just skip those.
  }
}

/** Which country a typed dial code belongs to, checked directly against the
 *  digits after "+" (longest calling code first, since they're 1–3 digits
 *  and not all the same length) — deliberately NOT AsYouType's own
 *  getCountry(), which only resolves once enough of the *national number*
 *  has been typed too and can lag behind an already-complete dial code. */
function findCountryByDialedDigits(digits: string): CountryOption | undefined {
  for (let len = 3; len >= 1; len--) {
    const match = CALLING_CODE_TO_COUNTRY.get(digits.slice(0, len));
    if (match && digits.length >= len) return match;
  }
  return undefined;
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

/** Phone field that auto-fills the visitor's detected country's dial code,
 *  live-formats as they type (via libphonenumber-js's AsYouType, which knows
 *  each country's real grouping), and — the fix for "1234567890234567" —
 *  stops accepting more digits once the number is already a complete, valid
 *  one for whatever country its dial code identifies, instead of just
 *  capping at a fixed character count that has nothing to do with real
 *  phone number lengths.
 *
 *  The flag shown is NOT fixed to the visitor's geo-detected country: it
 *  follows whatever calling code is actually typed (typing "+256..." shows
 *  Uganda's flag even for a Rwanda-detected visitor), and there's also an
 *  explicit dropdown to pick a country directly rather than relying on
 *  typing the right digits. */
export default function PhoneInput({ value, onChange, id, required, placeholder, className }: PhoneInputProps) {
  const current = useCurrentCountry();
  // Explicit pick from the dropdown wins over both the typed-digits guess and
  // geo-detection; typed-digits guess wins over geo-detection; geo-detection
  // is only the starting point before the visitor has done either.
  const [manualCountry, setManualCountry] = useState<CountryOption | null>(null);
  const [typedCountry, setTypedCountry] = useState<CountryOption | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const prefilled = useRef(false);
  // The auto-filled dial code alone ("+250 ") is technically non-empty but
  // obviously not a number the visitor typed yet — only flag it invalid
  // once they've actually left the field, not on page load.
  const [touched, setTouched] = useState(false);

  const activeCountry: CountryOption | null = manualCountry ?? typedCountry ?? current;
  const defaultCountry = (activeCountry?.code as CountryCode) || "RW";

  useEffect(() => {
    if (prefilled.current || value || !current) return;
    prefilled.current = true;
    try {
      onChange(`+${getCountryCallingCode(current.code as CountryCode)} `);
    } catch {
      // Not every ISO country in COUNTRY_OPTIONS has a distinct calling
      // code libphonenumber-js recognizes (rare) — leave the field blank
      // rather than guess.
    }
  }, [current, value, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const prevDigits = value.replace(/\D/g, "");
    const newDigits = raw.replace(/\D/g, "");
    // Only ever block growth past an already-complete number — deletions,
    // and edits that don't add digits, always pass through. Passing
    // defaultCountry as a fallback here matters: without it, a number typed
    // without a leading "+" (e.g. after clearing the auto-filled dial code)
    // never registers as valid, so the cap would silently never engage.
    if (newDigits.length > prevDigits.length && value && isValidPhoneNumber(value, defaultCountry)) {
      return;
    }
    const formatted = raw.startsWith("+") ? new AsYouType().input(raw) : new AsYouType(defaultCountry).input(raw);
    // The "+" prefix lets the dial code be read straight off the digits —
    // that's what makes the flag follow what's actually typed, as soon as
    // the dial code itself is complete (not waiting on the national number
    // too, the way AsYouType's own country detection does). Once the
    // visitor edits the number, a prior explicit dropdown pick no longer
    // applies (they've told us a different country by typing it).
    const detected = raw.startsWith("+") ? findCountryByDialedDigits(raw.replace(/\D/g, "")) : undefined;
    if (detected) {
      setManualCountry(null);
      setTypedCountry(detected);
    }
    onChange(formatted);
  };

  function pickCountry(c: CountryOption) {
    setManualCountry(c);
    setTypedCountry(null);
    setIsPickerOpen(false);
    setSearch("");
    try {
      onChange(`+${getCountryCallingCode(c.code as CountryCode)} `);
    } catch {
      onChange("");
    }
  }

  const visibleOptions = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter((c) => c.name.toLowerCase().includes(t));
  }, [search]);

  const isComplete = value.trim().length > 0;
  const isValid = !isComplete || isValidPhoneNumber(value, defaultCountry);
  const showError = touched && !isValid;

  let dialCodePlaceholder = "+250 xxx xxx xxx";
  try {
    dialCodePlaceholder = `+${getCountryCallingCode(defaultCountry)} phone number`;
  } catch {
    // fall back to the default above
  }

  return (
    <div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsPickerOpen((o) => !o)}
          aria-label="Choose country"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1 py-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          {activeCountry ? (
            <img src={countryFlagUrl(activeCountry.code)} alt="" className="w-5 h-3.5 rounded-[2px] object-cover shrink-0" />
          ) : (
            <span className="w-5 h-3.5 rounded-[2px] bg-slate-200 shrink-0" />
          )}
          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
        </button>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={value}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          placeholder={placeholder ?? dialCodePlaceholder}
          required={required}
          className={
            className ??
            `w-full pl-16 pr-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 ${
              showError ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "border-slate-200 focus:ring-[#2ec440]/20 focus:border-[#2ec440]"
            }`
          }
        />
        {isPickerOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsPickerOpen(false)} />
            <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 w-64">
              <input
                type="text"
                autoFocus
                placeholder="Search countries…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 mb-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] text-[13px]"
              />
              <div className="max-h-64 overflow-y-auto">
                {visibleOptions.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => pickCountry(c)}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-[14px] font-medium transition-colors flex items-center gap-2 ${c.code === activeCountry?.code ? "text-[#2ec440]" : "text-slate-700"}`}
                  >
                    <img src={countryFlagUrl(c.code)} alt="" className="w-5 h-3.5 rounded-[2px] object-cover shrink-0" />
                    {c.name}
                  </button>
                ))}
                {visibleOptions.length === 0 && <p className="px-3 py-2 text-[13px] text-slate-400">No countries match &quot;{search}&quot;.</p>}
              </div>
            </div>
          </>
        )}
      </div>
      {showError && <p className="mt-1.5 text-xs font-semibold text-red-600">That doesn&apos;t look like a complete phone number.</p>}
    </div>
  );
}
