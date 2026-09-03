"use client";

import { useState } from "react";
import { useRenovationProjectContext } from "@/components/renovate/RenovationProjectContext";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { generateScope } from "@/lib/renovate/scopeGenerator";
import { newId } from "@/lib/renovate/factory";
import { PriorityLevel, ScopeItem, HIGH_RISK_AREA_KEYS } from "@/lib/renovate/types";
import { useToast } from "@/lib/toast-context";
import ScopeTable from "@/components/renovate/ScopeTable";
import ScopeItemModal from "@/components/renovate/ScopeItemModal";
import TimelinePhases from "@/components/renovate/TimelinePhases";
import ConfirmModal from "@/components/shared/ConfirmModal";

export default function ScopePage() {
  const project = useRenovationProjectContext();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ScopeItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScopeItem | null>(null);
  const [startDate, setStartDate] = useState(project.assessment.budgetTimeline.desiredStartDate);

  const handleGenerate = () => {
    const items = generateScope(project.assessment.areas, project.assessment.keepRemoveChange, project.assessment.safety);
    RenovationProjectService.generateScope(project.id, items);
    const highRiskCount = project.assessment.areas.filter((a) => HIGH_RISK_AREA_KEYS.includes(a.areaKey)).length;
    RenovationProjectService.recalculateTimeline(project.id, {
      desiredStartDate: project.assessment.budgetTimeline.desiredStartDate,
      scopeItemCount: items.length,
      highRiskAreaCount: highRiskCount,
      propertyRemainsOccupied: project.assessment.budgetTimeline.propertyRemainsOccupied,
    });
    showToast("Scope of work generated.");
  };

  const handleExport = () => {
    RenovationProjectService.addDocuments(project.id, [
      {
        id: newId("doc"),
        name: `${project.name} — Scope of work.txt`,
        category: "scope_of_work",
        fileType: "txt",
        size: 0,
        date: new Date().toISOString(),
        uploadedBy: "You",
        status: "active",
        generated: true,
      },
    ]);
    showToast("Scope summary exported to Documents.");
  };

  const recalcTimeline = () => {
    const highRiskCount = project.assessment.areas.filter((a) => HIGH_RISK_AREA_KEYS.includes(a.areaKey)).length;
    RenovationProjectService.recalculateTimeline(project.id, {
      desiredStartDate: startDate,
      scopeItemCount: project.scope.length,
      highRiskAreaCount: highRiskCount,
      propertyRemainsOccupied: project.assessment.budgetTimeline.propertyRemainsOccupied,
      currentPhaseKey: project.timeline?.currentPhaseKey,
    });
    showToast("Timeline recalculated.");
  };

  if (project.scope.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-10 sm:p-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#2ec440]/10 text-[#2ec440] flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-3">No scope of work yet</h2>
        <p className="text-slate-500 leading-relaxed max-w-md mx-auto mb-8">Generate a room-by-room conceptual scope of work based on your selected areas and keep/remove/change decisions.</p>
        <button type="button" onClick={handleGenerate} className="inline-block bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 px-8 rounded-xl transition-colors shadow-lg">
          Generate Scope of Work
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900">Scope of work</h1>
          <p className="text-slate-500 text-sm">Conceptual, room-by-room. Quantities are indicative only.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setEditing(null); setModalOpen(true); }} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
            Add Task
          </button>
          <button type="button" onClick={handleExport} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
            Export Scope Summary
          </button>
          <button type="button" onClick={handleGenerate} className="bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
            Regenerate Scope
          </button>
        </div>
      </div>

      <ScopeTable
        items={project.scope}
        onEdit={(item) => {
          setEditing(item);
          setModalOpen(true);
        }}
        onDelete={(id) => setDeleteTarget(project.scope.find((s) => s.id === id) ?? null)}
        onToggleExcluded={(id, excluded) => RenovationProjectService.updateScopeItem(project.id, id, { status: excluded ? "excluded" : "planned" })}
        onTogglePriority={(id, priority: PriorityLevel) => RenovationProjectService.updateScopeItem(project.id, id, { priority })}
      />

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold text-slate-900">Timeline</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="desired-start" className="text-xs font-bold text-slate-500">
              Desired start date
            </label>
            <input id="desired-start" type="date" value={startDate?.slice(0, 10) ?? ""} onChange={(e) => setStartDate(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5" />
            <button type="button" onClick={recalcTimeline} className="text-xs font-bold text-[#2ec440] hover:text-[#28b039]">
              Recalculate
            </button>
          </div>
        </div>
        {project.timeline ? (
          <TimelinePhases timeline={project.timeline} />
        ) : (
          <p className="text-slate-500 text-sm">Generate the scope to calculate an indicative timeline.</p>
        )}
      </div>

      <ScopeItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        areaOptions={project.assessment.areas.map((a) => a.areaKey)}
        onSubmit={(item) => {
          if (editing) {
            RenovationProjectService.updateScopeItem(project.id, editing.id, item);
            showToast("Scope item updated.");
          } else {
            RenovationProjectService.addScopeItem(project.id, { ...item, id: newId("scope"), sequence: project.scope.length + 1, status: "planned" });
            showToast("Scope item added.");
          }
          setModalOpen(false);
        }}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete scope item"
        description={deleteTarget ? `This removes "${deleteTarget.task}" from the scope of work.` : ""}
        confirmLabel="Delete Item"
        destructive
        onConfirm={() => {
          if (deleteTarget) RenovationProjectService.deleteScopeItem(project.id, deleteTarget.id);
          showToast("Scope item deleted.");
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
