"use client";

import { useId } from "react";
import { BudgetBrief, Currency, FINISH_LEVEL_LABELS, FinishLevel } from "@/lib/build/types";
import { StepErrors } from "@/lib/build/briefValidation";
import { Field, inputClass, Toggle } from "./FormField";

export default function BriefStepBudget({ value, onChange, errors }: { value: BudgetBrief; onChange: (patch: Partial<BudgetBrief>) => void; errors: StepErrors }) {
  const ids = { min: useId(), target: useId(), max: useId(), completion: useId(), start: useId(), duration: useId() };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-slate-700 mb-2">Currency</p>
        <div className="flex gap-2">
          {(["RWF", "USD"] as Currency[]).map((c) => (
            <Toggle key={c} pressed={value.currency === c} onClick={() => onChange({ currency: c })}>
              {c}
            </Toggle>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        <Field label="Minimum budget" htmlFor={ids.min} error={errors.minBudget}>
          <input
            id={ids.min}
            type="number"
            min={0}
            value={value.minBudget ?? ""}
            onChange={(e) => onChange({ minBudget: e.target.value === "" ? null : Number(e.target.value) })}
            className={inputClass(Boolean(errors.minBudget))}
          />
        </Field>
        <Field label="Target budget" htmlFor={ids.target} error={errors.targetBudget}>
          <input
            id={ids.target}
            type="number"
            min={0}
            value={value.targetBudget ?? ""}
            onChange={(e) => onChange({ targetBudget: e.target.value === "" ? null : Number(e.target.value) })}
            className={inputClass(Boolean(errors.targetBudget))}
          />
        </Field>
        <Field label="Maximum budget" htmlFor={ids.max} error={errors.maxBudget}>
          <input
            id={ids.max}
            type="number"
            min={0}
            value={value.maxBudget ?? ""}
            onChange={(e) => onChange({ maxBudget: e.target.value === "" ? null : Number(e.target.value) })}
            className={inputClass(Boolean(errors.maxBudget))}
          />
        </Field>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-700 mb-2">Budget flexibility</p>
        <div className="flex flex-wrap gap-2">
          <Toggle pressed={value.flexibility === "fixed"} onClick={() => onChange({ flexibility: "fixed" })}>
            Fixed
          </Toggle>
          <Toggle pressed={value.flexibility === "some_flexibility"} onClick={() => onChange({ flexibility: "some_flexibility" })}>
            Some flexibility
          </Toggle>
          <Toggle pressed={value.flexibility === "flexible"} onClick={() => onChange({ flexibility: "flexible" })}>
            Flexible
          </Toggle>
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-700 mb-2">Finish level</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.entries(FINISH_LEVEL_LABELS) as [FinishLevel, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ finishLevel: key })}
              aria-pressed={value.finishLevel === key}
              className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                value.finishLevel === key ? "bg-[#2ec440]/10 border-[#2ec440] text-[#2ec440]" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        <Field label="Expected design completion" htmlFor={ids.completion}>
          <input id={ids.completion} type="text" placeholder="e.g. In 2 months" value={value.expectedDesignCompletion} onChange={(e) => onChange({ expectedDesignCompletion: e.target.value })} className={inputClass()} />
        </Field>
        <Field label="Expected construction start" htmlFor={ids.start}>
          <input id={ids.start} type="text" placeholder="e.g. In 6 months" value={value.expectedConstructionStart} onChange={(e) => onChange({ expectedConstructionStart: e.target.value })} className={inputClass()} />
        </Field>
        <Field label="Preferred construction duration" htmlFor={ids.duration}>
          <input id={ids.duration} type="text" placeholder="e.g. 10-12 months" value={value.preferredConstructionDuration} onChange={(e) => onChange({ preferredConstructionDuration: e.target.value })} className={inputClass()} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer">
          <input type="checkbox" checked={value.professionalFeesIncluded} onChange={(e) => onChange({ professionalFeesIncluded: e.target.checked })} className="accent-[#2ec440] w-4 h-4" />
          <span className="text-sm font-semibold text-slate-700">Professional fees included</span>
        </label>
        <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer">
          <input type="checkbox" checked={value.furnitureIncluded} onChange={(e) => onChange({ furnitureIncluded: e.target.checked })} className="accent-[#2ec440] w-4 h-4" />
          <span className="text-sm font-semibold text-slate-700">Furniture included</span>
        </label>
        <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer">
          <input type="checkbox" checked={value.landscapingIncluded} onChange={(e) => onChange({ landscapingIncluded: e.target.checked })} className="accent-[#2ec440] w-4 h-4" />
          <span className="text-sm font-semibold text-slate-700">Landscaping included</span>
        </label>
      </div>
    </div>
  );
}
