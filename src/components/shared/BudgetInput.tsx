"use client";

import { useState } from "react";
import Select from "@/components/shared/Select";
import { useStudioMoney } from "@/lib/currency/studioMoney";

/** An amount and its currency. The currency starts as the visitor's own (their country by IP), and the person can change it. */
export default function BudgetInput({
  id,
  amount,
  currency,
  onChange,
  inputClassName,
  placeholder,
}: {
  id?: string;
  amount: number | null;
  /** The currency saved with the amount; ignored until an amount has been typed. */
  currency?: string;
  onChange: (amount: number | null, currency: string) => void;
  inputClassName: string;
  placeholder?: string;
}) {
  const { code, options } = useStudioMoney();
  const [picked, setPicked] = useState<string | null>(null);
  const current = picked ?? (amount && currency ? currency : code);
  const list = options.includes(current) ? options : [current, ...options];

  return (
    <div className="flex gap-2">
      <Select value={current} onChange={(e) => { setPicked(e.target.value); onChange(amount, e.target.value); }} aria-label="Currency" className="w-[110px] shrink-0">
        {list.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        value={amount ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Math.max(0, Number(e.target.value)), current)}
        placeholder={placeholder}
        className={inputClassName}
      />
    </div>
  );
}
