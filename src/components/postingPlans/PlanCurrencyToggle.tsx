"use client";

import { currencyForCountryCode } from "@/lib/currencies";
import { useDisplayCurrency } from "@/lib/currency/display";
import { useCurrentCountry } from "@/lib/geo/useCurrentCountry";

/** Switches plan prices between the visitor's own currency and US dollars. Shown only where those differ. */
export default function PlanCurrencyToggle({ className = "" }: { className?: string }) {
  const country = useCurrentCountry();
  const { currency, setCurrency, options } = useDisplayCurrency();
  const local = currencyForCountryCode(country?.code);
  if (!local || local === "USD" || !options.includes(local)) return null;
  const active = currency ?? "USD";

  return (
    <div role="group" aria-label="Currency" className={`inline-flex rounded-full border border-slate-200 bg-white p-0.5 text-xs font-bold ${className}`}>
      {[local, "USD"].map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setCurrency(code)}
          aria-pressed={active === code}
          className={`rounded-full px-3 py-1 transition-colors ${active === code ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"}`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
