"use client";

import { useId } from "react";
import Image from "next/image";
import { HOME_STYLE_LABELS, HomeStyle, StyleBrief } from "@/lib/build/types";
import { StepErrors } from "@/lib/build/briefValidation";
import { Field, inputClass, Toggle } from "./FormField";
import FileUploadList from "@/components/build/FileUploadList";

const INSPIRATION_GALLERY = [
  { id: "insp-1", src: "/hero-house.jpg", label: "Modern family home" },
  { id: "insp-2", src: "/hero-house-final.jpg", label: "Contemporary African" },
  { id: "insp-3", src: "/hero-house-white.jpg", label: "Compact urban" },
  { id: "insp-4", src: "/hero-house-ai.jpg", label: "Luxury villa" },
  { id: "insp-5", src: "/hero-house-spacious.jpg", label: "Eco-conscious" },
  { id: "insp-6", src: "/hero-house.png", label: "Affordable starter" },
];

const THREE_LEVEL: { key: "high" | "medium" | "low"; label: string }[] = [
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

export default function BriefStepStyle({ value, onChange, errors }: { value: StyleBrief; onChange: (patch: Partial<StyleBrief>) => void; errors: StepErrors }) {
  const ids = { roof: useId(), extColours: useId(), intColours: useId(), windows: useId(), materials: useId(), avoid: useId() };

  const toggleSecondary = (style: HomeStyle) => {
    const has = value.secondaryStyles.includes(style);
    onChange({ secondaryStyles: has ? value.secondaryStyles.filter((s) => s !== style) : [...value.secondaryStyles, style] });
  };

  const toggleInspiration = (id: string) => {
    const has = value.inspirationImageIds.includes(id);
    onChange({ inspirationImageIds: has ? value.inspirationImageIds.filter((i) => i !== id) : [...value.inspirationImageIds, id] });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-slate-700 mb-1">
          Primary style direction <span className="text-red-500">*</span>
        </p>
        {errors.primaryStyle && (
          <p className="text-red-600 text-xs font-semibold mb-2" role="alert">
            {errors.primaryStyle}
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.entries(HOME_STYLE_LABELS) as [HomeStyle, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ primaryStyle: key })}
              aria-pressed={value.primaryStyle === key}
              className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-colors text-left ${
                value.primaryStyle === key ? "bg-[#2ec440]/10 border-[#2ec440] text-[#2ec440]" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-700 mb-2">Other directions you like (optional)</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(HOME_STYLE_LABELS) as [HomeStyle, string][])
            .filter(([key]) => key !== value.primaryStyle)
            .map(([key, label]) => (
              <Toggle key={key} pressed={value.secondaryStyles.includes(key)} onClick={() => toggleSecondary(key)}>
                {label}
              </Toggle>
            ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Roof style" htmlFor={ids.roof}>
          <input id={ids.roof} type="text" value={value.roofStyle} onChange={(e) => onChange({ roofStyle: e.target.value })} className={inputClass()} placeholder="e.g. Low-pitch contemporary" />
        </Field>
        <Field label="Window style" htmlFor={ids.windows}>
          <input id={ids.windows} type="text" value={value.windowStyle} onChange={(e) => onChange({ windowStyle: e.target.value })} className={inputClass()} placeholder="e.g. Large aluminium-framed" />
        </Field>
        <Field label="Exterior colours" htmlFor={ids.extColours}>
          <input id={ids.extColours} type="text" value={value.exteriorColours} onChange={(e) => onChange({ exteriorColours: e.target.value })} className={inputClass()} />
        </Field>
        <Field label="Interior colours" htmlFor={ids.intColours}>
          <input id={ids.intColours} type="text" value={value.interiorColours} onChange={(e) => onChange({ interiorColours: e.target.value })} className={inputClass()} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Natural light priority</p>
          <div className="flex gap-2">
            {THREE_LEVEL.map((opt) => (
              <Toggle key={opt.key} pressed={value.naturalLightPriority === opt.key} onClick={() => onChange({ naturalLightPriority: opt.key })}>
                {opt.label}
              </Toggle>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Privacy priority</p>
          <div className="flex gap-2">
            {THREE_LEVEL.map((opt) => (
              <Toggle key={opt.key} pressed={value.privacyPriority === opt.key} onClick={() => onChange({ privacyPriority: opt.key })}>
                {opt.label}
              </Toggle>
            ))}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Layout preference</p>
          <div className="flex flex-wrap gap-2">
            <Toggle pressed={value.layoutPreference === "open_plan"} onClick={() => onChange({ layoutPreference: "open_plan" })}>
              Open-plan
            </Toggle>
            <Toggle pressed={value.layoutPreference === "separated"} onClick={() => onChange({ layoutPreference: "separated" })}>
              Separated rooms
            </Toggle>
            <Toggle pressed={value.layoutPreference === "mixed"} onClick={() => onChange({ layoutPreference: "mixed" })}>
              A mix of both
            </Toggle>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Indoor-outdoor connection</p>
          <div className="flex gap-2">
            {THREE_LEVEL.map((opt) => (
              <Toggle key={opt.key} pressed={value.indoorOutdoorConnection === opt.key} onClick={() => onChange({ indoorOutdoorConnection: opt.key })}>
                {opt.label}
              </Toggle>
            ))}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Preferred materials" htmlFor={ids.materials}>
          <input id={ids.materials} type="text" value={value.preferredMaterials} onChange={(e) => onChange({ preferredMaterials: e.target.value })} className={inputClass()} placeholder="e.g. Fired clay brick, timber accents" />
        </Field>
        <Field label="Materials to avoid" htmlFor={ids.avoid}>
          <input id={ids.avoid} type="text" value={value.materialsToAvoid} onChange={(e) => onChange({ materialsToAvoid: e.target.value })} className={inputClass()} />
        </Field>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-700 mb-1">Inspiration gallery</p>
        <p className="text-xs text-slate-400 mb-3">Selecting an image marks it as a reference for Huza AI — not a design that will be copied exactly.</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {INSPIRATION_GALLERY.map((img) => {
            const selected = value.inspirationImageIds.includes(img.id);
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => toggleInspiration(img.id)}
                aria-pressed={selected}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${selected ? "border-[#2ec440]" : "border-transparent hover:border-slate-300"}`}
              >
                <Image src={img.src} alt={img.label} fill className="object-cover" sizes="120px" />
                {selected && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#2ec440] text-white flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 bg-slate-900/70 text-white text-[10px] font-semibold px-1.5 py-1 truncate">{img.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-700 mb-2">Upload your own inspiration, sketches or mood boards</p>
        <FileUploadList files={value.inspirationFiles} onChange={(files) => onChange({ inspirationFiles: files })} category="inspiration" />
      </div>
    </div>
  );
}
