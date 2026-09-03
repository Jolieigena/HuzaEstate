"use client";

import React, { use } from "react";
import { useAuth } from "@/lib/auth-context";
import { useExecutionProject } from "@/lib/execution/hooks";
import { ExecutionHeader } from "@/components/execution/ExecutionHeader";

export default function CustomerExecutionActivityPage({ params }: { params: Promise<{ executionId: string }> }) {
  const { executionId } = use(params);
  const { activeRole } = useAuth();
  const { project, isLoading } = useExecutionProject(executionId);

  const currentRole = activeRole === "contractor" ? "contractor" : activeRole === "professional" ? "architect" : activeRole === "administrator" ? "administrator" : "customer";

  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading activity...</div>;
  if (!project) return <div className="p-8 text-center font-bold text-slate-600">Project Not Found</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <ExecutionHeader project={project} currentRole={currentRole} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Project Activity & Audit Log</h2>
          <div className="space-y-3">
            {project.activity.map((act) => (
              <div key={act.id} className="p-3.5 bg-slate-50 border rounded-2xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{act.summary}</span>
                  <span className="font-mono text-slate-400 text-[10px]">{new Date(act.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-slate-500">By <strong>{act.actorName}</strong> ({act.actorRole}) • Tab: {act.relatedTab || "General"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
