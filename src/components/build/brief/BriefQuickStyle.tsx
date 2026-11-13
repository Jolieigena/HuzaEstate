"use client";

import { useId } from "react";
import { BudgetBrief, HOME_FEATURES, HOME_STYLE_LABELS, HomeStyle, StyleBrief } from "@/lib/build/types";
import { StepErrors } from "@/lib/build/briefValidation";
import { Field, Toggle, inputClass } from "./FormField";
import BudgetInput from "@/components/shared/BudgetInput";

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
        <select
          aria-label="Style"
          value={style.primaryStyle ?? ""}
          onChange={(e) => onChangeStyle({ primaryStyle: (e.target.value || null) as HomeStyle | null })}
          className={inputClass(Boolean(errors.primaryStyle))}
        >
          <option value="">Select a style</option>
          {(Object.entries(HOME_STYLE_LABELS) as [HomeStyle, string][]).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-bold text-slate-700">Features you would like</p>
        <div className="flex flex-wrap gap-2">
          {HOME_FEATURES.map((feature) => {
            const on = (style.features ?? []).includes(feature);
            return (
              <Toggle key={feature} pressed={on} onClick={() => onChangeStyle({ features: on ? (style.features ?? []).filter((f) => f !== feature) : [...(style.features ?? []), feature] })}>
                {feature}
              </Toggle>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-slate-700">
          Budget <span className="font-normal text-slate-400">(optional)</span>
        </p>
        <Field label="Target budget" htmlFor={targetId} error={errors.targetBudget}>
          <BudgetInput id={targetId} amount={budget.targetBudget} currency={budget.currency} onChange={(targetBudget, currency) => onChangeBudget({ targetBudget, currency })} inputClassName={inputClass(Boolean(errors.targetBudget))} />
        </Field>
      </div>
    </div>
  );
}
