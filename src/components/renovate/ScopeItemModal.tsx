"use client";

import { useId, useState, FormEvent } from "react";
import Dialog from "@/components/Dialog";
import { PRIORITY_LABELS, PriorityLevel, RenovationAreaKey, RENOVATION_AREA_LABELS, ScopeItem, SCOPE_WORK_CATEGORY_LABELS, ScopeWorkCategory } from "@/lib/renovate/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<ScopeItem, "id" | "sequence" | "status">) => void;
  areaOptions: RenovationAreaKey[];
  initial?: ScopeItem | null;
}

export default function ScopeItemModal({ open, onClose, onSubmit, areaOptions, initial }: Props) {
  const titleId = useId();
  const [areaKey, setAreaKey] = useState<RenovationAreaKey>(initial?.areaKey ?? areaOptions[0] ?? "living_room");
  const [category, setCategory] = useState<ScopeWorkCategory>(initial?.category ?? "preparation");
  const [task, setTask] = useState(initial?.task ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [quantity, setQuantity] = useState(initial?.quantity?.toString() ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [priority, setPriority] = useState<PriorityLevel>(initial?.priority ?? "medium");
  const [dependency, setDependency] = useState(initial?.dependency ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [professionalRequired, setProfessionalRequired] = useState(initial?.professionalRequired ?? false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;
    onSubmit({
      areaKey,
      category,
      task: task.trim(),
      description,
      quantity: quantity ? Number(quantity) : null,
      unit,
      priority,
      dependency,
      notes,
      professionalRequired,
      responsibility: professionalRequired ? "Licensed professional" : "Contractor",
    });
  };

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 id={titleId} className="text-xl font-black text-slate-900 mb-1">
          {initial ? "Edit scope item" : "Add scope item"}
        </h2>
        <p className="text-slate-500 text-sm mb-6">Quantities are indicative only.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="scope-area" className="block text-sm font-bold text-slate-700 mb-1.5">
              Area
            </label>
            <select id="scope-area" value={areaKey} onChange={(e) => setAreaKey(e.target.value as RenovationAreaKey)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200">
              {areaOptions.map((a) => (
                <option key={a} value={a}>
                  {RENOVATION_AREA_LABELS[a]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="scope-category" className="block text-sm font-bold text-slate-700 mb-1.5">
              Category
            </label>
            <select id="scope-category" value={category} onChange={(e) => setCategory(e.target.value as ScopeWorkCategory)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200">
              {Object.entries(SCOPE_WORK_CATEGORY_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="scope-task" className="block text-sm font-bold text-slate-700 mb-1.5">
              Task title <span className="text-red-500">*</span>
            </label>
            <input id="scope-task" value={task} onChange={(e) => setTask(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="scope-desc" className="block text-sm font-bold text-slate-700 mb-1.5">
              Description
            </label>
            <textarea id="scope-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 resize-none" />
          </div>
          <div>
            <label htmlFor="scope-qty" className="block text-sm font-bold text-slate-700 mb-1.5">
              Quantity (indicative)
            </label>
            <input id="scope-qty" type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
          </div>
          <div>
            <label htmlFor="scope-unit" className="block text-sm font-bold text-slate-700 mb-1.5">
              Unit
            </label>
            <input id="scope-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. sqm, item" className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
          </div>
          <div>
            <label htmlFor="scope-priority" className="block text-sm font-bold text-slate-700 mb-1.5">
              Priority
            </label>
            <select id="scope-priority" value={priority} onChange={(e) => setPriority(e.target.value as PriorityLevel)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200">
              {Object.entries(PRIORITY_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="scope-dependency" className="block text-sm font-bold text-slate-700 mb-1.5">
              Dependency
            </label>
            <input id="scope-dependency" value={dependency} onChange={(e) => setDependency(e.target.value)} placeholder="e.g. Requires demolition first" className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="scope-notes" className="block text-sm font-bold text-slate-700 mb-1.5">
              Notes
            </label>
            <input id="scope-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
          </div>
          <label className="sm:col-span-2 flex items-center gap-2.5 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={professionalRequired} onChange={(e) => setProfessionalRequired(e.target.checked)} className="w-4 h-4 rounded accent-[#2ec440]" />
            Professional review required for this task
          </label>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" className="px-5 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-[#2ec440] transition-colors shadow-lg">
            {initial ? "Save Changes" : "Add Task"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
