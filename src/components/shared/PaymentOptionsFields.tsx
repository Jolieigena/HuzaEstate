"use client";

import Select from "@/components/shared/Select";
import { useLanguage } from "@/lib/i18n/language";
import { MAX_INSTALLMENT_MONTHS, MAX_INSTALLMENTS, minMonths } from "@/lib/properties/paymentOptions";

export interface PaymentOptionsState {
  full: boolean;
  installments: boolean;
  count: 2 | 3;
  months: number;
  firstPercent: string;
}

export const DEFAULT_PAYMENT_OPTIONS: PaymentOptionsState = { full: true, installments: false, count: 3, months: 6, firstPercent: "40" };

/** The body the server takes for these choices. */
export function paymentOptionsBody(state: PaymentOptionsState) {
  return {
    full: state.full,
    ...(state.installments ? { installments: { count: state.count, months: state.months, firstPercent: Number(state.firstPercent) } } : {}),
  };
}

/** Why these choices cannot be saved, or null when they can. */
export function paymentOptionsProblem(state: PaymentOptionsState, t: (text: string, values?: Record<string, string | number>) => string = (text) => text): string | null {
  if (!state.full && !state.installments) return t("Choose at least one way to pay: in full or in installments.");
  if (state.installments) {
    const percent = Number(state.firstPercent);
    if (!Number.isFinite(percent) || percent < 10 || percent > 90) return t("The first payment can be 10% to 90% of the price.");
    if (state.months < minMonths(state.count)) return t("{count} payments need at least {months} months.", { count: state.count, months: minMonths(state.count) });
  }
  return null;
}

export function toPaymentOptionsState(options: { full: boolean; installments?: { count: number; months: number; firstPercent: number } } | undefined): PaymentOptionsState {
  if (!options) return DEFAULT_PAYMENT_OPTIONS;
  return {
    full: options.full !== false,
    installments: !!options.installments,
    count: options.installments?.count === 2 ? 2 : 3,
    months: options.installments?.months ?? 6,
    firstPercent: String(options.installments?.firstPercent ?? 40),
  };
}

const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors";

function Choice({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${checked ? "border-[#2ec440] bg-[#2ec440]/5 text-slate-900" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#2ec440]" />
      {label}
    </label>
  );
}

/** For a house or apartment for sale: how a buyer may pay, in full and/or in installments (at most 3, over at most 6 months). */
export default function PaymentOptionsFields({ value, onChange }: { value: PaymentOptionsState; onChange: (next: PaymentOptionsState) => void }) {
  const { t } = useLanguage();
  const set = (changes: Partial<PaymentOptionsState>) => onChange({ ...value, ...changes });
  const first = Number(value.firstPercent);
  const restEach = value.installments && first >= 10 && first <= 90 ? Number(((100 - first) / (value.count - 1)).toFixed(1)) : null;
  const months = Array.from({ length: MAX_INSTALLMENT_MONTHS - minMonths(value.count) + 1 }, (_, i) => minMonths(value.count) + i);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Choice checked={value.full} onChange={(full) => set({ full })} label={t("Buy in full")} />
        <Choice checked={value.installments} onChange={(installments) => set({ installments })} label={t("Buy in installments")} />
      </div>
      {value.installments && (
        <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">{t("Payments")}</label>
            <div role="radiogroup" aria-label={t("Number of payments")} className="flex gap-2">
              {([2, 3] as const).filter((n) => n <= MAX_INSTALLMENTS).map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={value.count === n}
                  onClick={() => set({ count: n, months: Math.max(value.months, minMonths(n)) })}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${value.count === n ? "border-[#2ec440] bg-[#2ec440]/5 text-[#2ec440]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">{t("Over")}</label>
            <Select value={String(value.months)} onChange={(e) => set({ months: Number(e.target.value) })} className={inputClass}>
              {months.map((m) => (
                <option key={m} value={m}>{t(m === 1 ? "{count} month" : "{count} months", { count: m })}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">{t("First payment (%)")}</label>
            <input type="number" min="10" max="90" value={value.firstPercent} onChange={(e) => set({ firstPercent: e.target.value })} className={inputClass} />
          </div>
          {restEach !== null && (
            <p className="sm:col-span-3 text-sm font-semibold text-slate-600">
              {t(value.months === 1 ? "{first}% at purchase, then {rest} within {months} month." : "{first}% at purchase, then {rest} within {months} months.", { first, rest: Array.from({ length: value.count - 1 }, () => `${restEach}%`).join(" + "), months: value.months })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
