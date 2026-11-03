"use client";

import { useMemo } from "react";
import Select from "@/components/shared/Select";
import { useDisplayCurrency } from "@/lib/currency/display";

/** Switches plan prices to any currency there is an exchange rate for (every currency the rates service lists, with the visitor's own
 *  first). Plans are charged in US dollars; this only changes what is shown. */
export default function PlanCurrencyToggle({ className = "" }: { className?: string }) {
  const { currency, setCurrency, options } = useDisplayCurrency();
  const names = useMemo(() => {
    try {
      return new Intl.DisplayNames(["en"], { type: "currency" });
    } catch {
      return null;
    }
  }, []);
  // Until the exchange rates have loaded there is nothing to switch to.
  if (options.length === 0) return null;
  const active = currency ?? "USD";
  const label = (code: string) => {
    const name = names?.of(code);
    return name && name !== code ? `${code} · ${name}` : code;
  };
  const list = options.includes(active) ? options : [active, ...options];

  return (
    <Select
      value={active}
      onChange={(e) => setCurrency(e.target.value)}
      aria-label="Currency"
      className={`w-64 max-w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 ${className}`}
    >
      {list.map((code) => (
        <option key={code} value={code}>
          {label(code)}
        </option>
      ))}
    </Select>
  );
}
