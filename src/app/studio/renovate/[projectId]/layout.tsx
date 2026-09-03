"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import RequireAuth from "@/components/shared/RequireAuth";
import { RenovationProjectProvider } from "@/components/renovate/RenovationProjectContext";
import ProjectWorkspaceLayout from "@/components/renovate/ProjectWorkspaceLayout";
import { useRenovationProject } from "@/lib/renovate/hooks";

function LoadingProject() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="text-sm font-medium">Loading your project…</p>
      </div>
    </div>
  );
}

function ProjectNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">We couldn&apos;t find that project</h1>
        <p className="text-slate-500 leading-relaxed mb-8">
          This Renovation project may have been deleted, or the link you followed might be incorrect. Head back to your Renovation projects to keep going.
        </p>
        <Link href="/studio/renovate" className="inline-block bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 px-8 rounded-xl transition-colors shadow-lg">
          Back to My Renovation Projects
        </Link>
      </div>
    </div>
  );
}

export default function RenovationProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ projectId: string }>();
  const { project, ready } = useRenovationProject(params?.projectId);

  return (
    <RequireAuth>
      {!ready ? (
        <LoadingProject />
      ) : !project ? (
        <ProjectNotFound />
      ) : (
        <RenovationProjectProvider project={project}>
          <ProjectWorkspaceLayout project={project}>{children}</ProjectWorkspaceLayout>
        </RenovationProjectProvider>
      )}
    </RequireAuth>
  );
}
