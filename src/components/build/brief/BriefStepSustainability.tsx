"use client";

import { AccessibilityBrief, PreferenceItem, PriorityLevel, SustainabilityBrief } from "@/lib/build/types";

const PRIORITY_OPTIONS: { key: PriorityLevel; label: string }[] = [
  { key: "required", label: "Required" },
  { key: "preferred", label: "Preferred" },
  { key: "optional", label: "Optional" },
];

function PreferenceRow({ item, onChange }: { item: PreferenceItem; onChange: (priority: PriorityLevel | null) => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-slate-100 last:border-b-0">
      <span className="text-sm font-semibold text-slate-800">{item.label}</span>
      <div className="flex gap-1.5 flex-wrap">
        {PRIORITY_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(item.priority === opt.key ? null : opt.key)}
            aria-pressed={item.priority === opt.key}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              item.priority === opt.key ? "bg-[#2ec440]/10 border-[#2ec440] text-[#2ec440]" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BriefStepSustainability({
  sustainability,
  accessibility,
  onChangeSustainability,
  onChangeAccessibility,
}: {
  sustainability: SustainabilityBrief;
  accessibility: AccessibilityBrief;
  onChangeSustainability: (patch: Partial<SustainabilityBrief>) => void;
  onChangeAccessibility: (patch: Partial<AccessibilityBrief>) => void;
}) {
  const updateItem = (items: PreferenceItem[], key: string, priority: PriorityLevel | null): PreferenceItem[] =>
    items.map((i) => (i.key === key ? { ...i, priority } : i));

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-bold text-slate-900 mb-1">Sustainability preferences</h3>
        <p className="text-xs text-slate-400 mb-3">Mark how important each is to you — this helps Huza AI balance them against budget and space.</p>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5">
          {sustainability.items.map((item) => (
            <PreferenceRow key={item.key} item={item} onChange={(priority) => onChangeSustainability({ items: updateItem(sustainability.items, item.key, priority) })} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-slate-900 mb-1">Accessibility preferences</h3>
        <p className="text-xs text-slate-400 mb-3">These help make the home comfortable for all household members, including elderly relatives, children or visitors.</p>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5">
          {accessibility.items.map((item) => (
            <PreferenceRow key={item.key} item={item} onChange={(priority) => onChangeAccessibility({ items: updateItem(accessibility.items, item.key, priority) })} />
          ))}
        </div>
      </div>
    </div>
  );
}
