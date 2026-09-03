"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useExecutionProjects, filterExecutionProjects } from "@/lib/execution/hooks";
import { ExecutionProjectCard } from "@/components/execution/ExecutionProjectCard";

export default function CustomerExecutionListPage() {
  const { account } = useAuth();
  const userId = account?.id || "demo-user";
  const { projects, isLoading } = useExecutionProjects(userId, "customer");
  const [filter, setFilter] = useState<"all" | "active" | "at_risk" | "handover" | "completed">("active");

  const displayedProjects = filterExecutionProjects(projects, filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#2ec440]">Construction & Renovation</div>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Execution Tracking Workspace</h1>
          <p className="text-sm text-slate-600 mt-1">
            Monitor delivery from project kickoff to site diary entries, stage inspections, change orders, and final handover.
          </p>
        </div>

        {/* Prototype Data Notice */}
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600 flex items-center gap-2">
          <span className="font-bold text-slate-900">Prototype Data:</span>
          <span>Includes active Build, Renovation, and Handover demonstration projects.</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-semibold">
        {[
          { key: "active", label: "Active Sites" },
          { key: "at_risk", label: "At Risk / Delayed" },
          { key: "handover", label: "Approaching Handover" },
          { key: "completed", label: "Completed Projects" },
          { key: "all", label: "All Projects" },
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

      {/* Project Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 font-semibold text-sm">Loading execution projects...</div>
      ) : displayedProjects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <h3 className="text-lg font-bold text-slate-900">No Execution Projects Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Execution projects are created after accepting a contractor quotation or completing a design review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProjects.map((project) => (
            <ExecutionProjectCard key={project.id} project={project} baseHref="/execution" />
          ))}
        </div>
      )}
    </div>
  );
}
