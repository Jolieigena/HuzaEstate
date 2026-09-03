"use client";

import { BudgetFlexibility, BudgetTimelinePreferences, FINISH_LEVEL_LABELS, FinishLevel } from "@/lib/renovate/types";
import { AssessmentWarning } from "@/lib/renovate/assessmentValidation";
import { FormField, inputClass } from "./FormField";

interface Props {
  value: BudgetTimelinePreferences;
  onChange: (patch: Partial<BudgetTimelinePreferences>) => void;
  warnings: AssessmentWarning[];
  errors: Record<string, string>;
}

export default function StepBudgetTimeline({ value, onChange, warnings, errors }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-5">
        <FormField label="Minimum budget (RWF)" optional error={errors.minBudget}>
          {(id) => (
            <input id={id} type="number" min={0} value={value.minBudget ?? ""} onChange={(e) => onChange({ minBudget: e.target.value ? Number(e.target.value) : null })} className={inputClass} />
          )}
        </FormField>
        <FormField label="Target budget (RWF)" error={errors.targetBudget}>
          {(id) => (
            <input id={id} type="number" min={0} value={value.targetBudget ?? ""} onChange={(e) => onChange({ targetBudget: e.target.value ? Number(e.target.value) : null })} className={inputClass} />
          )}
        </FormField>
        <FormField label="Maximum budget (RWF)" optional error={errors.maxBudget}>
          {(id) => (
            <input id={id} type="number" min={0} value={value.maxBudget ?? ""} onChange={(e) => onChange({ maxBudget: e.target.value ? Number(e.target.value) : null })} className={inputClass} />
          )}
        </FormField>

        <FormField label="Budget flexibility">
          {(id) => (
            <select id={id} value={value.flexibility} onChange={(e) => onChange({ flexibility: e.target.value as BudgetFlexibility })} className={inputClass}>
              <option value="fixed">Fixed</option>
              <option value="some_flexibility">Some flexibility</option>
              <option value="flexible">Flexible</option>
            </select>
          )}
        </FormField>
        <FormField label="Finish level">
          {(id) => (
            <select id={id} value={value.finishLevel} onChange={(e) => onChange({ finishLevel: e.target.value as FinishLevel })} className={inputClass}>
              {Object.entries(FINISH_LEVEL_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <FormField label="Contingency preference">
          {(id) => (
            <select id={id} value={value.contingencyPreference} onChange={(e) => onChange({ contingencyPreference: e.target.value as BudgetTimelinePreferences["contingencyPreference"] })} className={inputClass}>
              <option value="minimal">Minimal</option>
              <option value="standard">Standard</option>
              <option value="higher">Higher</option>
            </select>
          )}
        </FormField>

        <FormField label="Desired start date" optional>
          {(id) => <input id={id} type="date" value={value.desiredStartDate?.slice(0, 10) ?? ""} onChange={(e) => onChange({ desiredStartDate: e.target.value })} className={inputClass} />}
        </FormField>
        <FormField label="Required completion date" optional>
          {(id) => <input id={id} type="date" value={value.requiredCompletionDate?.slice(0, 10) ?? ""} onChange={(e) => onChange({ requiredCompletionDate: e.target.value })} className={inputClass} />}
        </FormField>
        <FormField label="Work-hour restrictions" optional>
          {(id) => <input id={id} value={value.workHourRestrictions} onChange={(e) => onChange({ workHourRestrictions: e.target.value })} className={inputClass} />}
        </FormField>
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={value.propertyRemainsOccupied === true} onChange={(e) => onChange({ propertyRemainsOccupied: e.target.checked })} className="w-4 h-4 rounded accent-[#2ec440]" />
          Property remains occupied during work
        </label>
        <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={value.furnitureIncluded} onChange={(e) => onChange({ furnitureIncluded: e.target.checked })} className="w-4 h-4 rounded accent-[#2ec440]" />
          Include furniture
        </label>
        <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={value.appliancesIncluded} onChange={(e) => onChange({ appliancesIncluded: e.target.checked })} className="w-4 h-4 rounded accent-[#2ec440]" />
          Include appliances
        </label>
        <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={value.professionalFeesIncluded} onChange={(e) => onChange({ professionalFeesIncluded: e.target.checked })} className="w-4 h-4 rounded accent-[#2ec440]" />
          Include professional fees
        </label>
      </div>

      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5">
          {warnings.map((w) => (
            <p key={w.id} className="text-amber-800 text-sm leading-relaxed flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3.75m0 3.75h.008M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {w.message}
            </p>
          ))}
          <p className="text-amber-700 text-xs font-semibold pt-1">These are guidance only — you can still save this as a draft and continue.</p>
        </div>
      )}
    </div>
  );
}
