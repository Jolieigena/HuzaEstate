"use client";

import Select from "@/components/shared/Select";
import { useDisplayCurrency } from "@/lib/currency/display";

/** Chooses the currency every listing price is shown in. Hidden until exchange rates have loaded. */
export default function CurrencyPicker({ className = "", onChange }: { className?: string; onChange?: (code: string) => void }) {
  const { currency, setCurrency, options } = useDisplayCurrency();
  if (!currency) return null;
  return (
    <Select
      value={currency}
      onChange={(e) => { setCurrency(e.target.value); onChange?.(e.target.value); }}
      aria-label="Currency"
      className={className || "w-[110px]"}
    >
      {options.map((code) => <option key={code} value={code}>{code}</option>)}
    </Select>
  );
}
