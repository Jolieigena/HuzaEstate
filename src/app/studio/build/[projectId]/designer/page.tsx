"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";
import { BuildProjectService } from "@/lib/build/projectService";
import { DESIGN_TEMPLATES } from "@/lib/build/templates";
import { newId } from "@/lib/build/factory";
import { validateManualDesign } from "@/lib/build/designerValidation";
import { ManualDesign, ManualFloor, ManualRoom, ManualRoomType, MANUAL_ROOM_TYPE_LABELS } from "@/lib/build/types";
import { useToast } from "@/lib/toast-context";
import FloorPlanSvg from "@/components/build/FloorPlanSvg";
import Dialog from "@/components/Dialog";
import ConfirmModal from "@/components/shared/ConfirmModal";
import PromptModal from "@/components/shared/PromptModal";

const ROOM_LIBRARY = Object.entries(MANUAL_ROOM_TYPE_LABELS) as [ManualRoomType, string][];

const SUGGESTIONS = [
  { id: "add-staircase", label: "Add a staircase for circulation", apply: (d: ManualDesign) => addRoomToFirstFloor(d, "staircase", "Staircase", 6) },
  { id: "add-hallway", label: "Widen circulation with a hallway", apply: (d: ManualDesign) => addRoomToFirstFloor(d, "hallway", "Hallway", 4) },
  { id: "balance-sizes", label: "Balance room sizes slightly", apply: (d: ManualDesign) => balanceRoomSizes(d) },
];

function addRoomToFirstFloor(design: ManualDesign, type: ManualRoomType, name: string, areaSqm: number): ManualDesign {
  if (design.floors.length === 0) return design;
  const floor = design.floors[0];
  const maxY = floor.rooms.length ? Math.max(...floor.rooms.map((r) => r.y + r.h)) : 0;
  const w = Math.max(2.5, Math.sqrt(areaSqm * 1.3));
  const h = areaSqm / w;
  const newRoom: ManualRoom = { id: newId("room"), type, name, x: 0, y: maxY, w, h };
  return { ...design, floors: design.floors.map((f, i) => (i === 0 ? { ...f, rooms: [...f.rooms, newRoom] } : f)) };
}

function balanceRoomSizes(design: ManualDesign): ManualDesign {
  return {
    ...design,
    floors: design.floors.map((f) => ({
      ...f,
      rooms: f.rooms.map((r) => {
        const area = r.w * r.h;
        const targetArea = Math.max(area * 0.9, 6);
        const w = Math.max(2, Math.sqrt(targetArea * 1.3));
        const h = targetArea / w;
        return { ...r, w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10 };
      }),
    })),
  };
}

export default function DesignerPage() {
  return (
    <Suspense fallback={<div className="h-96 bg-white border border-slate-100 rounded-2xl animate-pulse" />}>
      <DesignerContent />
    </Suspense>
  );
}

function DesignerContent() {
  const project = useBuildProjectContext();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const fromConceptId = searchParams?.get("fromConcept");
  const pickTemplateParam = searchParams?.get("pickTemplate");

  // Resolved once, at mount, to seed initial state below — never read again
  // after that, so a concept generated after this page loads won't retroactively
  // change what "coming from a concept" meant when the designer was opened.
  const fromConcept = fromConceptId ? project.concepts.find((c) => c.id === fromConceptId) : undefined;
  const shouldAutoApplyConcept = Boolean(fromConcept) && project.manualDesign.floors.length === 0;
  const shouldPromptConceptReplace = Boolean(fromConcept) && project.manualDesign.floors.length > 0;
  const initialDesign: ManualDesign = shouldAutoApplyConcept && fromConcept ? { floors: fromConcept.floors } : project.manualDesign;

  const [design, setDesign] = useState<ManualDesign>(() => initialDesign);
  const [history, setHistory] = useState<ManualDesign[]>(() => [initialDesign]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(() => initialDesign.floors[0]?.id ?? null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [dirty, setDirty] = useState(shouldAutoApplyConcept);
  const [templateModalOpen, setTemplateModalOpen] = useState(Boolean(pickTemplateParam));
  const [pendingReplace, setPendingReplace] = useState<{ kind: "template"; id: string } | { kind: "concept" } | null>(() => (shouldPromptConceptReplace ? { kind: "concept" } : null));
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [addFloorOpen, setAddFloorOpen] = useState(false);
  const [renameFloorOpen, setRenameFloorOpen] = useState(false);
  const [saveVersionOpen, setSaveVersionOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const commit = (next: ManualDesign) => {
    const truncated = history.slice(0, historyIndex + 1);
    const nextHistory = [...truncated, next];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setDesign(next);
    setDirty(true);
  };

  const applyLive = (next: ManualDesign) => setDesign(next);

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

  const selectedFloor = design.floors.find((f) => f.id === selectedFloorId) ?? design.floors[0] ?? null;
  const selectedRoom = selectedFloor?.rooms.find((r) => r.id === selectedRoomId) ?? null;
  const warnings = validateManualDesign(design, project.brief.plot.areaSqm);

  const addFloor = (name: string) => {
    const newFloor: ManualFloor = { id: newId("floor"), name, level: design.floors.length, rooms: [] };
    const next = { ...design, floors: [...design.floors, newFloor] };
    commit(next);
    setSelectedFloorId(newFloor.id);
    setAddFloorOpen(false);
  };

  const renameFloor = (name: string) => {
    if (!selectedFloor) return;
    const next = { ...design, floors: design.floors.map((f) => (f.id === selectedFloor.id ? { ...f, name } : f)) };
    commit(next);
    setRenameFloorOpen(false);
  };

  const deleteFloor = () => {
    if (!selectedFloor || selectedFloor.rooms.length > 0) return;
    const next = { ...design, floors: design.floors.filter((f) => f.id !== selectedFloor.id) };
    commit(next);
    setSelectedFloorId(next.floors[0]?.id ?? null);
  };

  const addRoom = (type: ManualRoomType) => {
    if (!selectedFloor) return;
    const maxY = selectedFloor.rooms.length ? Math.max(...selectedFloor.rooms.map((r) => r.y + r.h)) : 0;
    const newRoom: ManualRoom = { id: newId("room"), type, name: MANUAL_ROOM_TYPE_LABELS[type], x: 0, y: maxY, w: 3.5, h: 3.5 };
    const next = { ...design, floors: design.floors.map((f) => (f.id === selectedFloor.id ? { ...f, rooms: [...f.rooms, newRoom] } : f)) };
    commit(next);
    setSelectedRoomId(newRoom.id);
  };

  const updateRoom = (roomId: string, patch: Partial<ManualRoom>, isCommit = true) => {
    if (!selectedFloor) return;
    const next = { ...design, floors: design.floors.map((f) => (f.id === selectedFloor.id ? { ...f, rooms: f.rooms.map((r) => (r.id === roomId ? { ...r, ...patch } : r)) } : f)) };
    if (isCommit) commit(next);
    else applyLive(next);
  };

  const duplicateRoom = (room: ManualRoom) => {
    if (!selectedFloor) return;
    const copy: ManualRoom = { ...room, id: newId("room"), name: `${room.name} (Copy)`, x: room.x + room.w + 0.5, y: room.y };
    const next = { ...design, floors: design.floors.map((f) => (f.id === selectedFloor.id ? { ...f, rooms: [...f.rooms, copy] } : f)) };
    commit(next);
    setSelectedRoomId(copy.id);
  };

  const deleteRoom = (roomId: string) => {
    if (!selectedFloor) return;
    const next = { ...design, floors: design.floors.map((f) => (f.id === selectedFloor.id ? { ...f, rooms: f.rooms.filter((r) => r.id !== roomId) } : f)) };
    commit(next);
    if (selectedRoomId === roomId) setSelectedRoomId(null);
  };

  const applyTemplateNow = (templateId: string) => {
    const template = DESIGN_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    const next = { floors: template.floors(), templateId };
    commit(next);
    setSelectedFloorId(next.floors[0]?.id ?? null);
    setTemplateModalOpen(false);
    setPendingReplace(null);
    showToast(`Applied the "${template.name}" template.`);
  };

  const applyConceptNow = () => {
    const concept = project.concepts.find((c) => c.id === fromConceptId);
    if (!concept) return;
    const next = { floors: concept.floors };
    commit(next);
    setSelectedFloorId(next.floors[0]?.id ?? null);
    setPendingReplace(null);
  };

  const handleSave = (asNewVersion: boolean) => {
    BuildProjectService.saveManualDesign(project.id, design, asNewVersion ? "Saved a new manual design version." : "Saved manual design changes.", asNewVersion);
    setDirty(false);
    showToast(asNewVersion ? "Saved as a new version." : "Design saved.");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-100 rounded-2xl shadow-sm p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={undo} disabled={historyIndex === 0} className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30">
            Undo
          </button>
          <button type="button" onClick={redo} disabled={historyIndex >= history.length - 1} className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30">
            Redo
          </button>
          <span className="w-px h-6 bg-slate-200 mx-1" />
          <button type="button" onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))} className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Zoom −
          </button>
          <button type="button" onClick={() => setZoom(1)} className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Reset
          </button>
          <button type="button" onClick={() => setZoom((z) => Math.min(2, z + 0.15))} className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Zoom +
          </button>
          <span className="w-px h-6 bg-slate-200 mx-1" />
          <button type="button" onClick={() => setPreviewMode((p) => !p)} className={`px-3 py-2 rounded-lg text-sm font-semibold ${previewMode ? "bg-[#2ec440]/10 text-[#2ec440]" : "text-slate-600 hover:bg-slate-100"}`}>
            {previewMode ? "Exit Preview" : "Preview"}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setTemplateModalOpen(true)} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Use Template
          </button>
          <button type="button" onClick={() => setSuggestOpen(true)} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Ask Huza AI for Suggestions
          </button>
          <button type="button" onClick={() => handleSave(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-700 hover:bg-slate-50">
            Save
          </button>
          <button type="button" onClick={() => setSaveVersionOpen(true)} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-900 hover:bg-[#2ec440] text-white shadow-lg">
            Save as New Version
          </button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-800 mb-1.5">Conceptual validation warnings</p>
          <ul className="space-y-1">
            {warnings.map((w) => (
              <li key={w.id} className="text-xs text-amber-700">
                {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="lg:hidden bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
        For precise room positioning, this designer works best on a larger screen. On mobile, use the room list below to add and edit spaces.
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-3">
        {design.floors.map((floor) => (
          <button
            key={floor.id}
            type="button"
            onClick={() => {
              setSelectedFloorId(floor.id);
              setSelectedRoomId(null);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              selectedFloorId === floor.id || (!selectedFloorId && floor === design.floors[0]) ? "bg-[#2ec440]/10 text-[#2ec440]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {floor.name}
          </button>
        ))}
        <button type="button" onClick={() => setAddFloorOpen(true)} className="px-3 py-2 rounded-xl text-sm font-semibold text-[#2ec440] hover:bg-[#2ec440]/10">
          + Add Floor
        </button>
        {selectedFloor && (
          <>
            <button type="button" onClick={() => setRenameFloorOpen(true)} className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100">
              Rename
            </button>
            <button
              type="button"
              onClick={deleteFloor}
              disabled={selectedFloor.rooms.length > 0}
              title={selectedFloor.rooms.length > 0 ? "Remove all rooms before deleting this floor" : undefined}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              Delete Floor
            </button>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-[200px_1fr_280px] gap-4">
        {!previewMode && (
          <div className="hidden lg:block bg-white border border-slate-100 rounded-2xl shadow-sm p-4 space-y-1.5 h-fit">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Room library</p>
            {ROOM_LIBRARY.map(([type, label]) => (
              <button key={type} type="button" onClick={() => addRoom(type)} className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
                + {label}
              </button>
            ))}
          </div>
        )}

        <div>
          {selectedFloor ? (
            <FloorPlanSvg
              floor={selectedFloor}
              selectedRoomId={selectedRoomId}
              onSelectRoom={(room) => setSelectedRoomId(room.id)}
              interactive={!previewMode}
              zoom={zoom}
              onDragRoom={(roomId, x, y) => updateRoom(roomId, { x, y }, false)}
              onDragEnd={(roomId, x, y) => updateRoom(roomId, { x, y }, true)}
            />
          ) : (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">Add a floor to start designing.</div>
          )}

          <div className="lg:hidden mt-4 bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Add a room</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {ROOM_LIBRARY.slice(0, 8).map(([type, label]) => (
                <button key={type} type="button" onClick={() => addRoom(type)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600">
                  + {label}
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Rooms on this floor</p>
            <ul className="space-y-2">
              {selectedFloor?.rooms.map((room) => (
                <li key={room.id}>
                  <button type="button" onClick={() => setSelectedRoomId(room.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${selectedRoomId === room.id ? "bg-[#2ec440]/10 text-[#2ec440]" : "bg-slate-50 text-slate-700"}`}>
                    {room.name} — {(room.w * room.h).toFixed(1)} sqm
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {!previewMode && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 h-fit">
            {selectedRoom ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Room properties</p>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                  <input
                    type="text"
                    value={selectedRoom.name}
                    onChange={(e) => updateRoom(selectedRoom.id, { name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Room type</label>
                  <select
                    value={selectedRoom.type}
                    onChange={(e) => updateRoom(selectedRoom.id, { type: e.target.value as ManualRoomType })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
                  >
                    {ROOM_LIBRARY.map(([type, label]) => (
                      <option key={type} value={type}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Width (m)</label>
                    <input
                      type="number"
                      min={1}
                      step={0.1}
                      value={selectedRoom.w}
                      onChange={(e) => updateRoom(selectedRoom.id, { w: Number(e.target.value) || 1 })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Length (m)</label>
                    <input
                      type="number"
                      min={1}
                      step={0.1}
                      value={selectedRoom.h}
                      onChange={(e) => updateRoom(selectedRoom.id, { h: Number(e.target.value) || 1 })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400">Area: {(selectedRoom.w * selectedRoom.h).toFixed(1)} sqm</p>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Notes</label>
                  <textarea
                    value={selectedRoom.notes ?? ""}
                    onChange={(e) => updateRoom(selectedRoom.id, { notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => duplicateRoom(selectedRoom)} className="flex-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg">
                    Duplicate
                  </button>
                  <button type="button" onClick={() => deleteRoom(selectedRoom.id)} className="flex-1 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg">
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Select a room to edit its properties, or add one from the library.</p>
            )}
          </div>
        )}
      </div>

      {/* Template picker */}
      <Dialog open={templateModalOpen} onClose={() => setTemplateModalOpen(false)} labelledBy="template-title" panelClassName="max-w-2xl">
        <div className="p-6 sm:p-8">
          <h2 id="template-title" className="text-xl font-black text-slate-900 mb-4">
            Choose a template
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
            {DESIGN_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => (design.floors.length > 0 ? setPendingReplace({ kind: "template", id: t.id }) : applyTemplateNow(t.id))}
                className="text-left border border-slate-200 hover:border-[#2ec440] rounded-2xl p-4 transition-colors"
              >
                <p className="font-bold text-slate-900 text-sm mb-1">{t.name}</p>
                <p className="text-xs text-slate-500 mb-2">{t.description}</p>
                <p className="text-xs text-slate-400">
                  {t.bedrooms} bed · {t.approxDimensions} · ~{t.approxAreaSqm} sqm
                </p>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setTemplateModalOpen(false)} className="mt-5 text-sm font-bold text-slate-500 hover:text-slate-800">
            Cancel
          </button>
        </div>
      </Dialog>

      <ConfirmModal
        open={pendingReplace !== null}
        onClose={() => setPendingReplace(null)}
        title="Replace existing layout?"
        description="This replaces your current rooms and floors. This can't be undone once you save, but you can still Undo before saving."
        confirmLabel="Replace Layout"
        destructive
        onConfirm={() => {
          if (!pendingReplace) return;
          if (pendingReplace.kind === "template") applyTemplateNow(pendingReplace.id);
          else applyConceptNow();
        }}
      />

      <Dialog open={suggestOpen} onClose={() => setSuggestOpen(false)} labelledBy="suggest-title" panelClassName="max-w-md">
        <div className="p-6 sm:p-8">
          <h2 id="suggest-title" className="text-xl font-black text-slate-900 mb-1">
            Huza AI suggestions
          </h2>
          <p className="text-slate-500 text-sm mb-5">A few conceptual suggestions based on common layout improvements.</p>
          <div className="space-y-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  commit(s.apply(design));
                  setSuggestOpen(false);
                  showToast("Suggestion applied.");
                }}
                className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-[#2ec440] hover:text-[#2ec440] text-slate-700 text-sm font-semibold transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setSuggestOpen(false)} className="mt-5 text-sm font-bold text-slate-500 hover:text-slate-800">
            Close
          </button>
        </div>
      </Dialog>

      <PromptModal open={addFloorOpen} onClose={() => setAddFloorOpen(false)} title="Add a floor" label="Floor name" initialValue={`Floor ${design.floors.length + 1}`} submitLabel="Add Floor" onSubmit={addFloor} />
      <PromptModal open={renameFloorOpen} onClose={() => setRenameFloorOpen(false)} title="Rename floor" label="Floor name" initialValue={selectedFloor?.name ?? ""} submitLabel="Save" onSubmit={renameFloor} />

      <ConfirmModal
        open={saveVersionOpen}
        onClose={() => setSaveVersionOpen(false)}
        title="Save as a new version?"
        description="This saves your current layout as a new version in your version history. Earlier versions are kept."
        confirmLabel="Save as New Version"
        onConfirm={() => {
          handleSave(true);
          setSaveVersionOpen(false);
        }}
      />
    </div>
  );
}
