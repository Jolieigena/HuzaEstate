"use client";

import Image from "next/image";
import { RENOVATION_STYLE_LABELS, RenovationStyle, StylePreferences, UploadedFile } from "@/lib/renovate/types";
import { FormField, inputClass, Chip } from "./FormField";
import FileUploadList from "@/components/renovate/FileUploadList";

interface Props {
  value: StylePreferences;
  onChange: (patch: Partial<StylePreferences>) => void;
  inspirationFiles: UploadedFile[];
  onChangeInspirationFiles: (files: UploadedFile[]) => void;
}

const INSPIRATION_GALLERY = [
  { id: "local:hero-house.jpg", src: "/hero-house.jpg", label: "Warm neutral exterior" },
  { id: "local:hero-house-white.jpg", src: "/hero-house-white.jpg", label: "Bright minimal interior" },
  { id: "local:hero-house-final.jpg", src: "/hero-house-final.jpg", label: "Contemporary living space" },
  { id: "local:hero-house-spacious.jpg", src: "/hero-house-spacious.jpg", label: "Open, spacious layout" },
  { id: "local:hero-house-ai.jpg", src: "/hero-house-ai.jpg", label: "Modern finish direction" },
];

export default function StepStyle({ value, onChange, inspirationFiles, onChangeInspirationFiles }: Props) {
  const toggleSecondary = (style: RenovationStyle) => {
    const has = value.secondaryStyles.includes(style);
    onChange({ secondaryStyles: has ? value.secondaryStyles.filter((s) => s !== style) : [...value.secondaryStyles, style] });
  };

  const toggleInspiration = (id: string) => {
    const has = value.inspirationFileIds.includes(id);
    onChange({ inspirationFileIds: has ? value.inspirationFileIds.filter((i) => i !== id) : [...value.inspirationFileIds, id] });
  };

  return (
    <div className="space-y-6">
      <FormField label="Primary style">
        {(id) => (
          <select id={id} value={value.primaryStyle ?? ""} onChange={(e) => onChange({ primaryStyle: e.target.value as RenovationStyle })} className={`${inputClass} max-w-sm`}>
            <option value="" disabled>
              Choose a style
            </option>
            {Object.entries(RENOVATION_STYLE_LABELS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
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

      <div>
        <p className="text-sm font-bold text-slate-700 mb-3">Inspiration gallery</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {INSPIRATION_GALLERY.map((img) => {
            const selected = value.inspirationFileIds.includes(img.id);
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => toggleInspiration(img.id)}
                aria-pressed={selected}
                className={`relative h-24 rounded-xl overflow-hidden border-2 transition-colors ${selected ? "border-[#2ec440]" : "border-transparent"}`}
              >
                <Image src={img.src} alt={img.label} fill className="object-cover" sizes="120px" />
                {selected && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#2ec440] text-white flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-700 mb-2">Upload your own inspiration or mood board</p>
        <FileUploadList files={inspirationFiles} onChange={onChangeInspirationFiles} category="room_photo" helperText="JPG, JPEG, PNG or WEBP." />
      </div>
    </div>
  );
}
