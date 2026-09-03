"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useExecutionProjects, filterExecutionProjects } from "@/lib/execution/hooks";
import { ExecutionProjectCard } from "@/components/execution/ExecutionProjectCard";

export default function ProfessionalExecutionDashboardPage() {
  const { account, activeRole } = useAuth();
  const userId = account?.id || "imara-user";
  const currentRole = activeRole === "contractor" ? "contractor" : "architect";
  const { projects, isLoading } = useExecutionProjects(userId, currentRole);
  const [filter, setFilter] = useState<"all" | "active" | "at_risk" | "handover" | "completed">("active");

  const displayedProjects = filterExecutionProjects(projects, filter);

  // Compute operational overview stats for contractor/professional
  const activeSites = projects.filter((p) => p.status === "active").length;
  const delayedProjects = projects.filter((p) => p.status === "delayed" || p.status === "at_risk").length;
  const pendingInspections = projects.reduce((acc, p) => acc + p.inspections.filter((i) => i.outcome === "scheduled").length, 0);
  const pendingMilestones = projects.reduce((acc, p) => acc + p.milestones.filter((m) => m.status === "submitted_for_review" || m.status === "in_progress").length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#2ec440]">Contractor & Professional Workspace</div>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Site Delivery & Execution Operations</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage active construction sites, submit site diary entries, record material deliveries, and schedule stage inspections.
          </p>
        </div>

        <Link
          href="/professional"
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          ← Return to Main Workspace
        </Link>
      </div>

      {/* Operational Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Active Sites</span>
          <div className="text-2xl font-bold text-slate-900">{activeSites}</div>
          <div className="text-xs text-slate-500">Currently executing</div>
        </div>

        <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Delayed / At Risk</span>
          <div className="text-2xl font-bold text-amber-600">{delayedProjects}</div>
          <div className="text-xs text-slate-500 font-medium">Requires recovery plan</div>
        </div>

        <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Scheduled Inspections</span>
          <div className="text-2xl font-bold text-blue-600">{pendingInspections}</div>
          <div className="text-xs text-slate-500">Awaiting technical audit</div>
        </div>

        <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Pending Milestones</span>
          <div className="text-2xl font-bold text-emerald-600">{pendingMilestones}</div>
          <div className="text-xs text-slate-500">Claims in review</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-semibold">
        {[
          { key: "active", label: "Active Sites" },
          { key: "at_risk", label: "Delayed / At Risk" },
          { key: "handover", label: "Snagging & Handover" },
          { key: "completed", label: "Completed" },
          { key: "all", label: "All Assigned Sites" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap ${
              filter === f.key
                ? "bg-slate-900 text-white shadow-sm font-bold"
                : "bg-white border text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label} ({filterExecutionProjects(projects, f.key as any).length})
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400">Loading assigned sites...</div>
      ) : displayedProjects.length === 0 ? (
        <div className="bg-white border rounded-3xl p-12 text-center text-slate-500 text-sm">
          No assigned sites under this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProjects.map((project) => (
            <ExecutionProjectCard key={project.id} project={project} baseHref="/professional/execution" />
          ))}
        </div>
      )}
    </div>
  );
}
