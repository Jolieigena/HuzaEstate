"use client";

import { useMemo, useState } from "react";
import { PRIORITY_LABELS, PriorityLevel, RENOVATION_AREA_LABELS, RenovationAreaKey, ScopeItem, SCOPE_WORK_CATEGORY_LABELS, ScopeWorkCategory } from "@/lib/renovate/types";

type GroupBy = "area" | "category";

interface Props {
  items: ScopeItem[];
  onEdit: (item: ScopeItem) => void;
  onDelete: (id: string) => void;
  onToggleExcluded: (id: string, excluded: boolean) => void;
  onTogglePriority: (id: string, priority: PriorityLevel) => void;
}

export default function ScopeTable({ items, onEdit, onDelete, onToggleExcluded, onTogglePriority }: Props) {
  const [groupBy, setGroupBy] = useState<GroupBy>("area");

  const groups = useMemo(() => {
    const map = new Map<string, ScopeItem[]>();
    for (const item of items) {
      const key = groupBy === "area" ? RENOVATION_AREA_LABELS[item.areaKey as RenovationAreaKey] ?? item.areaKey : SCOPE_WORK_CATEGORY_LABELS[item.category as ScopeWorkCategory];
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [items, groupBy]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Group by</span>
        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
          {(["area", "category"] as GroupBy[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroupBy(g)}
              className={`px-3 py-1.5 text-xs font-bold capitalize transition-colors ${groupBy === g ? "bg-[#2ec440]/10 text-[#2ec440]" : "bg-white text-slate-500"}`}
            >
              {g === "area" ? "Room" : "Work category"}
            </button>
          ))}
        </div>
      </div>

      {groups.map(([groupLabel, groupItems]) => (
        <div key={groupLabel} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">{groupLabel}</h3>
          </div>
          <ul className="divide-y divide-slate-50">
            {groupItems
              .sort((a, b) => a.sequence - b.sequence)
              .map((item) => (
                <li key={item.id} className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${item.status === "excluded" ? "opacity-50" : ""}`}>
                  <div className="flex-grow min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400">#{item.sequence}</span>
                      <p className="font-semibold text-slate-900">{item.task}</p>
                      {item.professionalRequired && <span className="text-[10px] font-bold uppercase bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Professional review</span>}
                      {item.status === "excluded" && <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Excluded</span>}
                    </div>
                    {item.description && <p className="text-sm text-slate-500 mb-1">{item.description}</p>}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                      {groupBy === "area" ? <span>{SCOPE_WORK_CATEGORY_LABELS[item.category]}</span> : <span>{RENOVATION_AREA_LABELS[item.areaKey]}</span>}
                      {item.quantity !== null && (
                        <span>
                          Qty (indicative): {item.quantity} {item.unit}
                        </span>
                      )}
                      {item.dependency && <span>Depends on: {item.dependency}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={item.priority}
                      onChange={(e) => onTogglePriority(item.id, e.target.value as PriorityLevel)}
                      className="text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5"
                    >
                      {Object.entries(PRIORITY_LABELS).map(([k, l]) => (
                        <option key={k} value={k}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={() => onToggleExcluded(item.id, item.status !== "excluded")} className="text-xs font-bold text-slate-500 hover:text-slate-800">
                      {item.status === "excluded" ? "Include" : "Exclude"}
                    </button>
                    <button type="button" onClick={() => onEdit(item)} className="text-xs font-bold text-[#2ec440] hover:text-[#28b039]">
                      Edit
                    </button>
                    <button type="button" onClick={() => onDelete(item.id)} className="text-xs font-bold text-red-500 hover:text-red-700">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
