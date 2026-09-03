"use client";

import React, { useState } from "react";
import { ExecutionProject, InspectionRecord, INSPECTION_TYPE_LABELS, INSPECTION_OUTCOME_LABELS, ExecutionRole } from "../../lib/execution/types";
import { InspectionService } from "../../lib/execution/executionService";
import { RequestInspectionModal } from "./ExecutionModals";
import { canPerformExecutionAction } from "../../lib/execution/permissions";
import Dialog from "../Dialog";

interface InspectionsViewProps {
  project: ExecutionProject;
  currentRole: ExecutionRole;
}

export function ExecutionInspectionsView({ project, currentRole }: InspectionsViewProps) {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<InspectionRecord | null>(null);
  const [findings, setFindings] = useState("");
  const [declaration, setDeclaration] = useState(false);

  const canPerform = canPerformExecutionAction(currentRole, "inspection.perform");

  const handleRequestInspection = (data: any) => {
    InspectionService.requestInspection(
      project.id,
      {
        ...data,
        checklist: [
          { id: "chk-1", label: "Structural layout verification", passed: null },
          { id: "chk-2", label: "Quality and material standards audit", passed: null },
        ],
        evidencePhotoUrls: [],
        findings: "Scheduled for site audit.",
        requestedBy: currentRole === "customer" ? project.customerName : project.contractorName,
        assignedInspectorRole: "engineer",
      },
      currentRole === "customer" ? project.customerName : project.contractorName,
      currentRole
    );
  };

  const handleSubmitResult = (outcome: InspectionRecord["outcome"]) => {
    if (!selectedInspection) return;
    InspectionService.submitResult(
      project.id,
      selectedInspection.id,
      outcome,
      findings || "Inspection completed cleanly.",
      selectedInspection.checklist.map((c) => ({ ...c, passed: outcome === "passed" || outcome === "passed_with_observations" })),
      [],
      declaration,
      "Eric Habimana (Structural Eng)",
      currentRole
    );
    setSelectedInspection(null);
  };

  return (
    <div className="space-y-6">
      {/* Warning on Contractor Self-Approval */}
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 sm:p-5 flex items-start gap-3 text-xs sm:text-sm text-amber-900">
        <span className="text-xl">⚖️</span>
        <div>
          <h4 className="font-bold text-amber-950">Independent Technical Inspection Requirement</h4>
          <p className="mt-0.5 text-amber-800">
            A contractor <strong>cannot approve their own required independent stage inspection</strong> on behalf of the client or structural engineer. Professional declarations are logged in the audit trail.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Stage Inspections & Quality Audits</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {project.inspections.length} total stage inspections recorded.
          </p>
        </div>

        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
        >
          + Request Stage Inspection
        </button>
      </div>

      {/* Inspections List */}
      <div className="space-y-4">
        {project.inspections.map((insp) => (
          <div key={insp.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-slate-400 font-mono">{insp.id}</span>
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                    {INSPECTION_TYPE_LABELS[insp.type]}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{insp.title}</h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Inspector: <strong>{insp.assignedInspectorName}</strong> ({insp.assignedInspectorRole}) • Scheduled Date: {insp.scheduledDate}
                </div>
              </div>

              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                insp.outcome === "passed" ? "bg-emerald-100 text-emerald-800 border-emerald-300" :
                insp.outcome === "passed_with_observations" ? "bg-blue-100 text-blue-800 border-blue-300" :
                insp.outcome === "scheduled" ? "bg-slate-100 text-slate-700 border-slate-300" : "bg-red-100 text-red-800 border-red-300"
              }`}>
                {INSPECTION_OUTCOME_LABELS[insp.outcome]}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border text-xs space-y-2">
              <div><strong className="text-slate-800">Location on Site:</strong> {insp.locationOnSite}</div>
              <div><strong className="text-slate-800">Inspector Findings:</strong> {insp.findings}</div>
              {insp.inspectorDeclarationConfirmed && (
                <div className="text-emerald-700 font-semibold flex items-center gap-1.5 pt-1 border-t">
                  <span>✓</span> <span>Professional inspector declaration signed and recorded.</span>
                </div>
              )}
            </div>

            {/* Checklist */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700">Inspection Checklist Items:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {insp.checklist.map((item) => (
                  <div key={item.id} className="p-2.5 bg-slate-50 border rounded-xl flex items-center justify-between">
                    <span className="text-slate-700 font-medium">{item.label}</span>
                    <span className={`font-bold px-2 py-0.5 rounded ${
                      item.passed === true ? "bg-emerald-100 text-emerald-800" :
                      item.passed === false ? "bg-red-100 text-red-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {item.passed === true ? "Passed" : item.passed === false ? "Failed" : "Unrated"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions for Authorized Inspectors */}
            {canPerform && insp.outcome === "scheduled" && (
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedInspection(insp)}
                  className="px-4 py-2 bg-[#2ec440] text-white rounded-xl text-xs font-bold"
                >
                  Conduct Audit & Record Outcome
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <RequestInspectionModal
        open={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmit={handleRequestInspection}
      />

      {/* Conduct Inspection Result Modal */}
      {selectedInspection && (
        <Dialog open={Boolean(selectedInspection)} onClose={() => setSelectedInspection(null)} labelledBy="insp-res-title">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 id="insp-res-title" className="text-lg font-bold text-slate-900">Record Inspection Audit Result</h3>
              <button onClick={() => setSelectedInspection(null)} className="text-slate-400 hover:text-slate-600 font-bold" data-dialog-close>✕</button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Inspector Findings & Technical Commentary</label>
              <textarea rows={3} value={findings} onChange={(e) => setFindings(e.target.value)} placeholder="State technical findings..." className="w-full px-3 py-2 border rounded-xl text-sm" />
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-emerald-900 cursor-pointer">
                <input type="checkbox" checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} className="w-4 h-4 text-[#2ec440]" />
                <span>I confirm as an accredited inspector that this stage audit is accurate.</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button onClick={() => handleSubmitResult("corrective_work_required")} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">Require Correction</button>
              <button onClick={() => handleSubmitResult("passed_with_observations")} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Pass with Observations</button>
              <button onClick={() => handleSubmitResult("passed")} className="px-4 py-2 bg-[#2ec440] text-white rounded-xl text-xs font-bold">Pass Inspection</button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
