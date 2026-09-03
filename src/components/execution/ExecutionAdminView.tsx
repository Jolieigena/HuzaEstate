"use client";

import React, { useState } from "react";
import { ExecutionProject, EXECUTION_STATUS_LABELS } from "../../lib/execution/types";
import { ExecutionProjectService } from "../../lib/execution/executionService";
import Dialog from "../Dialog";

interface AdminViewProps {
  project: ExecutionProject;
}

export function ExecutionAdminView({ project }: AdminViewProps) {
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState("");

  const handlePauseToggle = () => {
    if (project.status === "paused") {
      ExecutionProjectService.resumeProject(project.id, "Operations Admin", "administrator");
    } else {
      if (!pauseReason.trim()) return;
      ExecutionProjectService.pauseProject(project.id, "Operations Admin", "administrator", pauseReason);
      setIsPauseModalOpen(false);
      setPauseReason("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Administrator Restriction Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2ec440]">Administration & Operations Oversight</span>
          <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300 font-mono">Privileged Access Mode</span>
        </div>
        <h2 className="text-xl font-bold">Operational Metadata & Lifecycle Audit Log</h2>
        <p className="text-xs text-slate-300">
          Administrators may pause restricted platform workflows, investigate disputes, and view operational metadata.
          <strong> Administrators must NOT approve milestones, pass inspections, alter contractor pricing, or sign handovers for customers.</strong>
        </p>
      </div>

      {/* Operational Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Current Status</span>
          <div className="text-base font-bold text-slate-900 mt-1">{EXECUTION_STATUS_LABELS[project.status]}</div>
        </div>

        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Agreed Contract Value</span>
          <div className="text-base font-bold text-slate-900 mt-1">{project.contractValue.toLocaleString()} {project.currency}</div>
        </div>

        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Change Orders Total</span>
          <div className="text-base font-bold text-emerald-600 mt-1">
            +{(project.contractValue - project.originalContractValue).toLocaleString()} {project.currency}
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Safety Flags / Open Issues</span>
          <div className="text-base font-bold text-slate-900 mt-1">{project.issues.length} Open</div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Platform Administrative Controls</h3>
          <p className="text-xs text-slate-500">Pause project execution in case of safety violation or legal dispute.</p>
        </div>

        <button
          onClick={() => {
            if (project.status === "paused") handlePauseToggle();
            else setIsPauseModalOpen(true);
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-colors ${
            project.status === "paused" ? "bg-[#2ec440] hover:opacity-90" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {project.status === "paused" ? "Resume Execution Workflow" : "Pause Project Workflows"}
        </button>
      </div>

      {/* Audit Log Events */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Lifecycle Audit Events ({project.activity.length})</h3>

        <div className="space-y-3">
          {project.activity.map((act) => (
            <div key={act.id} className="p-3 bg-slate-50 border rounded-2xl text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900">{act.summary}</span>
                <div className="text-slate-500 mt-0.5">Actor: {act.actorName} ({act.actorRole}) • Tab: {act.relatedTab || "General"}</div>
              </div>
              <span className="font-mono text-[10px] text-slate-400">{new Date(act.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pause Modal */}
      {isPauseModalOpen && (
        <Dialog open={isPauseModalOpen} onClose={() => setIsPauseModalOpen(false)} labelledBy="pause-title">
          <form onSubmit={(e) => { e.preventDefault(); handlePauseToggle(); }} className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 id="pause-title" className="text-lg font-bold text-slate-900">Pause Project Workflows</h3>
              <button type="button" onClick={() => setIsPauseModalOpen(false)} className="text-slate-400 font-bold" data-dialog-close>✕</button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Operational Pause Reason</label>
              <textarea required rows={3} value={pauseReason} onChange={(e) => setPauseReason(e.target.value)} placeholder="Specify reason..." className="w-full px-3 py-2 border rounded-xl text-sm" />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button type="button" onClick={() => setIsPauseModalOpen(false)} className="px-4 py-2 border rounded-xl text-sm font-semibold">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-bold">Pause Project</button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
