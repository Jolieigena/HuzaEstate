"use client";

import React, { use } from "react";
import { useAuth } from "@/lib/auth-context";
import { useExecutionProject } from "@/lib/execution/hooks";
import { ExecutionHeader } from "@/components/execution/ExecutionHeader";
import { ExecutionChangesView } from "@/components/execution/ExecutionChangesView";

export default function CustomerExecutionChangesPage({ params }: { params: Promise<{ executionId: string }> }) {
  const { executionId } = use(params);
  const { activeRole } = useAuth();
  const { project, isLoading } = useExecutionProject(executionId);

  const currentRole = activeRole === "contractor" ? "contractor" : activeRole === "professional" ? "architect" : activeRole === "administrator" ? "administrator" : "customer";

  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading change orders...</div>;
  if (!project) return <div className="p-8 text-center font-bold text-slate-600">Project Not Found</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <ExecutionHeader project={project} currentRole={currentRole} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <ExecutionChangesView project={project} currentRole={currentRole} />
      </div>
    </div>
  );
}
