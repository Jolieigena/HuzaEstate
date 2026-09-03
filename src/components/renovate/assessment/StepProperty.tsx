"use client";

import { RenovationPropertyInfo, OCCUPANCY_STATUS_LABELS, OccupancyStatus, PROPERTY_TYPE_LABELS, PropertyType } from "@/lib/renovate/types";
import { FormField, inputClass } from "./FormField";
import { StepErrors } from "@/lib/renovate/assessmentValidation";

interface Props {
  value: RenovationPropertyInfo;
  onChange: (patch: Partial<RenovationPropertyInfo>) => void;
  errors: StepErrors;
}

export default function StepProperty({ value, onChange, errors }: Props) {
  return (
    <div className="space-y-5">
      <p className="text-slate-500 text-sm">
        Confirm the details of the property being renovated. These were pre-filled from {value.source === "owned" ? "your saved property" : "the details you registered"} — adjust anything that needs updating.
      </p>

      <div className="grid sm:grid-cols-2 gap-5">
        <FormField label="Property name" error={errors.name}>
          {(id) => <input id={id} value={value.name} onChange={(e) => onChange({ name: e.target.value })} className={inputClass} />}
        </FormField>
        <FormField label="Property type" error={errors.propertyType}>
          {(id) => (
            <select id={id} value={value.propertyType ?? ""} onChange={(e) => onChange({ propertyType: e.target.value as PropertyType })} className={inputClass}>
              <option value="" disabled>
                Select a type
              </option>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField label="Location" error={errors.location}>
          {(id) => <input id={id} value={value.location} onChange={(e) => onChange({ location: e.target.value, address: e.target.value })} className={inputClass} />}
        </FormField>
        <FormField label="Approximate area (sqm)" optional>
          {(id) => (
            <input
              id={id}
              type="number"
              min={0}
              value={value.approxAreaSqm ?? ""}
              onChange={(e) => onChange({ approxAreaSqm: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          )}
        </FormField>

        <FormField label="Property age (construction year)" optional>
          {(id) => (
            <input
              id={id}
              type="number"
              min={1900}
              max={2100}
              value={value.constructionYear ?? ""}
              onChange={(e) => onChange({ constructionYear: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          )}
        </FormField>
        <FormField label="Number of floors" optional>
          {(id) => (
            <input id={id} type="number" min={1} value={value.floors ?? ""} onChange={(e) => onChange({ floors: e.target.value ? Number(e.target.value) : null })} className={inputClass} />
          )}
        </FormField>

        <FormField label="Occupancy status">
          {(id) => (
            <select id={id} value={value.occupancy ?? ""} onChange={(e) => onChange({ occupancy: e.target.value as OccupancyStatus })} className={inputClass}>
              <option value="" disabled>
                Select occupancy
              </option>
              {Object.entries(OCCUPANCY_STATUS_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <FormField label="Access information" optional hint="Gate codes, parking, lift access — anything a contractor would need to know.">
          {(id) => <input id={id} value={value.accessInfo} onChange={(e) => onChange({ accessInfo: e.target.value })} className={inputClass} />}
        </FormField>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <p className="font-bold text-slate-900 text-sm mb-3">Will the renovation happen while the property is occupied?</p>
        <div className="flex gap-3">
          {[
            { v: true, l: "Yes, it will remain occupied" },
            { v: false, l: "No, it will be vacant" },
          ].map((opt) => (
            <button
              key={String(opt.v)}
              type="button"
              onClick={() => onChange({ willBeOccupiedDuringRenovation: opt.v })}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                value.willBeOccupiedDuringRenovation === opt.v ? "bg-[#2ec440]/10 border-[#2ec440] text-[#2ec440]" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
