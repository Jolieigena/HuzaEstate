"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { useAllBuildProjects, useAllRenovationProjects } from "@/lib/admin/crossModule";
import { useAdminState, useHasPermission } from "@/lib/admin/hooks";
import { AdminService } from "@/lib/admin/service";
import { BuildProjectService } from "@/lib/build/projectService";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { useToast } from "@/lib/toast-context";
import AccessPrivateProjectModal from "../AccessPrivateProjectModal";
import ReasonFormModal from "../ReasonFormModal";
import { Card, EmptyState, PageFrame, RequirePermission, SecondaryButton, StatusPill, fieldClass, formatDate, formatDateTime } from "../ui";

function useActor() {
  const { account } = useAuth();
  return { actorAccountId: account?.id ?? "system", actorName: account?.name ?? "System" };
}

interface ProjectRow {
  id: string;
  module: "build" | "renovate";
  name: string;
  ownerId: string;
  status: string;
  creationMode: string;
  createdAt: string;
  updatedAt: string;
  conceptCount: number;
  reviewCount: number;
  quotationCount: number;
  documentCount: number;
  safetyFlag: boolean;
}

function useProjectRows(): ProjectRow[] {
  const buildProjects = useAllBuildProjects();
  const renovationProjects = useAllRenovationProjects();
  return useMemo(() => {
    const build: ProjectRow[] = buildProjects.map((p) => ({ id: p.id, module: "build", name: p.name, ownerId: p.ownerId, status: p.status, creationMode: p.creationMode, createdAt: p.createdAt, updatedAt: p.updatedAt, conceptCount: p.concepts.length, reviewCount: p.reviewRequests.length, quotationCount: 0, documentCount: p.documents.length, safetyFlag: false }));
    const renovate: ProjectRow[] = renovationProjects.map((p) => ({ id: p.id, module: "renovate", name: p.name, ownerId: p.ownerId, status: p.status, creationMode: p.creationMode, createdAt: p.createdAt, updatedAt: p.updatedAt, conceptCount: p.concepts.length + p.targetedEdits.length, reviewCount: p.reviewRequests.length, quotationCount: p.quotations.length, documentCount: p.documents.length, safetyFlag: Object.values(p.assessment.safety.concerns).some((v) => v === "yes" || v === "unknown") }));
    return [...build, ...renovate].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [buildProjects, renovationProjects]);
}

export function ProjectsListPage() {
  const { account } = useAuth();
  const state = useAdminState();
  const canView = useHasPermission(account?.id, "projects.view_metadata");
  const [module, setModule] = useState<"all" | "build" | "renovate">("all");
  const [search, setSearch] = useState("");

  const rows = useProjectRows();
  const filtered = rows.filter((row) => {
    const q = search.trim().toLowerCase();
    const ownerName = state.users[row.ownerId]?.name ?? row.ownerId;
    const matchesSearch = !q || [row.name, ownerName].some((field) => field.toLowerCase().includes(q));
    return matchesSearch && (module === "all" || row.module === module);
  });

  return (
    <PageFrame title="Projects" description="Metadata-level oversight for Build and Renovate projects. Private content requires a logged, reason-based access.">
      <RequirePermission granted={canView}>
        <Card className="mb-5">
          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
            <label className="text-sm font-bold text-slate-700">
              Search
              <input className={`${fieldClass} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Project name or owner" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Type
              <select className={`${fieldClass} mt-1`} value={module} onChange={(e) => setModule(e.target.value as typeof module)}>
                <option value="all">Build and Renovate</option>
                <option value="build">Build</option>
                <option value="renovate">Renovate</option>
              </select>
            </label>
          </div>
        </Card>

        <p className="mb-3 text-xs font-semibold text-slate-400">{filtered.length} of {rows.length} projects</p>

        {filtered.length ? (
          <div className="grid gap-3">
            {filtered.map((row) => (
              <Link key={`${row.module}-${row.id}`} href={`/admin/projects/${row.id}?module=${row.module}`}>
                <Card className="p-4 transition-shadow hover:shadow-md">
                  <div className="grid gap-2 sm:grid-cols-[1.6fr_1fr_1fr_1fr_auto] sm:items-center">
                    <div>
                      <p className="font-black text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-500">{state.users[row.ownerId]?.name ?? row.ownerId}</p>
                    </div>
                    <span className="text-xs font-black uppercase tracking-wide text-[#219b31]">{row.module}</span>
                    <p className="text-xs text-slate-500">{row.reviewCount} review{row.reviewCount === 1 ? "" : "s"} · {row.documentCount} doc{row.documentCount === 1 ? "" : "s"}</p>
                    <p className="text-xs text-slate-500">Updated {formatDate(row.updatedAt)}</p>
                    <div className="flex items-center gap-2">
                      {row.safetyFlag && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">Safety flag</span>}
                      <StatusPill status={row.status} />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No projects found" description="Try a different search or filter." />
        )}
      </RequirePermission>
    </PageFrame>
  );
}

export function ProjectDetailPage({ projectId, module }: { projectId: string; module: "build" | "renovate" }) {
  const { account } = useAuth();
  const { actorAccountId, actorName } = useActor();
  useAdminState();
  const { showToast } = useToast();
  const canView = useHasPermission(account?.id, "projects.view_metadata");
  const canViewPrivate = useHasPermission(account?.id, "projects.view_private");
  const canManageAi = useHasPermission(account?.id, "ai.manage_configuration");

  const buildProjects = useAllBuildProjects();
  const renovationProjects = useAllRenovationProjects();
  const [accessOpen, setAccessOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [restrictOpen, setRestrictOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const buildProject = module === "build" ? buildProjects.find((p) => p.id === projectId) : undefined;
  const renovationProject = module === "renovate" ? renovationProjects.find((p) => p.id === projectId) : undefined;
  const project = buildProject ?? renovationProject;

  if (!canView) {
    return (
      <PageFrame title="Projects" description="">
        <RequirePermission granted={false}>{null}</RequirePermission>
      </PageFrame>
    );
  }

  if (!project) {
    return (
      <PageFrame title="Project not found" description="This project could not be found.">
        <EmptyState title="Project not found" description="The project may have been removed, archived beyond reach, or the link is incorrect." />
      </PageFrame>
    );
  }

  const flag = AdminService.getProjectFlag(project.id);
  const accessLog = AdminService.getPrivilegedAccessLog(project.id);
  const safetyFlag = renovationProject ? Object.values(renovationProject.assessment.safety.concerns).some((v) => v === "yes" || v === "unknown") : false;

  return (
    <PageFrame
      title={project.name}
      description={`${module === "build" ? "Build" : "Renovate"} project · ${project.status.replace(/_/g, " ")}`}
      action={
        <Link href="/admin/projects" className="text-sm font-bold text-slate-500 hover:text-[#219b31]">
          Back to Projects
        </Link>
      }
    >
      {unlocked && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
          <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v2" />
          </svg>
          Privileged Access — you are viewing this customer&apos;s private project content. This access has been logged.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-900">Project metadata</h3>
              <div className="flex items-center gap-2">
                {safetyFlag && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">Safety information shared</span>}
                <StatusPill status={project.status} />
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-slate-400">Project ID</dt><dd className="mt-1 font-semibold text-slate-700">{project.id}</dd></div>
              <div><dt className="text-xs text-slate-400">Owner</dt><dd className="mt-1 font-semibold text-slate-700">{project.ownerId}</dd></div>
              <div><dt className="text-xs text-slate-400">Creation mode</dt><dd className="mt-1 font-semibold text-slate-700">{project.creationMode}</dd></div>
              <div><dt className="text-xs text-slate-400">Created</dt><dd className="mt-1 font-semibold text-slate-700">{formatDate(project.createdAt)}</dd></div>
              <div><dt className="text-xs text-slate-400">Last updated</dt><dd className="mt-1 font-semibold text-slate-700">{formatDate(project.updatedAt)}</dd></div>
              <div><dt className="text-xs text-slate-400">Documents</dt><dd className="mt-1 font-semibold text-slate-700">{project.documents.length}</dd></div>
              <div><dt className="text-xs text-slate-400">Review requests</dt><dd className="mt-1 font-semibold text-slate-700">{project.reviewRequests.length}</dd></div>
              {renovationProject && <div><dt className="text-xs text-slate-400">Quotations</dt><dd className="mt-1 font-semibold text-slate-700">{renovationProject.quotations.length}</dd></div>}
              <div><dt className="text-xs text-slate-400">AI generation</dt><dd className="mt-1 font-semibold text-slate-700">{flag?.aiGenerationRestricted ? "Restricted" : "Allowed"}</dd></div>
            </dl>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-900">Review requests</h3>
              <Link href="/admin/requests" className="text-sm font-bold text-[#219b31]">Manage in Requests</Link>
            </div>
            <div className="mt-4 divide-y divide-slate-100">
              {project.reviewRequests.length ? (
                project.reviewRequests.map((review) => (
                  <div key={review.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{review.type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-slate-500">{review.professional?.name ?? "Unassigned"} · submitted {formatDate(review.submittedAt)}</p>
                    </div>
                    <StatusPill status={review.status} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No review requests on this project.</p>
              )}
            </div>
          </Card>

          {renovationProject && renovationProject.quotations.length > 0 && (
            <Card>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black text-slate-900">Quotations</h3>
                <Link href="/admin/quotations" className="text-sm font-bold text-[#219b31]">Manage in Quotations</Link>
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                {renovationProject.quotations.map((quotation) => (
                  <div key={quotation.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{quotation.contractor.companyName}</p>
                      <p className="text-xs text-slate-500">Valid until {formatDate(quotation.validUntil)}</p>
                    </div>
                    <StatusPill status={quotation.status} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-900">Private project content</h3>
              {!unlocked && canViewPrivate && <SecondaryButton onClick={() => setAccessOpen(true)}>View private project content</SecondaryButton>}
            </div>
            {unlocked ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{buildProject ? "Concepts" : "Concepts and edits"}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {(buildProject?.concepts ?? renovationProject?.concepts ?? []).map((concept) => (
                      <li key={concept.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{concept.name}</li>
                    ))}
                    {!(buildProject?.concepts.length || renovationProject?.concepts.length) && <li className="text-sm text-slate-500">No concepts generated yet.</li>}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Documents</p>
                  <ul className="mt-2 space-y-1.5">
                    {project.documents.map((doc) => (
                      <li key={doc.id} className="text-sm font-semibold text-slate-700">{doc.name}</li>
                    ))}
                    {!project.documents.length && <li className="text-sm text-slate-500">No documents uploaded.</li>}
                  </ul>
                </div>
                {renovationProject && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Property</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{renovationProject.property.location || renovationProject.property.address}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">{canViewPrivate ? "Requires a logged, reason-based access before viewing." : "You do not have permission to view private project content."}</p>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Status history</h3>
            <div className="mt-4 max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {project.activity.slice(0, 10).map((event) => (
                <div key={event.id} className="py-3 first:pt-0">
                  <p className="text-sm font-semibold text-slate-800">{event.details ?? event.type.replace(/_/g, " ")}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{event.actor} · {formatDateTime(event.timestamp)}</p>
                </div>
              ))}
            </div>
          </Card>

          {accessLog.length > 0 && (
            <Card>
              <h3 className="text-lg font-black text-slate-900">Privileged access log</h3>
              <div className="mt-4 divide-y divide-slate-100">
                {accessLog.map((entry) => (
                  <div key={entry.id} className="py-3 first:pt-0">
                    <p className="text-sm font-semibold text-slate-800">{entry.actorName} · {entry.reason.replace(/_/g, " ")}</p>
                    <p className="mt-0.5 text-xs text-slate-400">Case {entry.caseReference} · {formatDateTime(entry.at)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {canManageAi && (
            <Card>
              <h3 className="text-lg font-black text-slate-900">Actions</h3>
              <div className="mt-4 flex flex-col gap-2">
                {flag?.aiGenerationRestricted ? (
                  <SecondaryButton
                    onClick={() => {
                      AdminService.setAiGenerationRestricted(project.id, false, actorAccountId, actorName);
                      showToast("AI generation restored for this project.");
                    }}
                  >
                    Restore AI generation
                  </SecondaryButton>
                ) : (
                  <SecondaryButton onClick={() => setRestrictOpen(true)}>Restrict AI generation</SecondaryButton>
                )}
                {project.status !== "archived" && <SecondaryButton onClick={() => setArchiveOpen(true)}>Archive at customer request</SecondaryButton>}
                <SecondaryButton
                  onClick={() => {
                    const rows = [
                      ["Field", "Value"],
                      ["Project ID", project.id],
                      ["Name", project.name],
                      ["Type", module],
                      ["Status", project.status],
                      ["Owner", project.ownerId],
                      ["Created", project.createdAt],
                      ["Updated", project.updatedAt],
                      ["Documents", String(project.documents.length)],
                      ["Reviews", String(project.reviewRequests.length)],
                    ];
                    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${project.id}-metadata.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Export metadata (CSV)
                </SecondaryButton>
              </div>
            </Card>
          )}
        </div>
      </div>

      <AccessPrivateProjectModal
        open={accessOpen}
        onClose={() => setAccessOpen(false)}
        onSubmit={(values) => {
          AdminService.recordPrivilegedAccess(project.id, module, actorAccountId, actorName, values.reason, values.caseReference);
          setUnlocked(true);
          setAccessOpen(false);
          showToast("Access recorded. Viewing private project content.");
        }}
      />

      <ReasonFormModal
        open={restrictOpen}
        onClose={() => setRestrictOpen(false)}
        destructive
        title="Restrict AI generation"
        description="The owner will be unable to start new AI generations on this project until restored."
        submitLabel="Restrict AI generation"
        onSubmit={({ reason }) => {
          AdminService.setAiGenerationRestricted(project.id, true, actorAccountId, actorName, reason);
          setRestrictOpen(false);
          showToast("AI generation restricted for this project.");
        }}
      />

      <ConfirmModal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Archive this project?"
        description="The project is archived as requested by the customer. It remains accessible to the owner in an archived state."
        confirmLabel="Archive project"
        onConfirm={() => {
          if (module === "build") BuildProjectService.archive(project.id);
          else RenovationProjectService.archive(project.id);
          setArchiveOpen(false);
          showToast("Project archived.");
        }}
      />
    </PageFrame>
  );
}
