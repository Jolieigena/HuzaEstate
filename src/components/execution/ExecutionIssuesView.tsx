"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ExecutionProject, IssueRecord, DefectItem, ISSUE_PRIORITY_LABELS, ISSUE_STATUS_LABELS, ExecutionRole } from "../../lib/execution/types";
import { IssueService } from "../../lib/execution/executionService";
import { AddIssueModal, AddDefectModal } from "./ExecutionModals";
import { canPerformExecutionAction } from "../../lib/execution/permissions";

interface IssuesViewProps {
  project: ExecutionProject;
  currentRole: ExecutionRole;
}

export function ExecutionIssuesView({ project, currentRole }: IssuesViewProps) {
  const [activeTab, setActiveTab] = useState<"issues" | "defects">("issues");
  const [isAddIssueModalOpen, setIsAddIssueModalOpen] = useState(false);
  const [isAddDefectModalOpen, setIsAddDefectModalOpen] = useState(false);

  const canVerifyDefect = canPerformExecutionAction(currentRole, "defect.verify");

  const handleAddIssue = (data: any) => {
    IssueService.addIssue(
      project.id,
      {
        ...data,
        type: "design_clarification",
        raisedByName: currentRole === "customer" ? project.customerName : project.contractorName,
        raisedByRole: currentRole,
        assignedToRole: "contractor",
        attachmentUrls: [],
      },
      currentRole === "customer" ? project.customerName : project.contractorName,
      currentRole
    );
  };

  const handleAddDefect = (data: any) => {
    IssueService.addDefect(
      project.id,
      {
        ...data,
        photoUrls: [],
        reportedByName: currentRole === "customer" ? project.customerName : "Inspector",
        assignedContractorName: project.contractorName,
      },
      currentRole === "customer" ? project.customerName : project.contractorName,
      currentRole
    );
  };

  const handleVerifyDefect = (defectId: string, verified: boolean) => {
    IssueService.verifyDefect(
      project.id,
      defectId,
      verified,
      verified ? "Verified on site by client/inspector." : "Correction rejected — requires further work.",
      currentRole === "customer" ? project.customerName : "Inspector",
      currentRole
    );
  };

  return (
    <div className="space-y-6">
      {/* Navigation & Controls */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Issues, RFIs & Room-by-Room Snag List</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track site queries, technical RFIs, stop-work alerts, and post-construction snagging defects.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-2xl border flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("issues")}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeTab === "issues" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-600"
              }`}
            >
              Issues & RFIs ({project.issues.length})
            </button>
            <button
              onClick={() => setActiveTab("defects")}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeTab === "defects" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-600"
              }`}
            >
              Snag Defects ({project.defects.length})
            </button>
          </div>

          {activeTab === "issues" ? (
            <button
              onClick={() => setIsAddIssueModalOpen(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
            >
              + Report Issue / RFI
            </button>
          ) : (
            <button
              onClick={() => setIsAddDefectModalOpen(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
            >
              + Add Defect Item
            </button>
          )}
        </div>
      </div>

      {activeTab === "issues" && (
        <div className="space-y-4">
          {project.issues.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-sm">
              No active issues or RFIs.
            </div>
          ) : (
            project.issues.map((iss) => (
              <div key={iss.id} className={`bg-white border rounded-3xl p-6 shadow-sm space-y-4 ${
                iss.priority === "stop_work" ? "border-red-500 ring-2 ring-red-200" : "border-slate-200"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-slate-400">{iss.issueReference}</span>
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                        iss.priority === "stop_work" ? "bg-red-600 text-white" :
                        iss.priority === "urgent" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-700"
                      }`}>
                        {ISSUE_PRIORITY_LABELS[iss.priority]}
                      </span>
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
                        {ISSUE_STATUS_LABELS[iss.status]}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{iss.title}</h3>
                    <div className="text-xs text-slate-500">
                      Raised by <strong>{iss.raisedByName}</strong> ({iss.raisedByRole}) → Assigned to <strong>{iss.assignedToName}</strong>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600">{iss.description}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "defects" && (
        <div className="space-y-4">
          {project.defects.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-sm">
              No snagging defects recorded.
            </div>
          ) : (
            project.defects.map((def) => (
              <div key={def.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-slate-400">{def.defectReference}</span>
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                        📍 {def.roomLocation}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{def.description}</h3>
                  </div>

                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    def.status === "corrected" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}>
                    {def.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-2xl border text-slate-700">
                  <div>Severity: <strong>{def.severity}</strong></div>
                  <div>Assigned Contractor: <strong>{def.assignedContractorName}</strong></div>
                  <div>Target Correction Date: <strong>{def.targetCorrectionDate}</strong></div>
                  <div>Verification Notes: <strong>{def.verificationNotes || "Pending verification"}</strong></div>
                </div>

                {canVerifyDefect && def.status !== "corrected" && (
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleVerifyDefect(def.id, false)}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold"
                    >
                      Reject Correction
                    </button>
                    <button
                      onClick={() => handleVerifyDefect(def.id, true)}
                      className="px-4 py-2 bg-[#2ec440] text-white rounded-xl text-xs font-bold"
                    >
                      Verify & Close Defect
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <AddIssueModal
        open={isAddIssueModalOpen}
        onClose={() => setIsAddIssueModalOpen(false)}
        onSubmit={handleAddIssue}
      />

      <AddDefectModal
        open={isAddDefectModalOpen}
        onClose={() => setIsAddDefectModalOpen(false)}
        onSubmit={handleAddDefect}
      />
    </div>
  );
}
