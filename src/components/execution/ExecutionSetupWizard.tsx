"use client";

import React, { useState } from "react";
import { ExecutionProject, ExecutionRole, APPROVAL_STATUS_LABELS, ApprovalStatus } from "../../lib/execution/types";
import { ExecutionProjectService } from "../../lib/execution/executionService";

interface SetupWizardProps {
  project: ExecutionProject;
  currentRole: ExecutionRole;
  onActivated?: () => void;
}

export function ExecutionSetupWizard({ project, currentRole, onActivated }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [agreedBaseline, setAgreedBaseline] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check prerequisites readiness
  const checklist = [
    { label: "Project Owner", ready: Boolean(project.customerId), note: project.customerName },
    { label: "Selected Design Version", ready: Boolean(project.designVersionName), note: project.designVersionName },
    { label: "Approved Scope of Work", ready: Boolean(project.approvedScopeSummary), note: "Scope baseline set" },
    { label: "Assigned Main Contractor", ready: Boolean(project.contractorId), note: project.contractorName },
    { label: "Agreed Budget / Accepted Quotation", ready: project.contractValue > 0, note: `${project.contractValue.toLocaleString()} ${project.currency}` },
    { label: "Proposed Start Date", ready: Boolean(project.startDate), note: project.startDate },
    { label: "Proposed Target Completion Date", ready: Boolean(project.targetCompletionDate), note: project.targetCompletionDate },
    { label: "Required Professional Roles Assigned", ready: project.team.length >= 2, note: `${project.team.length} team members` },
    { label: "Approvals & Permits Recorded", ready: project.approvals.some((a) => a.status === "approved" || a.status === "in_preparation" || a.status === "not_required"), note: `${project.approvals.length} permits documented` },
    { label: "Customer & Contractor Acknowledgement", ready: project.customerSetupConfirmed && project.contractorSetupConfirmed, note: agreedBaseline ? "Acknowledged" : "Pending confirmation" },
  ];

  const allReady = checklist.every((c) => c.ready);

  const handleConfirmStep = () => {
    setIsSubmitting(true);
    ExecutionProjectService.confirmSetupStep(project.id, currentRole, currentRole === "customer" ? project.customerName : project.contractorName);
    setIsSubmitting(false);
  };

  const handleActivate = () => {
    setIsSubmitting(true);
    ExecutionProjectService.activateProject(project.id, currentRole === "customer" ? project.customerName : project.contractorName, currentRole);
    setIsSubmitting(false);
    if (onActivated) onActivated();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
      {/* Wizard Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2ec440]">Execution Kickoff Workflow</span>
          <span className="text-xs font-bold text-slate-400">Step {currentStep} of 7</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">Project Execution Setup & Baseline Confirmation</h2>
        <p className="text-sm text-slate-600 mt-1">
          Confirm design baseline, team assignments, construction schedule, and approvals before starting work on site.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-7 gap-1 bg-slate-50 p-1.5 rounded-2xl border text-center text-xs font-semibold">
        {[
          "1. Source",
          "2. Scope",
          "3. Team",
          "4. Schedule",
          "5. Permits",
          "6. Comms",
          "7. Activate",
        ].map((lbl, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          const isDone = stepNum < currentStep;
          return (
            <button
              key={lbl}
              onClick={() => setCurrentStep(stepNum)}
              className={`py-2 px-1 rounded-xl transition-colors ${
                isActive
                  ? "bg-slate-900 text-white font-bold"
                  : isDone
                  ? "bg-emerald-100 text-emerald-800"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {lbl}
            </button>
          );
        })}
      </div>

      {/* Readiness Checklist Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
          <span>📋</span> Execution Readiness Checklist
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center justify-between p-2.5 bg-white border rounded-xl">
              <span className="font-medium text-slate-700">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">{item.note}</span>
                <span className={`px-2 py-0.5 font-bold rounded-md ${item.ready ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {item.ready ? "✓ Ready" : "Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Contents */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Step 1: Confirm Source Project & Accepted Quotation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-2xl border">
            <div>
              <span className="text-slate-400 block text-xs uppercase font-bold">Project Name</span>
              <span className="font-bold text-slate-900">{project.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs uppercase font-bold">Property Location</span>
              <span className="font-bold text-slate-900">{project.location}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs uppercase font-bold">Customer</span>
              <span className="font-bold text-slate-900">{project.customerName} ({project.customerEmail})</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs uppercase font-bold">Main Contractor</span>
              <span className="font-bold text-slate-900">{project.contractorName} ({project.contractorEmail})</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs uppercase font-bold">Accepted Quotation Total</span>
              <span className="font-bold text-emerald-600">{project.contractValue.toLocaleString()} {project.currency}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs uppercase font-bold">Design Baseline</span>
              <span className="font-bold text-slate-900">{project.designVersionName}</span>
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Step 2: Confirm Approved Design & Scope</h3>
          <p className="text-xs text-slate-600">
            Review agreed scope inclusions and exclusions. Once confirmed, future modifications require a formal <strong>Change Order</strong>.
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border space-y-3 text-sm">
            <h4 className="font-bold text-slate-900">Approved Scope Summary:</h4>
            <p className="text-slate-700">{project.approvedScopeSummary}</p>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Step 3: Confirm Project Team & Contacts</h3>
          <div className="space-y-2">
            {project.team.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 border rounded-2xl text-xs">
                <div>
                  <div className="font-bold text-slate-900">{member.name}</div>
                  <div className="text-slate-500">{member.role.toUpperCase()} • {member.email} • {member.phone}</div>
                </div>
                <span className={`px-2.5 py-1 font-bold rounded-lg ${member.confirmed ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                  {member.confirmed ? "Confirmed" : "Awaiting Confirmation"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Step 4: Construction Schedule & Working Hours</h3>
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border">
            <div>
              <span className="text-slate-400 block uppercase font-bold">Planned Start Date</span>
              <span className="font-bold text-slate-900 text-sm">{project.startDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold">Target Completion Date</span>
              <span className="font-bold text-slate-900 text-sm">{project.targetCompletionDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold">Working Days</span>
              <span className="font-bold text-slate-900">Monday - Saturday</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold">Restricted Hours</span>
              <span className="font-bold text-slate-900">7:00 AM - 6:00 PM</span>
            </div>
          </div>
        </div>
      )}

      {currentStep === 5 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Step 5: Approvals, Permits & Safety Plans</h3>
          <p className="text-xs text-slate-600">
            HuzaEstate does not mark permits as &ldquo;Approved&rdquo; without supporting reference metadata.
          </p>
          <div className="space-y-2">
            {project.approvals.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-slate-50 border rounded-2xl text-xs">
                <div>
                  <div className="font-bold text-slate-900">{app.name}</div>
                  <div className="text-slate-500">Ref: {app.referenceNumber || "N/A"} • Auth: {app.issuingAuthority || "N/A"}</div>
                </div>
                <span className="px-2.5 py-1 font-bold rounded-lg bg-emerald-100 text-emerald-800">
                  {APPROVAL_STATUS_LABELS[app.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentStep === 6 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Step 6: Communication Protocols</h3>
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border">
            <div>
              <span className="text-slate-400 block uppercase font-bold">Primary Channel</span>
              <span className="font-bold text-slate-900">{project.communication.primaryChannel}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold">Progress Report Frequency</span>
              <span className="font-bold text-slate-900">{project.communication.progressReportFrequency}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold">Site Meetings</span>
              <span className="font-bold text-slate-900">{project.communication.siteMeetingFrequency}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold">Emergency Contacts</span>
              <span className="font-bold text-slate-900">{project.communication.emergencyContacts}</span>
            </div>
          </div>
        </div>
      )}

      {currentStep === 7 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Step 7: Final Baseline Review & Activation</h3>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
            <label className="flex items-center gap-3 text-xs font-semibold text-emerald-900 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedBaseline}
                onChange={(e) => setAgreedBaseline(e.target.checked)}
                className="w-4 h-4 text-[#2ec440] rounded focus:ring-[#2ec440]"
              />
              <span>I confirm that the design baseline, scope of work, budget, team assignments, and schedule have been reviewed and accepted.</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleConfirmStep}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
            >
              Confirm Setup (As {currentRole.toUpperCase()})
            </button>

            <button
              onClick={handleActivate}
              disabled={!allReady || !agreedBaseline || isSubmitting}
              className="px-6 py-2.5 bg-[#2ec440] text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-40"
            >
              Activate Execution Project →
            </button>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <button
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          ← Previous
        </button>
        <button
          onClick={() => setCurrentStep((prev) => Math.min(7, prev + 1))}
          disabled={currentStep === 7}
          className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 disabled:opacity-40"
        >
          Next Step →
        </button>
      </div>
    </div>
  );
}
