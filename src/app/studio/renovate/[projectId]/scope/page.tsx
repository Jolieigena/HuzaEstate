"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRenovationProjectContext } from "@/components/renovate/RenovationProjectContext";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { makeScope } from "@/lib/renovate/makeScope";
import { newId } from "@/lib/renovate/factory";
import { PriorityLevel, ScopeItem } from "@/lib/renovate/types";
import { useToast } from "@/lib/toast-context";
import ScopeTable from "@/components/renovate/ScopeTable";
import ScopeItemModal from "@/components/renovate/ScopeItemModal";
import ConfirmModal from "@/components/shared/ConfirmModal";

export default function ScopePage() {
  const project = useRenovationProjectContext();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ScopeItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScopeItem | null>(null);

  const handleGenerate = () => {
    makeScope(project);
    showToast("Scope of work generated.");
  };

  // The first visit makes the scope straight away, so there is nothing to press; after that, the person decides.
  const autoRef = useRef(false);
  useEffect(() => {
    if (autoRef.current || project.scope.length > 0 || project.assessment.areas.length === 0) return;
    autoRef.current = true;
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  if (project.scope.length === 0) {
    return <p className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm font-semibold text-slate-600">Choose the rooms to renovate in your brief to get a scope of work.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link href={`/studio/renovate/${project.id}/concepts`} className="text-sm font-bold text-[#2ec440] hover:text-[#28b039]">
            Back to redesign
          </Link>
          <h1 className="text-xl font-black text-slate-900">Scope of work</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setEditing(null); setModalOpen(true); }} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
            Add Task
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
