"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExecutionProject, EXECUTION_STATUS_LABELS, EXECUTION_ROLE_LABELS, ExecutionRole } from "../../lib/execution/types";

interface ExecutionHeaderProps {
  project: ExecutionProject;
  currentRole: ExecutionRole;
  basePath?: string; // default "/execution/[id]"
}

export function ExecutionHeader({ project, currentRole, basePath }: ExecutionHeaderProps) {
  const pathname = usePathname();
  const rootPath = basePath || `/execution/${project.id}`;

  const tabs = [
    { key: "overview", label: "Overview", href: `${rootPath}` },
    { key: "schedule", label: "Schedule", href: `${rootPath}/schedule` },
    { key: "milestones", label: "Milestones", href: `${rootPath}/milestones` },
    { key: "site-diary", label: "Site Diary", href: `${rootPath}/site-diary` },
    { key: "progress", label: "Progress", href: `${rootPath}/progress` },
    { key: "materials", label: "Materials", href: `${rootPath}/materials` },
    { key: "inspections", label: "Inspections", href: `${rootPath}/inspections` },
    { key: "changes", label: "Changes", href: `${rootPath}/changes` },
    { key: "issues", label: "Issues", href: `${rootPath}/issues` },
    { key: "documents", label: "Documents", href: `${rootPath}/documents` },
    { key: "handover", label: "Handover", href: `${rootPath}/handover` },
    { key: "activity", label: "Activity", href: `${rootPath}/activity` },
  ];

  const getStatusBadge = () => {
    switch (project.status) {
      case "active":
      case "ready_to_start":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "at_risk":
      case "delayed":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "paused":
        return "bg-slate-100 text-slate-800 border-slate-300";
      case "substantial_completion":
      case "snagging":
      case "ready_for_handover":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "handed_over":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const hasStopWork = project.issues.some((i) => i.priority === "stop_work" && i.status !== "closed" && i.status !== "resolved");

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      {hasStopWork && (
        <div className="bg-red-600 text-white px-4 py-2 text-xs sm:text-sm font-bold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>CRITICAL SAFETY ALERT: A STOP WORK ORDER HAS BEEN ISSUED FOR THIS SITE. ALL WORK PAUSED.</span>
          </div>
          <Link href={`${rootPath}/issues`} className="underline hover:opacity-90">View Issue</Link>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3">
        {/* Top bar with back button & titles */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Execution Project</span>
              <span>•</span>
              <span>{project.sourceType === "build" ? "Build Construction" : "Renovation"}</span>
              <span>•</span>
              <span className="font-mono text-slate-700">{project.id}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadge()}`}>
                {EXECUTION_STATUS_LABELS[project.status]}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                Viewing as: <strong className="text-slate-900">{EXECUTION_ROLE_LABELS[currentRole]}</strong>
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1 flex items-center gap-3">
              <span>📍 {project.location}</span>
              <span>•</span>
              <span>Contractor: <strong>{project.contractorName}</strong></span>
              <span>•</span>
              <span>Target Completion: <strong>{project.targetCompletionDate}</strong></span>
            </p>
          </div>

          {/* Value & Progress Summary */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 min-w-[280px]">
            <div className="flex-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-1">
                <span>Overall Progress</span>
                <span className="text-[#2ec440]">{project.overallProgressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-[#2ec440] h-2 rounded-full transition-all duration-500" style={{ width: `${project.overallProgressPercent}%` }} />
              </div>
            </div>
            <div className="border-l border-slate-200 pl-3.5 text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Revised Contract</div>
              <div className="text-sm font-bold text-slate-900">
                {project.contractValue.toLocaleString()} <span className="text-xs text-slate-500">{project.currency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contextual Next Action Card */}
        {project.nextRequiredAction && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs sm:text-sm text-emerald-900">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 text-base">📌</span>
              <span><strong>Next Required Action:</strong> {project.nextRequiredAction}</span>
            </div>
            <Link href={`${rootPath}/schedule`} className="font-bold text-[#2ec440] hover:underline whitespace-nowrap ml-2">
              Take Action →
            </Link>
          </div>
        )}

        {/* Workspace Navigation Tabs */}
        <div className="mt-5 border-t border-slate-200 pt-2 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.key === "overview" ? pathname === rootPath : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
