"use client";

import React, { useState } from "react";
import { ExecutionProject, ExecutionMilestone, MILESTONE_STATUS_LABELS, PAYMENT_ELIGIBILITY_LABELS, ExecutionRole } from "../../lib/execution/types";
import { canPerformExecutionAction } from "../../lib/execution/permissions";
import Dialog from "../Dialog";
import Link from "next/link";

interface MilestonesViewProps {
  project: ExecutionProject;
  currentRole: ExecutionRole;
}

export function ExecutionMilestonesView({ project, currentRole }: MilestonesViewProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<ExecutionMilestone | null>(null);
  const [submitSummary, setSubmitSummary] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const canSubmit = canPerformExecutionAction(currentRole, "milestone.submit");
  const canCustomerReview = canPerformExecutionAction(currentRole, "milestone.review_customer");

  return (
    <div className="space-y-6">
      {/* Informational Banner on Milestone Funding */}
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 sm:p-5 flex items-start justify-between gap-3 text-xs sm:text-sm text-blue-900">
        <div className="flex items-start gap-3">
          <span className="text-xl">ℹ️</span>
          <div>
            <h4 className="font-bold text-blue-950">Milestone Funding & Payment Eligibility</h4>
            <p className="mt-0.5 text-blue-800">
              Milestones track technical completion, customer review, and payment eligibility based on agreed quotation values.
              <strong> Milestone funding, release and settlement are managed on the dedicated Payments page in demonstration (Mock) mode.</strong> No real bank, card, or mobile-money details are collected here.
            </p>
          </div>
        </div>
        <Link href={`/execution/${project.id}/payments`} className="hidden sm:inline-flex flex-shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] whitespace-nowrap">
          View Payments
        </Link>
      </div>
      <Link href={`/execution/${project.id}/payments`} className="sm:hidden -mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
        View Payments
      </Link>

      {/* Milestones Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Contract Milestones & Claim Eligibility</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {project.milestones.length} total milestones allocated across contract value of {project.contractValue.toLocaleString()} {project.currency}.
          </p>
        </div>
      </div>

      {/* Milestones Grid / List */}
      <div className="space-y-4">
        {project.milestones.map((m) => (
          <div key={m.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-slate-400 font-mono">{m.id}</span>
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                    {MILESTONE_STATUS_LABELS[m.status]}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{m.title}</h3>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 border rounded-2xl p-3">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Allocation</div>
                  <div className="text-sm font-bold text-slate-900">{m.contractValueAllocation.toLocaleString()} {project.currency}</div>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-xl border ${
                  m.paymentEligibility === "eligible" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300"
                }`}>
                  {PAYMENT_ELIGIBILITY_LABELS[m.paymentEligibility]}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600">{m.description}</p>

            {/* Criteria & Reviews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border">
                <span className="font-bold text-slate-700 block mb-1">Completion Criteria:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                  {m.completionCriteria.map((c, idx) => <li key={idx}>{c}</li>)}
                </ul>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border space-y-1 text-slate-700">
                <div>Customer Review: <strong>{m.customerAcceptedAt ? `Accepted on ${m.customerAcceptedAt}` : m.customerReviewNotes || "Pending Review"}</strong></div>
                <div>Professional Review: <strong>{m.professionalApprovedAt ? `Approved on ${m.professionalApprovedAt}` : m.professionalReviewNotes || "Pending Review"}</strong></div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-end gap-3 pt-2">
              {canSubmit && m.status !== "accepted" && (
                <button
                  onClick={() => setSelectedMilestone(m)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                >
                  Submit Milestone for Review
                </button>
              )}

              {canCustomerReview && m.status === "submitted_for_review" && (
                <button
                  onClick={() => setSelectedMilestone(m)}
                  className="px-4 py-2 bg-[#2ec440] text-white rounded-xl text-xs font-bold hover:opacity-90"
                >
                  Accept Milestone
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Milestone Modal */}
      {selectedMilestone && (
        <Dialog open={Boolean(selectedMilestone)} onClose={() => setSelectedMilestone(null)} labelledBy="ms-sub-title">
          <form onSubmit={(e) => { e.preventDefault(); setSelectedMilestone(null); }} className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 id="ms-sub-title" className="text-lg font-bold text-slate-900">Milestone Review: {selectedMilestone.title}</h3>
              <button type="button" onClick={() => setSelectedMilestone(null)} className="text-slate-400 hover:text-slate-600 font-bold" data-dialog-close>✕</button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Completion Summary</label>
              <textarea rows={3} value={submitSummary} onChange={(e) => setSubmitSummary(e.target.value)} placeholder="Provide milestone completion summary..." className="w-full px-3 py-2 border rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Evidence Photo / Document URL</label>
              <input type="url" value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border rounded-xl text-sm" />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button type="button" onClick={() => setSelectedMilestone(null)} className="px-4 py-2 border rounded-xl text-sm font-semibold">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-[#2ec440] text-white rounded-xl text-sm font-bold">Submit Milestone</button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
