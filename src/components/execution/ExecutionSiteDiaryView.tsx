"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ExecutionProject, SiteDiaryEntry, ExecutionRole } from "../../lib/execution/types";
import { SiteDiaryService } from "../../lib/execution/executionService";
import { AddSiteDiaryModal } from "./ExecutionModals";
import { canPerformExecutionAction } from "../../lib/execution/permissions";
import Dialog from "../Dialog";

interface SiteDiaryViewProps {
  project: ExecutionProject;
  currentRole: ExecutionRole;
}

export function ExecutionSiteDiaryView({ project, currentRole }: SiteDiaryViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<SiteDiaryEntry | null>(null);
  const [commentText, setCommentText] = useState("");
  const [amendReason, setAmendReason] = useState("");
  const [amendField, setAmendField] = useState("");
  const [amendValue, setAmendValue] = useState("");

  const canCreate = canPerformExecutionAction(currentRole, "site_diary.create");

  const handleAddEntry = (data: any) => {
    SiteDiaryService.addEntry(
      project.id,
      {
        ...data,
        contractorTeams: ["Main Masonry Team", "Electrical Crew"],
        equipmentOnSite: ["Mixer", "Scaffolding"],
        materialsUsed: ["Cement", "Sand"],
        deliveriesReceived: [],
        siteConditions: "Clean and safe",
        visitors: [],
        inspectionsHeld: [],
        delaysEncountered: "None",
        incidents: "None",
        safetyObservations: "All PPE compliant",
        videoUrls: [],
        submittedBy: currentRole === "customer" ? project.customerName : project.contractorName,
        submittedByRole: currentRole,
        submittedAt: new Date().toISOString(),
      },
      currentRole === "customer" ? project.customerName : project.contractorName,
      currentRole
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry || !commentText.trim()) return;
    SiteDiaryService.addComment(
      project.id,
      selectedEntry.id,
      commentText,
      currentRole === "customer" ? project.customerName : currentRole === "contractor" ? project.contractorName : "Assigned Professional",
      currentRole
    );
    setCommentText("");
  };

  const handleAmendEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry || !amendReason.trim() || !amendField.trim()) return;
    SiteDiaryService.amendEntry(
      project.id,
      selectedEntry.id,
      amendReason,
      { [amendField]: { before: (selectedEntry as any)[amendField] || "", after: amendValue } },
      currentRole === "customer" ? project.customerName : project.contractorName,
      currentRole
    );
    setAmendReason("");
    setAmendField("");
    setAmendValue("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Daily Site Diary & Activity Records</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Original contractor entries are permanently locked upon submission. Amendments track changes with full history diffs.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
          >
            + Log Daily Diary Entry
          </button>
        )}
      </div>

      {/* Diary Entries List */}
      <div className="space-y-4">
        {project.siteDiary.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-sm">
            No site diary entries logged yet.
          </div>
        ) : (
          project.siteDiary.map((entry) => (
            <div key={entry.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">📅 {entry.date}</span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                      entry.status === "locked" ? "bg-slate-100 text-slate-700" : "bg-purple-100 text-purple-800"
                    }`}>
                      {entry.status === "locked" ? "🔒 Locked Entry" : "✏️ Amended with History"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Logged by <strong>{entry.submittedBy}</strong> ({entry.submittedByRole}) at {new Date(entry.submittedAt).toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs bg-slate-50 border rounded-2xl px-3 py-1.5 font-medium text-slate-700">
                  <span>👷 Labour: <strong>{entry.labourCount}</strong></span>
                  <span>•</span>
                  <span>🌤️ Weather: <strong>{entry.weatherSummary}</strong></span>
                </div>
              </div>

              {/* Work Summaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border">
                  <span className="font-bold text-slate-800 block mb-1">Work Completed:</span>
                  <p className="text-slate-600">{entry.workCompleted}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border">
                  <span className="font-bold text-slate-800 block mb-1">Work In Progress & Materials:</span>
                  <p className="text-slate-600">{entry.workInProgress}</p>
                </div>
              </div>

              {/* Photos Gallery */}
              {entry.photoUrls.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-2">Site Evidence Photographs:</span>
                  <div className="flex gap-3 overflow-x-auto">
                    {entry.photoUrls.map((url, idx) => (
                      <div key={idx} className="relative w-32 h-24 rounded-2xl overflow-hidden border bg-slate-100">
                        <Image src={url} alt="Site evidence" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amendment History Diff */}
              {entry.amendments.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 text-xs text-purple-900 space-y-2">
                  <span className="font-bold uppercase text-[10px]">Amendment Audit History:</span>
                  {entry.amendments.map((am, idx) => (
                    <div key={idx} className="border-t border-purple-200/60 pt-1.5 space-y-1">
                      <div>Amended by <strong>{am.amendedBy}</strong> ({am.role}) — Reason: &ldquo;{am.reason}&rdquo;</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Commentary Section */}
              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Comments & Clarifications ({entry.comments.length})</span>
                  <button onClick={() => setSelectedEntry(entry)} className="text-[#2ec440] hover:underline">
                    + Add Comment / Amend
                  </button>
                </div>
                {entry.comments.map((c) => (
                  <div key={c.id} className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-0.5">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>{c.authorName} ({c.authorRole})</span>
                      <span className="text-[10px] text-slate-400">{new Date(c.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-600">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Adding Entry */}
      <AddSiteDiaryModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddEntry}
      />

      {/* Modal for Commenting / Amending */}
      {selectedEntry && (
        <Dialog open={Boolean(selectedEntry)} onClose={() => setSelectedEntry(null)} labelledBy="diary-comment-title">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 id="diary-comment-title" className="text-lg font-bold text-slate-900">Diary Commentary & Amendment</h3>
              <button onClick={() => setSelectedEntry(null)} className="text-slate-400 hover:text-slate-600 font-bold" data-dialog-close>✕</button>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-700">Add Public Stakeholder Comment</h4>
              <textarea rows={2} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Type comment..." className="w-full px-3 py-2 border rounded-xl text-sm" />
              <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Post Comment</button>
            </form>

            {/* Contractor Amendment Form */}
            {canCreate && (
              <form onSubmit={handleAmendEntry} className="pt-4 border-t space-y-3">
                <h4 className="text-xs font-bold uppercase text-purple-800">Submit Formal Entry Amendment (Creates Audit Trail)</h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Reason for Amendment</label>
                  <input type="text" value={amendReason} onChange={(e) => setAmendReason(e.target.value)} placeholder="e.g. Corrected labour count from 12 to 14" className="w-full px-3 py-2 border rounded-xl text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={amendField} onChange={(e) => setAmendField(e.target.value)} placeholder="Field (e.g. labourCount)" className="px-3 py-2 border rounded-xl text-sm" />
                  <input type="text" value={amendValue} onChange={(e) => setAmendValue(e.target.value)} placeholder="New Value" className="px-3 py-2 border rounded-xl text-sm" />
                </div>
                <button type="submit" className="px-4 py-2 bg-purple-800 text-white rounded-xl text-xs font-bold">Record Amendment Diff</button>
              </form>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
