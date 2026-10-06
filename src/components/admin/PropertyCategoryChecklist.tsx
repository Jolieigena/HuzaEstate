"use client";

import MultiSelectCombobox from "@/components/shared/MultiSelectCombobox";
import { PROPERTY_CATEGORY_GROUPS } from "@/lib/admin/propertyCategories";

/** Searchable picker for the property types an organisation handles, drawn from the full list
 *  sellers post under (houses, villas, condos, land, commercial...). Choosing nothing means every
 *  category, which the hint says out loud so an empty selection is never ambiguous. Quick buttons add
 *  a whole group at once. */
export default function PropertyCategoryChecklist({ selected, onChange }: { selected: string[]; onChange: (next: string[]) => void }) {
  const addGroup = (options: string[]) => onChange(Array.from(new Set([...selected, ...options])));
  return (
    <div>
      <MultiSelectCombobox value={selected} onChange={onChange} groups={PROPERTY_CATEGORY_GROUPS} allowCustom={false} placeholder="Search property types, or leave empty for all…" ariaLabel="Property categories" />
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-xs font-medium text-slate-400">Add all:</span>
        {PROPERTY_CATEGORY_GROUPS.map((group) => (
          <button key={group.label} type="button" onClick={() => addGroup(group.options)} className="text-xs font-bold text-[#219b31] hover:underline">
            {group.label}
          </button>
        ))}
        {selected.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="ml-auto text-xs font-bold text-slate-500 hover:underline">
            Clear
          </button>
        )}
      </div>
      <p className="mt-2 text-xs font-medium text-slate-400">{selected.length === 0 ? "Nothing chosen: the organisation handles every category." : "Only listings of the chosen types are visible to this organisation."}</p>
    </div>
  );
}
