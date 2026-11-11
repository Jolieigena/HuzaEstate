"use client";

import { RENOVATION_STYLE_LABELS, RenovationStyle, StylePreferences } from "@/lib/renovate/types";
import { FormField, inputClass, Chip } from "./FormField";
import Select from "@/components/shared/Select";

interface Props {
  value: StylePreferences;
  onChange: (patch: Partial<StylePreferences>) => void;
}

export default function StepStyle({ value, onChange }: Props) {
  const toggleSecondary = (style: RenovationStyle) => {
    const has = value.secondaryStyles.includes(style);
    onChange({ secondaryStyles: has ? value.secondaryStyles.filter((s) => s !== style) : [...value.secondaryStyles, style] });
  };

  return (
    <div className="space-y-6">
      <FormField label="Primary style">
        {(id) => (
          <Select id={id} value={value.primaryStyle ?? ""} onChange={(e) => onChange({ primaryStyle: e.target.value as RenovationStyle })} className={`${inputClass} max-w-sm`}>
            <option value="" disabled>
              Choose a style
            </option>
            {Object.entries(RENOVATION_STYLE_LABELS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </Select>
        )}
      </FormField>

      <div>
        <p className="text-sm font-bold text-slate-700 mb-2">Secondary influences</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(RENOVATION_STYLE_LABELS) as [RenovationStyle, string][])
            .filter(([k]) => k !== value.primaryStyle)
            .map(([k, l]) => (
              <Chip key={k} selected={value.secondaryStyles.includes(k)} onClick={() => toggleSecondary(k)}>
                {l}
              </Chip>
            ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <FormField label="Preferred colours" optional>
          {(id) => <input id={id} value={value.preferredColours} onChange={(e) => onChange({ preferredColours: e.target.value })} className={inputClass} />}
        </FormField>
        <FormField label="Colours to avoid" optional>
          {(id) => <input id={id} value={value.coloursToAvoid} onChange={(e) => onChange({ coloursToAvoid: e.target.value })} className={inputClass} />}
        </FormField>
        <FormField label="Materials to use" optional>
          {(id) => <input id={id} value={value.materialsToUse} onChange={(e) => onChange({ materialsToUse: e.target.value })} className={inputClass} />}
        </FormField>
        <FormField label="Materials to avoid" optional>
          {(id) => <input id={id} value={value.materialsToAvoid} onChange={(e) => onChange({ materialsToAvoid: e.target.value })} className={inputClass} />}
        </FormField>
        <FormField label="Lighting preference" optional>
          {(id) => <input id={id} value={value.lightingPreference} onChange={(e) => onChange({ lightingPreference: e.target.value })} className={inputClass} />}
        </FormField>
        <FormField label="Furniture preference" optional>
          {(id) => <input id={id} value={value.furniturePreference} onChange={(e) => onChange({ furniturePreference: e.target.value })} className={inputClass} />}
        </FormField>
        <FormField label="Storage preference" optional>
          {(id) => <input id={id} value={value.storagePreference} onChange={(e) => onChange({ storagePreference: e.target.value })} className={inputClass} />}
        </FormField>
        <FormField label="Maintenance preference" optional>
          {(id) => <input id={id} value={value.maintenancePreference} onChange={(e) => onChange({ maintenancePreference: e.target.value })} className={inputClass} />}
        </FormField>
      </div>

      <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
        <input type="checkbox" checked={value.localMaterialPreference} onChange={(e) => onChange({ localMaterialPreference: e.target.checked })} className="w-4 h-4 rounded accent-[#2ec440]" />
        Prefer locally available materials
      </label>
    </div>
  );
}
