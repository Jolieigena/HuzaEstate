"use client";

import React, { use } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useExecutionProject } from "@/lib/execution/hooks";
import { ExecutionHeader } from "@/components/execution/ExecutionHeader";
import { ExecutionSetupWizard } from "@/components/execution/ExecutionSetupWizard";

export default function CustomerExecutionOverviewPage({ params }: { params: Promise<{ executionId: string }> }) {
  const { executionId } = use(params);
  const { account, activeRole } = useAuth();
  const { project, isLoading } = useExecutionProject(executionId);

  const currentRole = activeRole === "contractor" ? "contractor" : activeRole === "professional" ? "architect" : activeRole === "administrator" ? "administrator" : "customer";

  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading execution project...</div>;
  if (!project) return <div className="p-8 text-center text-slate-600 font-bold">Execution Project Not Found</div>;

  // Show setup wizard if project in setup phase
  if (project.status === "setup_in_progress" || project.status === "awaiting_team_confirmation") {
    return (
      <div className="min-h-screen bg-slate-50 pb-12">
        <ExecutionHeader project={project} currentRole={currentRole} />
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <ExecutionSetupWizard project={project} currentRole={currentRole} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <ExecutionHeader project={project} currentRole={currentRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Current Phase</span>
            <div className="text-lg font-bold text-slate-900">{project.tasks.find((t) => t.status === "in_progress")?.phase || "Site Execution"}</div>
            <div className="text-xs text-slate-500">Target completion: {project.targetCompletionDate}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Accepted Baseline Value</span>
            <div className="text-lg font-bold text-slate-900">{project.originalContractValue.toLocaleString()} {project.currency}</div>
            <div className="text-xs text-slate-500">Quotation value baseline</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Approved Change Orders</span>
            <div className="text-lg font-bold text-emerald-600">
              +{(project.contractValue - project.originalContractValue).toLocaleString()} {project.currency}
            </div>
            <div className="text-xs text-slate-500">{project.changeOrders.length} approved change orders</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Handover Readiness</span>
            <div className="text-lg font-bold text-blue-700">{project.handoverStatus.replace("_", " ").toUpperCase()}</div>
            <div className="text-xs text-slate-500">{project.defects.length} open snag items</div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Main Stream */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Work Package Summary */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-lg font-bold text-slate-900">Active Work Packages</h3>
                <Link href={`/execution/${project.id}/schedule`} className="text-xs font-bold text-[#2ec440] hover:underline">View Full Schedule →</Link>
              </div>

              <div className="space-y-3">
                {project.workPackages.map((wp) => (
                  <div key={wp.id} className="p-4 bg-slate-50 border rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between items-center font-bold text-slate-900 text-sm">
                      <span>{wp.name}</span>
                      <span className="text-[#2ec440]">{wp.progressPercent}%</span>
                    </div>
                    <p className="text-slate-600">{wp.description}</p>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#2ec440] h-1.5 rounded-full" style={{ width: `${wp.progressPercent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest Progress Report */}
            {project.progressReports.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-lg font-bold text-slate-900">Latest Contractor Progress Report</h3>
                  <Link href={`/execution/${project.id}/progress`} className="text-xs font-bold text-[#2ec440] hover:underline">All Reports →</Link>
                </div>
                <div className="text-xs text-slate-600 space-y-2">
                  <p><strong>Completed Work:</strong> {project.progressReports[0].completedWorkSummary}</p>
                  <p><strong>Current Focus:</strong> {project.progressReports[0].currentWorkSummary}</p>
                  <p><strong>Forecast:</strong> {project.progressReports[0].updatedCompletionForecast}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Quick Actions */}
          <div className="space-y-6">
            {/* Team Contacts */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">Assigned Project Team</h3>
              <div className="space-y-2">
                {project.team.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-50 border rounded-2xl text-xs space-y-0.5">
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-slate-500 uppercase text-[10px] font-bold">{t.role}</div>
                    <div className="text-slate-600">{t.email} • {t.phone}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity Log */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
                <Link href={`/execution/${project.id}/activity`} className="text-xs font-bold text-[#2ec440] hover:underline">Full Log →</Link>
              </div>
              <div className="space-y-2 text-xs">
                {project.activity.slice(0, 4).map((act) => (
                  <div key={act.id} className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                    <div className="font-semibold text-slate-800">{act.summary}</div>
                    <div className="text-[10px] text-slate-400">{new Date(act.timestamp).toLocaleDateString()} by {act.actorName}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
