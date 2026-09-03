"use client";

import React, { use } from "react";
import Link from "next/link";
import { useExecutionProject } from "@/lib/execution/hooks";
import { ExecutionAdminView } from "@/components/execution/ExecutionAdminView";

export default function AdminExecutionDetailPage({ params }: { params: Promise<{ executionId: string }> }) {
  const { executionId } = use(params);
  const { project, isLoading } = useExecutionProject(executionId);

  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading operational metadata...</div>;
  if (!project) return <div className="p-8 text-center font-bold text-slate-600">Project Not Found</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <span className="text-xs font-bold uppercase text-[#2ec440]">Admin Oversight</span>
          <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
          <span className="text-xs font-mono text-slate-400">ID: {project.id}</span>
        </div>
        <Link href="/admin/execution" className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-slate-50">
          ← Back to Admin Oversight List
        </Link>
      </div>

      <ExecutionAdminView project={project} />
    </div>
  );
}
