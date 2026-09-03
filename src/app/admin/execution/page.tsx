"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useExecutionProjects } from "@/lib/execution/hooks";
import { EXECUTION_STATUS_LABELS } from "@/lib/execution/types";

export default function AdminExecutionOverviewPage() {
  const { account } = useAuth();
  const { projects, isLoading } = useExecutionProjects(account?.id, "administrator");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#2ec440]">Administration Portal</div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Construction & Renovation Execution Oversight</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Platform-wide metadata monitoring, lifecycle audit events, dispute investigation, and workflow control.
          </p>
        </div>

        <span className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold font-mono">
          {projects.length} Total Projects Managed
        </span>
      </div>

      {/* Projects Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b">
              <tr>
                <th className="p-4">Project & Type</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Contractor</th>
                <th className="p-4">Status</th>
                <th className="p-4">Progress</th>
                <th className="p-4">Revised Value</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Loading operational data...</td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">No execution projects logged.</td>
                </tr>
              ) : (
                projects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{proj.name}</div>
                      <div className="text-slate-400 font-mono text-[10px]">{proj.id} • {proj.sourceType.toUpperCase()}</div>
                    </td>
                    <td className="p-4 text-slate-700">{proj.customerName}</td>
                    <td className="p-4 font-semibold text-slate-800">{proj.contractorName}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-100 text-slate-800 border">
                        {EXECUTION_STATUS_LABELS[proj.status]}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-[#2ec440]">{proj.overallProgressPercent}%</td>
                    <td className="p-4 font-bold text-slate-900">{proj.contractValue.toLocaleString()} {proj.currency}</td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/execution/${proj.id}`}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800"
                      >
                        Inspect Metadata →
                      </Link>
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
