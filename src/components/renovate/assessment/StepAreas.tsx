"use client";

import { PRIORITY_LABELS, PriorityLevel, RENOVATION_AREA_LABELS, RenovationAreaKey, SelectedRenovationArea } from "@/lib/renovate/types";
import { FormField, inputClass, Chip } from "./FormField";

interface Props {
  value: SelectedRenovationArea[];
  onChange: (areas: SelectedRenovationArea[]) => void;
  errors: Record<string, string>;
}

function newArea(areaKey: RenovationAreaKey): SelectedRenovationArea {
  return {
    id: `area_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    areaKey,
    currentUse: "",
    approxDimensions: "",
    mainProblem: "",
    desiredOutcome: "",
    priority: "medium",
    structuralChangesExpected: false,
    notes: "",
  };
}

export default function StepAreas({ value, onChange, errors }: Props) {
  const selectedKeys = new Set(value.map((a) => a.areaKey));

  const toggleArea = (key: RenovationAreaKey) => {
    if (selectedKeys.has(key) && key !== "custom") {
      onChange(value.filter((a) => a.areaKey !== key));
    } else {
      onChange([...value, newArea(key)]);
    }
  };

  const updateArea = (id: string, patch: Partial<SelectedRenovationArea>) => {
    onChange(value.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const removeArea = (id: string) => {
    onChange(value.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-slate-500 text-sm mb-3">Select every part of the property you&apos;d like to renovate.</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(RENOVATION_AREA_LABELS) as [RenovationAreaKey, string][]).map(([key, label]) => (
            <Chip key={key} selected={selectedKeys.has(key)} onClick={() => (key === "custom" ? onChange([...value, newArea(key)]) : toggleArea(key))}>
              {label}
            </Chip>
          ))}
        </div>
        {errors.areas && (
          <p className="text-red-600 text-sm font-semibold mt-2" role="alert">
            {errors.areas}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {value.map((area) => (
          <div key={area.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              {area.areaKey === "custom" ? (
                <input
                  value={area.customLabel ?? ""}
                  onChange={(e) => updateArea(area.id, { customLabel: e.target.value })}
                  placeholder="Name this area"
                  className="font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-[#2ec440] px-1"
                />
              ) : (
                <h3 className="font-bold text-slate-900">{RENOVATION_AREA_LABELS[area.areaKey]}</h3>
              )}
              <button type="button" onClick={() => removeArea(area.id)} className="text-xs font-bold text-red-500 hover:text-red-700">
                Remove
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Current use" optional>
                {(id) => <input id={id} value={area.currentUse} onChange={(e) => updateArea(area.id, { currentUse: e.target.value })} className={inputClass} />}
              </FormField>
              <FormField label="Approximate dimensions" optional hint="e.g. 4m x 3.5m">
                {(id) => <input id={id} value={area.approxDimensions} onChange={(e) => updateArea(area.id, { approxDimensions: e.target.value })} className={inputClass} />}
              </FormField>
              <FormField label="Main problem" optional>
                {(id) => <input id={id} value={area.mainProblem} onChange={(e) => updateArea(area.id, { mainProblem: e.target.value })} className={inputClass} />}
              </FormField>
              <FormField label="Desired outcome" optional>
                {(id) => <input id={id} value={area.desiredOutcome} onChange={(e) => updateArea(area.id, { desiredOutcome: e.target.value })} className={inputClass} />}
              </FormField>

              <FormField label="Priority">
                {(id) => (
                  <select id={id} value={area.priority} onChange={(e) => updateArea(area.id, { priority: e.target.value as PriorityLevel })} className={inputClass}>
                    {Object.entries(PRIORITY_LABELS).map(([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>

              <FormField label="Are structural changes expected?">
                {(id) => (
                  <select
                    id={id}
                    value={String(area.structuralChangesExpected)}
                    onChange={(e) => updateArea(area.id, { structuralChangesExpected: e.target.value === "unknown" ? "unknown" : e.target.value === "true" })}
                    className={inputClass}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                    <option value="unknown">Not sure</option>
                  </select>
                )}
              </FormField>
            </div>

            <FormField label="Notes" optional>
              {(id) => (
                <textarea
                  id={id}
                  value={area.notes}
                  onChange={(e) => updateArea(area.id, { notes: e.target.value })}
                  rows={2}
                  className={`${inputClass} resize-none mt-1.5`}
                />
              )}
            </FormField>
          </div>
        ))}
        {value.length === 0 && <p className="text-slate-400 text-sm text-center py-6">Select at least one area above to continue.</p>}
      </div>
    </div>
  );
}
