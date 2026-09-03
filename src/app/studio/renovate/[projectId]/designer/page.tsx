"use client";

import { useState } from "react";
import Image from "next/image";
import { useRenovationProjectContext } from "@/components/renovate/RenovationProjectContext";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { newId } from "@/lib/renovate/factory";
import {
  ManualDesignArea,
  ManualRenovationDesign,
  MATERIAL_CATEGORIES,
  MATERIAL_CATEGORY_LABELS,
  MaterialCategory,
  MoodBoardItem,
  RENOVATION_AREA_LABELS,
} from "@/lib/renovate/types";
import { useToast } from "@/lib/toast-context";
import PromptModal from "@/components/shared/PromptModal";
import ConfirmModal from "@/components/shared/ConfirmModal";

const SWATCH_IMAGES = ["/hero-house.jpg", "/hero-house-white.jpg", "/hero-house-final.jpg", "/hero-house-spacious.jpg", "/hero-house-ai.jpg", "/hero-house.png"];

function emptyDesignArea(areaKey: ManualDesignArea["areaKey"], label: string): ManualDesignArea {
  return {
    id: newId("mdarea"),
    areaKey,
    label,
    wallFinish: "",
    floorMaterial: "",
    ceilingTreatment: "",
    lightingDirection: "",
    cabinetFinish: "",
    fixtureStyle: "",
    notes: "",
    keepItems: [],
    removeItems: [],
    replaceItems: [],
    moodBoard: [],
  };
}

function cloneDesign(d: ManualRenovationDesign): ManualRenovationDesign {
  return JSON.parse(JSON.stringify(d));
}

export default function DesignerPage() {
  const project = useRenovationProjectContext();
  const { showToast } = useToast();

  const [design, setDesign] = useState<ManualRenovationDesign>(() => cloneDesign(project.manualDesign));
  const [altB, setAltB] = useState<ManualRenovationDesign | null>(null);
  const [activeAlt, setActiveAlt] = useState<"A" | "B">("A");
  const [history, setHistory] = useState<ManualRenovationDesign[]>(() => [cloneDesign(project.manualDesign)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(design.areas[0]?.id ?? null);
  const [saveVersionOpen, setSaveVersionOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState<"none" | "materials">("none");

  const activeDesign = activeAlt === "A" ? design : altB ?? design;
  const selectedArea = activeDesign.areas.find((a) => a.id === selectedAreaId) ?? activeDesign.areas[0] ?? null;

  const pushHistory = (next: ManualRenovationDesign) => {
    const truncated = history.slice(0, historyIndex + 1);
    const updated = [...truncated, next];
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
  };

  const updateActiveDesign = (next: ManualRenovationDesign) => {
    if (activeAlt === "A") {
      setDesign(next);
      pushHistory(next);
    } else {
      setAltB(next);
    }
  };

  const updateArea = (areaId: string, patch: Partial<ManualDesignArea>) => {
    updateActiveDesign({ ...activeDesign, areas: activeDesign.areas.map((a) => (a.id === areaId ? { ...a, ...patch } : a)) });
  };

  const addArea = (areaKey: ManualDesignArea["areaKey"]) => {
    const label = RENOVATION_AREA_LABELS[areaKey];
    const newArea = emptyDesignArea(areaKey, label);
    updateActiveDesign({ ...activeDesign, areas: [...activeDesign.areas, newArea] });
    setSelectedAreaId(newArea.id);
  };

  const addMaterialSwatch = (category: MaterialCategory) => {
    if (!selectedArea) return;
    const item: MoodBoardItem = {
      id: newId("mood"),
      label: MATERIAL_CATEGORY_LABELS[category],
      imageUrl: SWATCH_IMAGES[activeDesign.areas.indexOf(selectedArea) % SWATCH_IMAGES.length],
      category,
      order: selectedArea.moodBoard.length,
    };
    updateArea(selectedArea.id, { moodBoard: [...selectedArea.moodBoard, item] });
  };

  const reorderMoodItem = (itemId: string, direction: -1 | 1) => {
    if (!selectedArea) return;
    const items = [...selectedArea.moodBoard];
    const idx = items.findIndex((i) => i.id === itemId);
    const target = idx + direction;
    if (target < 0 || target >= items.length) return;
    [items[idx], items[target]] = [items[target], items[idx]];
    updateArea(selectedArea.id, { moodBoard: items.map((it, i) => ({ ...it, order: i })) });
  };

  const removeMoodItem = (itemId: string) => {
    if (!selectedArea) return;
    updateArea(selectedArea.id, { moodBoard: selectedArea.moodBoard.filter((i) => i.id !== itemId) });
  };

  const undo = () => {
    if (historyIndex === 0) return;
    setHistoryIndex(historyIndex - 1);
    setDesign(history[historyIndex - 1]);
  };
  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    setHistoryIndex(historyIndex + 1);
    setDesign(history[historyIndex + 1]);
  };

  const handleSave = () => {
    RenovationProjectService.saveManualDesign(project.id, design, "Updated manual renovation plan.");
    showToast("Plan saved.");
  };

  const availableAreaKeys = project.assessment.areas.filter((a) => !design.areas.some((d) => d.areaKey === a.areaKey)).map((a) => a.areaKey);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={undo} disabled={historyIndex === 0} className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-40">
            Undo
          </button>
          <button type="button" onClick={redo} disabled={historyIndex >= history.length - 1} className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-40">
            Redo
          </button>
          <button
            type="button"
            onClick={() =>
              showToast(
                selectedArea
                  ? `Huza AI suggestion: consider a ${["warmer", "cooler", "more neutral"][activeDesign.areas.indexOf(selectedArea) % 3]} palette and locally available materials for ${selectedArea.label.toLowerCase()}.`
                  : "Select an area first.",
                "info"
              )
            }
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600"
          >
            Ask Huza AI for Suggestions
          </button>
        </div>
        <div className="flex items-center gap-2">
          {altB && (
            <button type="button" onClick={() => setCompareOpen(true)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600">
              Compare Alternatives
            </button>
          )}
          <button type="button" onClick={handleSave} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-700">
            Save
          </button>
          <button type="button" onClick={() => setSaveVersionOpen(true)} className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-[#2ec440] text-white text-sm font-bold transition-colors">
            Save as New Version
          </button>
        </div>
      </div>

      {altB && (
        <div className="flex gap-2">
          {(["A", "B"] as const).map((alt) => (
            <button
              key={alt}
              type="button"
              onClick={() => setActiveAlt(alt)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${activeAlt === alt ? "bg-[#2ec440]/10 border-[#2ec440] text-[#2ec440]" : "bg-white border-slate-200 text-slate-600"}`}
            >
              Alternative {alt}
            </button>
          ))}
        </div>
      )}

      <div className="lg:hidden bg-white border border-slate-100 rounded-2xl shadow-sm p-4 space-y-3">
        <label htmlFor="mobile-area" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
          Room / area
        </label>
        <select id="mobile-area" value={selectedAreaId ?? ""} onChange={(e) => setSelectedAreaId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm">
          {activeDesign.areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setMobileDrawer(mobileDrawer === "materials" ? "none" : "materials")} className="w-full bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl text-sm">
          {mobileDrawer === "materials" ? "Hide materials" : "Show materials"}
        </button>
        <p className="text-xs text-slate-400 text-center">For detailed arranging, a larger screen works best.</p>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr_280px] gap-4">
        <aside className="hidden lg:block bg-white border border-slate-100 rounded-2xl shadow-sm p-4 space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Areas</p>
          {activeDesign.areas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelectedAreaId(a.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${selectedAreaId === a.id ? "bg-[#2ec440]/10 text-[#2ec440]" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {a.label}
            </button>
          ))}
          {availableAreaKeys.length > 0 && (
            <div className="pt-3 border-t border-slate-100 mt-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Add area</p>
              {availableAreaKeys.map((k) => (
                <button key={k} type="button" onClick={() => addArea(k)} className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50">
                  + {RENOVATION_AREA_LABELS[k]}
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          {!selectedArea ? (
            <p className="text-slate-500 text-sm text-center py-16">Select or add an area to start your mood board.</p>
          ) : (
            <>
              <h2 className="font-bold text-slate-900 mb-4">{selectedArea.label} mood board</h2>
              {selectedArea.moodBoard.length === 0 ? (
                <p className="text-slate-400 text-sm mb-4">No items yet — add materials from the panel to build a mood board.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {selectedArea.moodBoard
                    .sort((a, b) => a.order - b.order)
                    .map((item) => (
                      <div key={item.id} className="relative rounded-xl overflow-hidden border border-slate-200">
                        <div className="relative h-24">
                          <Image src={item.imageUrl} alt={item.label} fill className="object-cover" sizes="150px" />
                        </div>
                        <div className="p-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700 truncate">{item.label}</span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button type="button" onClick={() => reorderMoodItem(item.id, -1)} aria-label="Move earlier" className="text-slate-400 hover:text-slate-700">
                              ‹
                            </button>
                            <button type="button" onClick={() => reorderMoodItem(item.id, 1)} aria-label="Move later" className="text-slate-400 hover:text-slate-700">
                              ›
                            </button>
                            <button type="button" onClick={() => removeMoodItem(item.id)} aria-label={`Remove ${item.label}`} className="text-slate-400 hover:text-red-500">
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
                {(["wallFinish", "floorMaterial", "ceilingTreatment", "lightingDirection", "cabinetFinish", "fixtureStyle"] as const).map((field) => (
                  <div key={field}>
                    <label htmlFor={`field-${field}`} className="block text-xs font-bold text-slate-500 mb-1 capitalize">
                      {field.replace(/([A-Z])/g, " $1")}
                    </label>
                    <input
                      id={`field-${field}`}
                      value={selectedArea[field]}
                      onChange={(e) => updateArea(selectedArea.id, { [field]: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                {(["keepItems", "removeItems", "replaceItems"] as const).map((listKey) => (
                  <div key={listKey}>
                    <label htmlFor={`list-${listKey}`} className="block text-xs font-bold text-slate-500 mb-1 capitalize">
                      {listKey.replace("Items", "")} items (comma separated)
                    </label>
                    <input
                      id={`list-${listKey}`}
                      value={selectedArea[listKey].join(", ")}
                      onChange={(e) => updateArea(selectedArea.id, { [listKey]: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                ))}
              </div>

              <label htmlFor="area-notes" className="block text-xs font-bold text-slate-500 mt-3 mb-1">
                Notes
              </label>
              <textarea
                id="area-notes"
                value={selectedArea.notes}
                onChange={(e) => updateArea(selectedArea.id, { notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none"
              />
            </>
          )}
        </section>

        <aside className={`bg-white border border-slate-100 rounded-2xl shadow-sm p-4 ${mobileDrawer === "materials" ? "block" : "hidden"} lg:block`}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Materials</p>
          <div className="grid grid-cols-2 gap-2">
            {MATERIAL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => addMaterialSwatch(cat)}
                disabled={!selectedArea}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-slate-200 hover:border-[#2ec440] transition-colors disabled:opacity-40"
              >
                <div className="relative w-full h-12 rounded-lg overflow-hidden">
                  <Image src={SWATCH_IMAGES[MATERIAL_CATEGORIES.indexOf(cat) % SWATCH_IMAGES.length]} alt="" fill className="object-cover" sizes="100px" />
                </div>
                <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight">{MATERIAL_CATEGORY_LABELS[cat]}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Labelled swatches for planning only — not a live materials catalogue or stock availability.</p>

          {!altB && (
            <button
              type="button"
              onClick={() => {
                setAltB(cloneDesign(design));
                setActiveAlt("B");
                showToast("Alternative B created from the current plan.");
              }}
              className="w-full mt-4 text-xs font-bold text-[#2ec440] hover:text-[#28b039]"
            >
              + Create Alternative B
            </button>
          )}
        </aside>
      </div>

      <PromptModal
        open={saveVersionOpen}
        onClose={() => setSaveVersionOpen(false)}
        title="Save as new version"
        label="Change summary"
        placeholder="e.g. Updated kitchen mood board with warmer tones"
        submitLabel="Save Version"
        onSubmit={(summary) => {
          RenovationProjectService.saveManualDesign(project.id, design, summary || "Manual plan update.", true);
          setSaveVersionOpen(false);
          showToast("Saved as a new version.");
        }}
      />

      <ConfirmModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        title="Comparing Alternative A and B"
        confirmLabel="Close"
        description={
          <div className="text-left space-y-2">
            <p>
              Alternative A: {design.areas.length} area{design.areas.length === 1 ? "" : "s"}, {design.areas.reduce((s, a) => s + a.moodBoard.length, 0)} mood-board items.
            </p>
            <p>
              Alternative B: {altB?.areas.length ?? 0} area{(altB?.areas.length ?? 0) === 1 ? "" : "s"}, {altB?.areas.reduce((s, a) => s + a.moodBoard.length, 0) ?? 0} mood-board items.
            </p>
          </div>
        }
        onConfirm={() => setCompareOpen(false)}
      />
    </div>
  );
}
