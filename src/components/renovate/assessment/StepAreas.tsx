"use client";

import { RENOVATION_AREA_LABELS, RENOVATION_STYLE_LABELS, RenovationAreaKey, RenovationStyle, SelectedRenovationArea } from "@/lib/renovate/types";
import { FormField, inputClass, Chip } from "./FormField";
import Select from "@/components/shared/Select";
import BudgetInput from "@/components/shared/BudgetInput";

interface Props {
  value: SelectedRenovationArea[];
  onChange: (areas: SelectedRenovationArea[]) => void;
  errors: Record<string, string>;
  /** The one style for the whole renovation, chosen here. */
  style: RenovationStyle | null;
  onStyleChange: (style: RenovationStyle | null) => void;
  /** What the person can spend on the renovation, in the currency they typed it in. */
  budget: number | null;
  budgetCurrency: string;
  onBudgetChange: (budget: number | null, currency: string) => void;
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

export default function StepAreas({ value, onChange, errors, style, onStyleChange, budget, budgetCurrency, onBudgetChange }: Props) {
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

      <FormField label="Style" optional>
        {(id) => (
          <Select id={id} value={style ?? ""} onChange={(e) => onStyleChange((e.target.value || null) as RenovationStyle | null)} className={`${inputClass} max-w-sm`}>
            <option value="">No preference</option>
            {Object.entries(RENOVATION_STYLE_LABELS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </Select>
        )}
      </FormField>

      <FormField label="Budget" optional>
        {(id) => <BudgetInput id={id} amount={budget} currency={budgetCurrency} onChange={onBudgetChange} placeholder="e.g. 8000000" inputClassName={`${inputClass} max-w-xs`} />}
      </FormField>

      {value.some((a) => a.areaKey === "custom") && (
        <div className="space-y-3">
          {value
            .filter((a) => a.areaKey === "custom")
            .map((area) => (
              <div key={area.id} className="flex items-center gap-3">
                <input value={area.customLabel ?? ""} onChange={(e) => updateArea(area.id, { customLabel: e.target.value })} placeholder="Name this area" aria-label="Name this area" className={`${inputClass} max-w-sm`} />
                <button type="button" onClick={() => removeArea(area.id)} className="text-xs font-bold text-red-500 hover:text-red-700">
                  Remove
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
