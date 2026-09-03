"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/shared/RequireAuth";
import ProjectCard from "@/components/renovate/ProjectCard";
import { useRenovationProjects } from "@/lib/renovate/hooks";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import {
  RenovationProjectStatus,
  RenovationCreationMode,
  CREATION_MODE_LABELS,
  RENOVATION_STATUS_LABELS,
  PropertyType,
  PROPERTY_TYPE_LABELS,
  RenovationAreaKey,
  RENOVATION_AREA_LABELS,
} from "@/lib/renovate/types";
import { propertyLocationLabel } from "@/lib/renovate/format";

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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-3">Start your first renovation project</h2>
      <p className="text-slate-500 leading-relaxed max-w-md mx-auto mb-8">
        Create a Renovation project to refresh a room, transform your kitchen or reimagine your exterior with Huza AI, then compare concepts and plan the work.
      </p>
      <Link href="/studio/renovate/new" className="inline-block bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 px-8 rounded-xl transition-colors shadow-lg mb-6">
        Create Renovation Project
      </Link>
      <div className="flex items-center justify-center gap-6 text-sm font-semibold">
        <Link href="/renovate" className="text-[#2ec440] hover:text-[#28b039] transition-colors">
          Read the Renovate guide
        </Link>
        <Link href="/renovate" className="text-[#2ec440] hover:text-[#28b039] transition-colors">
          Watch the demo
        </Link>
      </div>
    </div>
  );
}

export default function RenovateDashboardPage() {
  const { projects, ready } = useRenovationProjects();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RenovationProjectStatus | "all">("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<PropertyType | "all">("all");
  const [areaFilter, setAreaFilter] = useState<RenovationAreaKey | "all">("all");
  const [modeFilter, setModeFilter] = useState<RenovationCreationMode | "all">("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const visibleProjects = useMemo(() => projects.filter((p) => p.status !== "archived"), [projects]);

  const summary = useMemo(
    () => ({
      total: visibleProjects.length,
      assessmentsInProgress: visibleProjects.filter((p) => p.status === "assessment_in_progress" || p.status === "property_setup" || p.status === "draft").length,
      conceptsReady: visibleProjects.filter((p) => p.status === "concepts_ready").length,
      awaitingQuotations: visibleProjects.filter((p) => p.status === "awaiting_quotations" || p.status === "quotation_received").length,
    }),
    [visibleProjects]
  );

  const filtered = useMemo(() => {
    let list = visibleProjects;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || propertyLocationLabel(p).toLowerCase().includes(q));
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    if (propertyTypeFilter !== "all") list = list.filter((p) => p.property.propertyType === propertyTypeFilter);
    if (areaFilter !== "all") list = list.filter((p) => p.assessment.areas.some((a) => a.areaKey === areaFilter));
    if (modeFilter !== "all") list = list.filter((p) => p.creationMode === modeFilter);

    const sorted = [...list];
    if (sort === "recent") sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    else if (sort === "oldest") sorted.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    else sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [visibleProjects, search, statusFilter, propertyTypeFilter, areaFilter, modeFilter, sort]);

  const hasFilters = search || statusFilter !== "all" || propertyTypeFilter !== "all" || areaFilter !== "all" || modeFilter !== "all";

  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/dashboard" className="hover:text-slate-900 font-semibold transition-colors">
              My Dashboard
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 font-semibold">Renovation Projects</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">My Renovation Projects</h1>
              <p className="text-slate-500 font-medium">Plan, compare and refine renovations for the properties you own with Huza AI.</p>
            </div>
            <Link
              href="/studio/renovate/new"
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-6 py-3.5 rounded-xl transition-colors shadow-lg whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Renovation Project
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
              <SummaryCard label="Assessments in progress" value={summary.assessmentsInProgress} />
              <SummaryCard label="Concepts ready" value={summary.conceptsReady} />
              <SummaryCard label="Awaiting quotations" value={summary.awaitingQuotations} />
            </div>
          )}

          {ready && visibleProjects.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 sm:p-5 mb-8 flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="relative flex-grow">
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 10.5A6.5 6.5 0 114 10.5a6.5 6.5 0 0113 0z" />
                </svg>
                <label htmlFor="renovate-search" className="sr-only">
                  Search projects
                </label>
                <input
                  id="renovate-search"
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
                  onChange={(e) => setStatusFilter(e.target.value as RenovationProjectStatus | "all")}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
                >
                  <option value="all">All statuses</option>
                  {Object.entries(RENOVATION_STATUS_LABELS)
                    .filter(([key]) => key !== "archived")
                    .map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                </select>

                <label className="sr-only" htmlFor="property-type-filter">
                  Filter by property type
                </label>
                <select
                  id="property-type-filter"
                  value={propertyTypeFilter}
                  onChange={(e) => setPropertyTypeFilter(e.target.value as PropertyType | "all")}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
                >
                  <option value="all">All property types</option>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>

                <label className="sr-only" htmlFor="area-filter">
                  Filter by renovation category
                </label>
                <select
                  id="area-filter"
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value as RenovationAreaKey | "all")}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
                >
                  <option value="all">All renovation areas</option>
                  {Object.entries(RENOVATION_AREA_LABELS).map(([key, label]) => (
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
                  onChange={(e) => setModeFilter(e.target.value as RenovationCreationMode | "all")}
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
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setPropertyTypeFilter("all");
                    setAreaFilter("all");
                    setModeFilter("all");
                  }}
                  className="mt-4 text-[#2ec440] hover:text-[#28b039] font-bold text-sm"
                >
                  Clear filters
                </button>
              )}
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
      {!RenovationProjectService.isStorageAvailable() && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:max-w-sm bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold rounded-2xl px-4 py-3 shadow-lg z-40">
          Your browser storage is unavailable, so changes in this session won&apos;t be saved after you leave.
        </div>
      )}
    </RequireAuth>
  );
}
