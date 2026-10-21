"use client";

import { useState } from "react";
import { useDisplayCurrency } from "@/lib/currency/display";

const SHOWN = 6;

/** Currency choice for inside a filter panel: the main currencies as small pills, and the rest in a scrollable list behind
 *  "More". Hidden until exchange rates have loaded. */
export default function CurrencyChips({ onChange }: { onChange?: (code: string) => void }) {
  const { currency, setCurrency, options } = useDisplayCurrency();
  const [more, setMore] = useState(false);
  if (!currency) return null;

  const main = options.slice(0, SHOWN);
  if (!main.includes(currency)) main[main.length - 1] = currency;
  const rest = options.filter((code) => !main.includes(code));

  const choose = (code: string) => {
    if (code !== currency) {
      setCurrency(code);
      onChange?.(code);
    }
    setMore(false);
  };
  const pill = (code: string) => (
    <button
      key={code}
      type="button"
      onClick={() => choose(code)}
      aria-pressed={code === currency}
      className={`rounded-full border px-3 py-1 text-[13px] font-semibold transition-colors ${code === currency ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
    >
      {code}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {main.map(pill)}
        {rest.length > 0 && (
          <button
            type="button"
            onClick={() => setMore((v) => !v)}
            aria-expanded={more}
            className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-[13px] font-semibold text-slate-500 transition-colors hover:bg-slate-50"
          >
            {more ? "Less" : "More"}
          </button>
        )}
      </div>
      {more && <div className="mt-2 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto overscroll-contain">{rest.map(pill)}</div>}
    </div>
  );
}
