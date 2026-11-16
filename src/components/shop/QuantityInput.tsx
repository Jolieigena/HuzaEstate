"use client";

import { useState } from "react";

/** How many to buy: a number that can be typed (a bag of nails, fifty cement bags) with − and + for one more or less. */
export default function QuantityInput({ value, onChange, max = 9999, label = "Quantity", compact = false }: { value: number; onChange: (value: number) => void; max?: number; label?: string; compact?: boolean }) {
  const [draft, setDraft] = useState<string | null>(null);
  const limit = Math.max(1, max);
  const clamp = (n: number) => Math.min(Math.max(Math.floor(n) || 1, 1), limit);
  const commit = (text: string) => {
    const next = clamp(Number(text));
    setDraft(null);
    if (next !== value) onChange(next);
  };
  const size = compact ? "h-7 w-7 text-sm" : "h-11 w-10 text-base";
  const button = `${size} shrink-0 font-bold text-slate-600 transition-colors hover:text-slate-900 disabled:opacity-30`;

  return (
    <div className={`inline-flex items-center rounded-xl border border-slate-200 bg-white ${compact ? "" : "focus-within:border-[#2ec440]"}`}>
      <button type="button" aria-label="Fewer" disabled={value <= 1} onClick={() => onChange(clamp(value - 1))} className={button}>
        −
      </button>
      <input
        inputMode="numeric"
        aria-label={label}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 4))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className={`${compact ? "w-11 text-sm" : "w-16 text-sm"} border-x border-slate-100 bg-transparent py-1 text-center font-bold text-slate-900 outline-none ${compact ? "" : "h-11"}`}
      />
      <button type="button" aria-label="More" disabled={value >= limit} onClick={() => onChange(clamp(value + 1))} className={button}>
        +
      </button>
    </div>
  );
}
