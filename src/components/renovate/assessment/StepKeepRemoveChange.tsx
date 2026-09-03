"use client";

import { useState } from "react";
import { KeepRemoveChangeItem, KeepRemoveChangeListType, PriorityLevel, PRIORITY_LABELS, RENOVATION_AREA_LABELS, SelectedRenovationArea } from "@/lib/renovate/types";
import { inputClass } from "./FormField";

interface Props {
  areas: SelectedRenovationArea[];
  items: KeepRemoveChangeItem[];
  onChange: (items: KeepRemoveChangeItem[]) => void;
}

const COLUMNS: { type: KeepRemoveChangeListType; label: string; accent: string; placeholder: string }[] = [
  { type: "keep", label: "Keep", accent: "text-[#2ec440]", placeholder: "e.g. Existing windows" },
  { type: "remove", label: "Remove", accent: "text-red-600", placeholder: "e.g. Old cabinets" },
  { type: "change", label: "Change", accent: "text-amber-600", placeholder: "e.g. Wall colour" },
];

function AddRow({ areaId, listType, onAdd }: { areaId: string; listType: KeepRemoveChangeListType; onAdd: (item: KeepRemoveChangeItem) => void }) {
  const [text, setText] = useState("");
  const submit = () => {
    if (!text.trim()) return;
    onAdd({
      id: `krc_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      areaId,
      listType,
      item: text.trim(),
      instruction: "",
      priority: "medium" as PriorityLevel,
      notes: "",
    });
    setText("");
  };
  return (
    <div className="flex gap-2 mt-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Add an item…"
        className={`${inputClass} text-xs py-2`}
      />
      <button type="button" onClick={submit} className="text-xs font-bold text-[#2ec440] hover:text-[#28b039] flex-shrink-0 px-2">
        Add
      </button>
    </div>
  );
}

export default function StepKeepRemoveChange({ areas, items, onChange }: Props) {
  const updateItem = (id: string, patch: Partial<KeepRemoveChangeItem>) => onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const removeItem = (id: string) => onChange(items.filter((i) => i.id !== id));

  if (areas.length === 0) {
    return <p className="text-slate-500 text-sm">Select renovation areas first to organise what to keep, remove and change.</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-slate-500 text-sm">For each area, list what should stay, what should go, and what should be changed.</p>

      {areas.map((area) => (
        <div key={area.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <h3 className="font-bold text-slate-900 mb-4">{area.customLabel || RENOVATION_AREA_LABELS[area.areaKey]}</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {COLUMNS.map((col) => {
              const colItems = items.filter((i) => i.areaId === area.id && i.listType === col.type);
              return (
                <div key={col.type} className="bg-white border border-slate-200 rounded-xl p-3.5">
                  <p className={`text-xs font-black uppercase tracking-wide mb-2 ${col.accent}`}>{col.label}</p>
                  <ul className="space-y-2">
                    {colItems.map((it) => (
                      <li key={it.id} className="flex items-start justify-between gap-2 text-sm">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{it.item}</p>
                          <select
                            value={it.priority}
                            onChange={(e) => updateItem(it.id, { priority: e.target.value as PriorityLevel })}
                            className="text-xs text-slate-500 bg-transparent border-0 p-0 focus:outline-none"
                          >
                            {Object.entries(PRIORITY_LABELS).map(([k, l]) => (
                              <option key={k} value={k}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button type="button" onClick={() => removeItem(it.id)} aria-label={`Remove ${it.item}`} className="text-slate-300 hover:text-red-500 flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <AddRow areaId={area.id} listType={col.type} onAdd={(item) => onChange([...items, item])} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
