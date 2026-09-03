"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/shared/RequireAuth";
import ProjectCard from "@/components/build/ProjectCard";
import { useBuildProjects } from "@/lib/build/hooks";
import { BuildProjectService } from "@/lib/build/projectService";
import { BuildProjectStatus, CreationMode, CREATION_MODE_LABELS, PROJECT_STATUS_LABELS } from "@/lib/build/types";
import { projectLocationLabel } from "@/lib/build/format";

type SortKey = "recent" | "oldest" | "name";

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="text-3xl font-black text-slate-900 mb-1">{value}</div>
      <div className="text-sm font-semibold text-slate-500">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 sm:p-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#2ec440]/10 text-[#2ec440] flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9.5L12 3l9 6.5M4.5 10.5V20a1 1 0 001 1h4.75v-6.5h3.5V21H19.5a1 1 0 001-1v-9.5" />
        </svg>
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-3">Start your first home design</h2>
      <p className="text-slate-500 leading-relaxed max-w-md mx-auto mb-8">
        Create a Build project to design a conceptual house with Huza AI, by hand, or from a ready-made template — then compare directions and save the one you like.
      </p>
      <Link href="/studio/build/new" className="inline-block bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 px-8 rounded-xl transition-colors shadow-lg mb-6">
        Create Build Project
      </Link>
      <div className="flex items-center justify-center gap-6 text-sm font-semibold">
        <Link href="/build" className="text-[#2ec440] hover:text-[#28b039] transition-colors">
          Read the Build guide
        </Link>
        <Link href="/build" className="text-[#2ec440] hover:text-[#28b039] transition-colors">
          Watch the demo
        </Link>
      </div>
    </div>
  );
}

export default function BuildDashboardPage() {
  const { projects, ready } = useBuildProjects();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BuildProjectStatus | "all">("all");
  const [modeFilter, setModeFilter] = useState<CreationMode | "all">("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const visibleProjects = useMemo(() => projects.filter((p) => p.status !== "archived"), [projects]);

  const summary = useMemo(
    () => ({
      total: visibleProjects.length,
      draft: visibleProjects.filter((p) => p.status === "draft" || p.status === "brief_in_progress").length,
      conceptsReady: visibleProjects.filter((p) => p.status === "concepts_ready").length,
      awaitingReview: visibleProjects.filter((p) => p.status === "awaiting_professional_review").length,
    }),
    [visibleProjects]
  );

  const filtered = useMemo(() => {
    let list = visibleProjects;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => p.name.toLowerCase().includes(q) || projectLocationLabel(p).toLowerCase().includes(q));
    }
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    if (modeFilter !== "all") list = list.filter((p) => p.creationMode === modeFilter);

    const sorted = [...list];
    if (sort === "recent") sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    else if (sort === "oldest") sorted.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    else sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [visibleProjects, search, statusFilter, modeFilter, sort]);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/dashboard" className="hover:text-slate-900 font-semibold transition-colors">
              My Dashboard
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 font-semibold">Build Projects</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">My Build Projects</h1>
              <p className="text-slate-500 font-medium">Design, compare and refine your home concepts with Huza AI.</p>
            </div>
            <Link
              href="/studio/build/new"
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-6 py-3.5 rounded-xl transition-colors shadow-lg whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Build Project
            </Link>
          </div>

          {!ready ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-pulse">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <SummaryCard label="Total projects" value={summary.total} />
              <SummaryCard label="Draft projects" value={summary.draft} />
              <SummaryCard label="Concepts ready" value={summary.conceptsReady} />
              <SummaryCard label="Awaiting review" value={summary.awaitingReview} />
            </div>
          )}

          {ready && visibleProjects.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 sm:p-5 mb-8 flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="relative flex-grow">
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 10.5A6.5 6.5 0 114 10.5a6.5 6.5 0 0113 0z" />
                </svg>
                <label htmlFor="build-search" className="sr-only">
                  Search projects
                </label>
                <input
                  id="build-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or location"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="sr-only" htmlFor="status-filter">
                  Filter by status
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as BuildProjectStatus | "all")}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
                >
                  <option value="all">All statuses</option>
                  {Object.entries(PROJECT_STATUS_LABELS)
                    .filter(([key]) => key !== "archived")
                    .map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                </select>

                <label className="sr-only" htmlFor="mode-filter">
                  Filter by creation mode
                </label>
                <select
                  id="mode-filter"
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value as CreationMode | "all")}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
                >
                  <option value="all">All creation modes</option>
                  {Object.entries(CREATION_MODE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>

                <label className="sr-only" htmlFor="sort-by">
                  Sort by
                </label>
                <select
                  id="sort-by"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
                >
                  <option value="recent">Recently updated</option>
                  <option value="oldest">Oldest</option>
                  <option value="name">Project name</option>
                </select>
              </div>
            </div>
          )}

          {!ready ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-96 bg-white rounded-3xl border border-slate-100" />
              ))}
            </div>
          ) : visibleProjects.length === 0 ? (
            <EmptyState />
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
              <p className="text-slate-500 font-semibold">No projects match your search or filters.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setModeFilter("all");
                }}
                className="mt-4 text-[#2ec440] hover:text-[#28b039] font-bold text-sm"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          {ready && projects.some((p) => p.status === "archived") && (
            <p className="text-center text-sm text-slate-400 mt-8">
              {projects.filter((p) => p.status === "archived").length} archived project
              {projects.filter((p) => p.status === "archived").length === 1 ? "" : "s"} hidden from this view.
            </p>
          )}
        </div>
      </div>
      {(() => {
        // Surface a storage-unavailable notice without blocking the page.
        return !BuildProjectService.isStorageAvailable() ? (
          <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:max-w-sm bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold rounded-2xl px-4 py-3 shadow-lg z-40">
            Your browser storage is unavailable, so changes in this session won&apos;t be saved after you leave.
          </div>
        ) : null;
      })()}
    </RequireAuth>
  );
}
