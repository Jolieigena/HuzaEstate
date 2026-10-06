"use client";

import { PROPERTY_CATEGORY_OPTIONS } from "@/lib/admin/propertyCategories";

/** Toggle chips for the property categories an organisation handles. Choosing none means every
 *  category, which the hint under the chips says out loud so an empty selection isn't ambiguous. */
export default function PropertyCategoryChecklist({ selected, onToggle }: { selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Property categories">
        {PROPERTY_CATEGORY_OPTIONS.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(option.value)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs font-medium text-slate-400">{selected.length === 0 ? "Nothing chosen: the organisation handles every category." : "Only listings in the chosen categories are visible to this organisation."}</p>
    </div>
  );
}
