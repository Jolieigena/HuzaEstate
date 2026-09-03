"use client";

import { SafetyAnswer, SafetyAssessment, SAFETY_CONCERN_LABELS, SafetyConcernKey } from "@/lib/renovate/types";
import { FormField, inputClass } from "./FormField";

interface Props {
  value: SafetyAssessment;
  onChange: (patch: Partial<SafetyAssessment>) => void;
}

const ANSWER_OPTIONS: { value: SafetyAnswer; label: string }[] = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
  { value: "unknown", label: "Not sure" },
];

export default function StepSafety({ value, onChange }: Props) {
  const anyFlagged = Object.values(value.concerns).some((v) => v === "yes" || v === "unknown");

  const setAnswer = (key: SafetyConcernKey, answer: SafetyAnswer) => {
    onChange({ concerns: { ...value.concerns, [key]: answer } });
  };

  return (
    <div className="space-y-6">
      <p className="text-slate-500 text-sm">Tell us whether this renovation may involve any of the following. Huza AI cannot confirm safety from photos or descriptions alone.</p>

      <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
        {(Object.entries(SAFETY_CONCERN_LABELS) as [SafetyConcernKey, string][]).map(([key, label]) => (
          <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-white">
            <span className="text-sm font-semibold text-slate-800">{label}</span>
            <div className="flex gap-2">
              {ANSWER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAnswer(key, opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    value.concerns[key] === opt.value ? "bg-[#2ec440]/10 border-[#2ec440] text-[#2ec440]" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {anyFlagged && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-amber-900 text-sm font-semibold leading-relaxed">Professional inspection required before execution. Huza AI never marks structural, electrical, plumbing or safety-related elements as safe.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <FormField label="Building management restrictions" optional>
          {(id) => <input id={id} value={value.buildingManagementRestrictions} onChange={(e) => onChange({ buildingManagementRestrictions: e.target.value })} className={inputClass} />}
        </FormField>
        <FormField label="Neighbourhood restrictions" optional>
          {(id) => <input id={id} value={value.neighbourhoodRestrictions} onChange={(e) => onChange({ neighbourhoodRestrictions: e.target.value })} className={inputClass} />}
        </FormField>
        <FormField label="Access constraints" optional>
          {(id) => <input id={id} value={value.accessConstraints} onChange={(e) => onChange({ accessConstraints: e.target.value })} className={inputClass} />}
        </FormField>
        <FormField label="Working-hour restrictions" optional>
          {(id) => <input id={id} value={value.workingHourRestrictions} onChange={(e) => onChange({ workingHourRestrictions: e.target.value })} className={inputClass} />}
        </FormField>
        <FormField label="Waste-removal constraints" optional>
          {(id) => <input id={id} value={value.wasteRemovalConstraints} onChange={(e) => onChange({ wasteRemovalConstraints: e.target.value })} className={inputClass} />}
        </FormField>
        <FormField label="Known permit requirements" optional>
          {(id) => <input id={id} value={value.knownPermitRequirements} onChange={(e) => onChange({ knownPermitRequirements: e.target.value })} className={inputClass} />}
        </FormField>
      </div>
      <FormField label="Other concerns" optional>
        {(id) => <textarea id={id} value={value.otherConcerns} onChange={(e) => onChange({ otherConcerns: e.target.value })} rows={2} className={`${inputClass} resize-none`} />}
      </FormField>
    </div>
  );
}
