"use client";

import { useId } from "react";
import { ProjectBasics, PROPERTY_USE_LABELS, PropertyUse } from "@/lib/build/types";
import { StepErrors } from "@/lib/build/briefValidation";
import { Field, inputClass } from "./FormField";

export default function BriefStepBasics({ value, onChange, errors }: { value: ProjectBasics; onChange: (patch: Partial<ProjectBasics>) => void; errors: StepErrors }) {
  const ids = {
    country: useId(),
    province: useId(),
    district: useId(),
    neighbourhood: useId(),
    occupants: useId(),
    start: useId(),
  };

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Country" htmlFor={ids.country} required error={errors.countryValue}>
          <input id={ids.country} type="text" value={value.countryValue} onChange={(e) => onChange({ countryValue: e.target.value })} className={inputClass(Boolean(errors.countryValue))} />
        </Field>
        <Field label="Province or city" htmlFor={ids.province} required error={errors.provinceOrCity}>
          <input
            id={ids.province}
            type="text"
            placeholder="e.g. Kigali"
            value={value.provinceOrCity}
            onChange={(e) => onChange({ provinceOrCity: e.target.value })}
            className={inputClass(Boolean(errors.provinceOrCity))}
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="District" htmlFor={ids.district} helper="Optional but helps with location-specific budget assumptions.">
          <input id={ids.district} type="text" value={value.district} onChange={(e) => onChange({ district: e.target.value })} className={inputClass()} />
        </Field>
        <Field label="Neighbourhood or address" htmlFor={ids.neighbourhood}>
          <input id={ids.neighbourhood} type="text" value={value.neighbourhood} onChange={(e) => onChange({ neighbourhood: e.target.value })} className={inputClass()} />
        </Field>
      </div>

      <Field label="Intended property use" htmlFor="property-use" required error={errors.propertyUse}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.entries(PROPERTY_USE_LABELS) as [PropertyUse, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ propertyUse: key })}
              aria-pressed={value.propertyUse === key}
              className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors text-left ${
                value.propertyUse === key ? "bg-[#2ec440]/10 border-[#2ec440] text-[#2ec440]" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Expected occupants" htmlFor={ids.occupants} error={errors.occupants} helper="Roughly how many people will live here.">
          <input
            id={ids.occupants}
            type="number"
            min={1}
            max={50}
            value={value.occupants ?? ""}
            onChange={(e) => onChange({ occupants: e.target.value === "" ? null : Number(e.target.value) })}
            className={inputClass(Boolean(errors.occupants))}
          />
        </Field>
        <Field label="Expected construction start" htmlFor={ids.start}>
          <select id={ids.start} value={value.constructionStartPeriod} onChange={(e) => onChange({ constructionStartPeriod: e.target.value })} className={inputClass()}>
            <option value="">Not decided yet</option>
            <option value="Within 6 months">Within 6 months</option>
            <option value="Within 12 months">Within 12 months</option>
            <option value="Within 18 months">Within 18 months</option>
            <option value="Within 2 years">Within 2 years</option>
            <option value="No specific timeline">No specific timeline</option>
          </select>
        </Field>
      </div>
    </div>
  );
}
