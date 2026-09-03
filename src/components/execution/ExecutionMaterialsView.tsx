"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ExecutionProject, MaterialItem, MaterialSubstitution, MATERIAL_STATUS_LABELS, ExecutionRole } from "../../lib/execution/types";
import { canPerformExecutionAction } from "../../lib/execution/permissions";
import Dialog from "../Dialog";

interface MaterialsViewProps {
  project: ExecutionProject;
  currentRole: ExecutionRole;
}

export function ExecutionMaterialsView({ project, currentRole }: MaterialsViewProps) {
  const [activeTab, setActiveTab] = useState<"materials" | "substitutions">("materials");
  const [selectedSub, setSelectedSub] = useState<MaterialSubstitution | null>(null);

  const canApproveSub = canPerformExecutionAction(currentRole, "material.substitution_approve");

  return (
    <div className="space-y-6">
      {/* Subnav */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Materials, Deliveries & Substitution Workflow</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Contractors cannot silently replace agreed materials. Substitutions require professional & customer review.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border text-xs font-semibold">
          <button
            onClick={() => setActiveTab("materials")}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              activeTab === "materials" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-600"
            }`}
          >
            Material Deliveries ({project.materials.length})
          </button>
          <button
            onClick={() => setActiveTab("substitutions")}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              activeTab === "substitutions" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-600"
            }`}
          >
            Substitution Requests ({project.substitutions.length})
          </button>
        </div>
      </div>

      {activeTab === "materials" && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b">
                <tr>
                  <th className="p-4">Material & Specification</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Delivery Status</th>
                  <th className="p-4">Inspection</th>
                  <th className="p-4">Storage Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {project.materials.map((mat) => (
                  <tr key={mat.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{mat.materialName}</div>
                      <div className="text-slate-500 text-[11px]">{mat.specification}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-800">{mat.quantity} {mat.unit}</td>
                    <td className="p-4 text-slate-700">{mat.sourceSupplier}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {MATERIAL_STATUS_LABELS[mat.status]}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 uppercase text-[10px]">{mat.inspectionStatus}</td>
                    <td className="p-4 text-slate-600">{mat.storageLocationOnSite || "On Site"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "substitutions" && (
        <div className="space-y-4">
          {project.substitutions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-sm">
              No material substitution requests submitted.
            </div>
          ) : (
            project.substitutions.map((sub) => (
              <div key={sub.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">{sub.id}</span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      Substitute &ldquo;{sub.originalMaterial}&rdquo; → &ldquo;{sub.proposedReplacement}&rdquo;
                    </h3>
                  </div>

                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    {sub.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-2xl border space-y-1">
                    <div className="font-bold text-slate-800">Reason for Substitution:</div>
                    <p className="text-slate-600">{sub.reason}</p>
                    <div className="pt-2 text-slate-700">
                      Cost Impact: <strong className={sub.costImpact <= 0 ? "text-emerald-600" : "text-amber-600"}>
                        {sub.costImpact.toLocaleString()} RWF
                      </strong>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border space-y-1 text-slate-700">
                    <div>Performance Diff: <strong>{sub.performanceDifference}</strong></div>
                    <div>Appearance Diff: <strong>{sub.appearanceDifference}</strong></div>
                    <div>Professional Recommendation: <strong>{sub.professionalNotes || "Pending Review"}</strong></div>
                  </div>
                </div>

                {canApproveSub && sub.status === "under_review" && (
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setSelectedSub(sub)} className="px-4 py-2 bg-[#2ec440] text-white rounded-xl text-xs font-bold">
                      Review & Approve Substitution
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
