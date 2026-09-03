"use client";

import React, { use } from "react";
import { useAuth } from "@/lib/auth-context";
import { useExecutionProject } from "@/lib/execution/hooks";
import { ExecutionHeader } from "@/components/execution/ExecutionHeader";
import { ExecutionScheduleView } from "@/components/execution/ExecutionScheduleView";

export default function ProfessionalExecutionDetailPage({ params }: { params: Promise<{ executionId: string }> }) {
  const { executionId } = use(params);
  const { activeRole } = useAuth();
  const { project, isLoading } = useExecutionProject(executionId);

  const currentRole = activeRole === "contractor" ? "contractor" : activeRole === "professional" ? "architect" : activeRole === "administrator" ? "administrator" : "contractor";

  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading project details...</div>;
  if (!project) return <div className="p-8 text-center font-bold text-slate-600">Project Not Found</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <ExecutionHeader project={project} currentRole={currentRole} basePath={`/professional/execution/${project.id}`} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <ExecutionScheduleView project={project} currentRole={currentRole} />
      </div>
    </div>
  );
}
