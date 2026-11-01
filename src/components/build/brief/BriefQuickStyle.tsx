"use client";

import { useId } from "react";
import { BudgetBrief, Currency, HOME_STYLE_LABELS, HomeStyle, StyleBrief } from "@/lib/build/types";
import { StepErrors } from "@/lib/build/briefValidation";
import { Field, Toggle, inputClass } from "./FormField";

/** The short path's second screen: the style of the home and, if they know it, what they want to spend. */
export default function BriefQuickStyle({
  style,
  budget,
  onChangeStyle,
  onChangeBudget,
  errors,
}: {
  style: StyleBrief;
  budget: BudgetBrief;
  onChangeStyle: (patch: Partial<StyleBrief>) => void;
  onChangeBudget: (patch: Partial<BudgetBrief>) => void;
  errors: StepErrors;
}) {
  const targetId = useId();

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-sm font-bold text-slate-700">
          Style <span className="text-red-500">*</span>
        </p>
        {errors.primaryStyle && (
          <p className="mb-2 text-xs font-semibold text-red-600" role="alert">
            {errors.primaryStyle}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.entries(HOME_STYLE_LABELS) as [HomeStyle, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChangeStyle({ primaryStyle: key })}
              aria-pressed={style.primaryStyle === key}
              className={`rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${
                style.primaryStyle === key ? "border-[#2ec440] bg-[#2ec440]/10 text-[#2ec440]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-slate-700">
          Budget <span className="font-normal text-slate-400">(optional)</span>
        </p>
        <div className="mb-3 flex gap-2">
          {(["RWF", "USD"] as Currency[]).map((c) => (
            <Toggle key={c} pressed={budget.currency === c} onClick={() => onChangeBudget({ currency: c })}>
              {c}
            </Toggle>
          ))}
        </div>
        <Field label="Target budget" htmlFor={targetId} error={errors.targetBudget}>
          <input
            id={targetId}
            type="number"
            min={0}
            value={budget.targetBudget ?? ""}
            onChange={(e) => onChangeBudget({ targetBudget: e.target.value === "" ? null : Number(e.target.value) })}
            className={inputClass(Boolean(errors.targetBudget))}
          />
        </Field>
      </div>
    </div>
  );
}
