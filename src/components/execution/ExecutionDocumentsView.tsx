"use client";

import React, { useState } from "react";
import { ExecutionProject, ExecutionDocument, ExecutionRole } from "../../lib/execution/types";

interface DocumentsViewProps {
  project: ExecutionProject;
  currentRole: ExecutionRole;
}

export function ExecutionDocumentsView({ project }: DocumentsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredDocs = selectedCategory === "all"
    ? project.documents
    : project.documents.filter((d) => d.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Project Documents & Repository</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Baseline designs, permits, inspection reports, change orders, and handover certificates with access controls.
          </p>
        </div>

        <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800">
          + Upload Document
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 text-xs font-semibold">
        {["all", "baseline_design", "approvals_permits", "inspection_reports", "change_orders", "warranties"].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl capitalize whitespace-nowrap transition-colors ${
              selectedCategory === cat ? "bg-slate-900 text-white font-bold" : "bg-white border text-slate-600 hover:bg-slate-50"
            }`}
          >
            {cat.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Documents Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b">
              <tr>
                <th className="p-4">Document Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Access Label</th>
                <th className="p-4">Uploaded By</th>
                <th className="p-4">Version</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No documents found in this category.</td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                      <span>📄</span>
                      <span>{doc.name}</span>
                    </td>
                    <td className="p-4 text-slate-600 uppercase text-[10px] font-semibold">{doc.category.replace("_", " ")}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 border">
                        {doc.accessLabel.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700">{doc.uploadedByName} ({doc.uploadedByRole})</td>
                    <td className="p-4 font-mono font-bold text-slate-600">v{doc.version}</td>
                    <td className="p-4 text-right">
                      <button className="px-3 py-1.5 border rounded-xl font-semibold hover:bg-slate-100">Download</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
