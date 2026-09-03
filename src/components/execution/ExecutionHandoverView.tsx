"use client";

import React, { useState } from "react";
import { ExecutionProject, HandoverChecklist, WarrantyIssue, EXECUTION_STATUS_LABELS, ExecutionRole } from "../../lib/execution/types";
import { HandoverService } from "../../lib/execution/executionService";
import { canPerformExecutionAction } from "../../lib/execution/permissions";
import Dialog from "../Dialog";

interface HandoverViewProps {
  project: ExecutionProject;
  currentRole: ExecutionRole;
}

export function ExecutionHandoverView({ project, currentRole }: HandoverViewProps) {
  const [activeTab, setActiveTab] = useState<"handover" | "warranty">("handover");
  const [isReportWarrantyModalOpen, setIsReportWarrantyModalOpen] = useState(false);
  const [warrantyTitle, setWarrantyTitle] = useState("");
  const [warrantyDesc, setWarrantyDesc] = useState("");

  const canAcceptHandover = canPerformExecutionAction(currentRole, "handover.accept_customer");

  const checklistItems: { key: keyof HandoverChecklist; label: string }[] = [
    { key: "scopeCompleted", label: "All Contracted Scope Items Completed" },
    { key: "approvedChangesCompleted", label: "All Approved Change Orders Executed" },
    { key: "requiredInspectionsPassed", label: "Final Stage Technical Inspections Passed" },
    { key: "openDefectsAddressed", label: "All Major Snagging Defects Corrected" },
    { key: "siteCleaned", label: "Post-Construction Deep Clean Completed" },
    { key: "wasteRemoved", label: "Construction Debris & Waste Removed" },
    { key: "utilitiesTested", label: "Electrical, Water & HVAC Commissioned" },
    { key: "customerWalkthroughCompleted", label: "Customer Final Walkthrough Inspection Done" },
    { key: "documentsUploaded", label: "As-Built Drawings & O&M Manuals Uploaded" },
    { key: "warrantiesProvided", label: "Supplier & Workmanship Warranties Issued" },
    { key: "maintenanceInfoProvided", label: "Maintenance Guidelines & Keys Handed Over" },
  ];

  const handleAcceptHandover = () => {
    HandoverService.acceptHandover(project.id, project.customerName);
  };

  const handleReportWarrantyIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warrantyTitle.trim()) return;
    HandoverService.addWarrantyIssue(
      project.id,
      {
        title: warrantyTitle,
        description: warrantyDesc,
        evidencePhotoUrls: [],
        reportedByName: project.customerName,
        assignedPartyName: project.contractorName,
      },
      project.customerName
    );
    setIsReportWarrantyModalOpen(false);
    setWarrantyTitle("");
    setWarrantyDesc("");
  };

  return (
    <div className="space-y-6">
      {/* Navigation Subheader */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Final Handover & Post-Handover Warranties</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Completion readiness checklist, handover signoff, project locking, and post-handover warranty issue tracking.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border text-xs font-semibold">
          <button
            onClick={() => setActiveTab("handover")}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              activeTab === "handover" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-600"
            }`}
          >
            Handover Readiness
          </button>
          <button
            onClick={() => setActiveTab("warranty")}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              activeTab === "warranty" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-600"
            }`}
          >
            Warranty Issues ({project.warrantyIssues.length})
          </button>
        </div>
      </div>

      {activeTab === "handover" && (
        <div className="space-y-6">
          {/* Handover Status Banner */}
          <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            project.status === "handed_over" ? "bg-purple-50 border-purple-200 text-purple-950" : "bg-blue-50 border-blue-200 text-blue-950"
          }`}>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-700">Project Lifecycle Status</div>
              <h3 className="text-2xl font-bold mt-0.5">{EXECUTION_STATUS_LABELS[project.status]}</h3>
              <p className="text-xs text-slate-600 mt-1">
                {project.status === "handed_over"
                  ? `Handover officially accepted on ${project.handoverAcceptedAt || project.actualCompletionDate}. Baseline execution records locked.`
                  : "Complete readiness checks and snag verification before customer signoff."}
              </p>
            </div>

            {canAcceptHandover && project.status !== "handed_over" && (
              <button
                onClick={handleAcceptHandover}
                className="px-6 py-3 bg-[#2ec440] text-white font-bold text-sm rounded-2xl hover:opacity-90 shadow-sm"
              >
                Accept Project Handover & Close →
              </button>
            )}
          </div>

          {/* Readiness Checklist */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Completion Readiness Checklist</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {checklistItems.map((item) => {
                const isPassed = project.handoverChecklist[item.key];
                return (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 border rounded-2xl">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className={`px-2.5 py-0.5 font-bold rounded-lg ${isPassed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {isPassed ? "✓ Passed" : "Pending"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Warranties & Manuals Summary */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Active Workmanship & Product Warranties</h3>

            <div className="space-y-3">
              {project.warranties.length === 0 ? (
                <div className="text-xs text-slate-500 italic">No warranty records uploaded yet.</div>
              ) : (
                project.warranties.map((w) => (
                  <div key={w.id} className="p-4 bg-slate-50 border rounded-2xl text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900 text-sm">
                      <span>{w.title}</span>
                      <span className="text-emerald-700 font-bold">{w.warrantyPeriodMonths} Months</span>
                    </div>
                    <div className="text-slate-600">Supplier: {w.supplierOrManufacturer} • Effective: {w.startDate} to {w.expiryDate}</div>
                    <p className="text-slate-500 pt-1 border-t">{w.termsSummary}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "warranty" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Post-Handover Warranty Claims</h3>
              <p className="text-xs text-slate-500">Report and track warranty repairs after project completion.</p>
            </div>
            <button
              onClick={() => setIsReportWarrantyModalOpen(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
            >
              + Report Warranty Issue
            </button>
          </div>

          {project.warrantyIssues.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-sm">
              No warranty issues reported post-handover.
            </div>
          ) : (
            project.warrantyIssues.map((wi) => (
              <div key={wi.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3 text-xs">
                <div className="flex justify-between items-start border-b pb-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{wi.title}</h4>
                    <div className="text-slate-500">Reported on {new Date(wi.reportedAt).toLocaleDateString()} by {wi.reportedByName}</div>
                  </div>
                  <span className="px-2.5 py-1 font-bold rounded-full bg-amber-100 text-amber-800 border">
                    {wi.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-slate-600">{wi.description}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Report Warranty Issue Modal */}
      {isReportWarrantyModalOpen && (
        <Dialog open={isReportWarrantyModalOpen} onClose={() => setIsReportWarrantyModalOpen(false)} labelledBy="war-iss-title">
          <form onSubmit={handleReportWarrantyIssue} className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 id="war-iss-title" className="text-lg font-bold text-slate-900">Report Post-Handover Warranty Issue</h3>
              <button type="button" onClick={() => setIsReportWarrantyModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold" data-dialog-close>✕</button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Issue Title</label>
              <input required type="text" value={warrantyTitle} onChange={(e) => setWarrantyTitle(e.target.value)} placeholder="e.g. Cabinet hinge loose in kitchen" className="w-full px-3 py-2 border rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description & Evidence Details</label>
              <textarea required rows={3} value={warrantyDesc} onChange={(e) => setWarrantyDesc(e.target.value)} placeholder="Describe warranty issue..." className="w-full px-3 py-2 border rounded-xl text-sm" />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button type="button" onClick={() => setIsReportWarrantyModalOpen(false)} className="px-4 py-2 border rounded-xl text-sm font-semibold">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">Submit Warranty Claim</button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
