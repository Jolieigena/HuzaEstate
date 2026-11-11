"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RenovationProject } from "@/lib/renovate/types";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { getProjectProgress } from "@/lib/renovate/progress";
import { formatRelativeTime, propertyLocationLabel } from "@/lib/renovate/format";
import { useToast } from "@/lib/toast-context";
import { StatusBadge } from "./StatusBadge";
import ActionMenu, { ActionMenuItem } from "@/components/shared/ActionMenu";
import ConfirmModal from "@/components/shared/ConfirmModal";
import PromptModal from "@/components/shared/PromptModal";
import { PathFooter, PathSteps } from "@/components/shared/PathSteps";

/** The path a person follows, one step after the other. Pages a step needs (the room designer, quotations) belong to it and are reached from it. */
const STEPS: { key: string; label: string; segment: string; segments: string[] }[] = [
  { key: "brief", label: "Describe your room", segment: "assessment", segments: ["assessment"] },
  { key: "design", label: "Redesign", segment: "concepts", segments: ["concepts", "compare", "designer"] },
  { key: "scope", label: "Scope of work", segment: "scope", segments: ["scope"] },
  { key: "download", label: "Download", segment: "documents/summary", segments: ["documents"] },
  { key: "hire", label: "Hire a professional", segment: "professionals", segments: ["professionals", "quotes"] },
];

/** Which steps are done, and which the person may open now: a step opens once the one before it is done. */
function pathState(project: RenovationProject) {
  const briefConfirmed = !["draft", "property_setup", "assessment_in_progress"].includes(project.status);
  const designChosen = !!project.selectedConceptId;
  const scopeDone = project.scope.length > 0;
  const hired = ["awaiting_professional_review", "awaiting_quotations", "quotation_received", "ready_for_execution"].includes(project.status);
  const done = [briefConfirmed, designChosen, scopeDone, hired, hired];
  const open = [true, briefConfirmed, designChosen, designChosen, designChosen];
  // Where "continue where I left off" goes.
  const resume = !briefConfirmed ? 0 : !designChosen ? 1 : !scopeDone ? 2 : !hired ? 3 : 4;
  return { done, open, resume };
}

const CONTINUE_HINT = ["Confirm your brief to see your redesign.", "Choose your design to continue.", "", "", ""];

function LocationIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function ProjectWorkspaceLayout({ project, children }: { project: RenovationProject; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const [renameOpen, setRenameOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const base = `/studio/renovate/${project.id}`;
  const activeSegment = pathname === base ? "" : pathname.replace(`${base}/`, "").split("/")[0];
  const progress = getProjectProgress(project);
  const { done, open, resume } = pathState(project);
  const currentStep = STEPS.findIndex((step) => step.segments.includes(activeSegment));
  const pathSteps = STEPS.map((step) => ({ key: step.key, label: step.label, href: `${base}/${step.segment}` }));

  // The project's own front page is the path itself: it opens on the step the person is up to.
  useEffect(() => {
    if (activeSegment === "") router.replace(`${base}/${STEPS[resume].segment}`);
  }, [activeSegment, base, resume, router]);
  const location = propertyLocationLabel(project);

  const menuItems: ActionMenuItem[] = [
    { key: "documents", label: "Documents", onSelect: () => router.push(`${base}/documents`) },
    { key: "activity", label: "Activity", onSelect: () => router.push(`${base}/activity`) },
    { key: "rename", label: "Rename", onSelect: () => setRenameOpen(true) },
    { key: "duplicate", label: "Duplicate", onSelect: () => setDuplicateOpen(true) },
    project.status === "archived"
      ? {
          key: "restore",
          label: "Restore",
          onSelect: () => {
            RenovationProjectService.restore(project.id);
            showToast("Project restored from archive.");
          },
        }
      : { key: "archive", label: "Archive", onSelect: () => setArchiveOpen(true) },
    { key: "delete", label: "Delete", danger: true, onSelect: () => setDeleteOpen(true) },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-10 print:bg-white print:py-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 print:px-0 print:max-w-none">
        <nav aria-label="Breadcrumb" className="print:hidden flex items-center gap-2 text-sm text-slate-500 mb-4">
          <Link href="/studio/renovate" className="hover:text-slate-900 font-semibold transition-colors">
            My Renovation Projects
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-900 font-semibold truncate max-w-[220px]">{project.name}</span>
        </nav>

        <div className="print:hidden bg-white border border-slate-100 rounded-3xl shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 truncate">{project.name}</h1>
                <StatusBadge status={project.status} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 font-medium mb-4">
                <span className="flex items-center gap-1.5">
                  <LocationIcon />
                  {location}
                </span>
                <span>Updated {formatRelativeTime(project.updatedAt)}</span>
              </div>
              <div className="max-w-sm">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
                  <span>Project progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#2ec440] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <ActionMenu items={menuItems} />
            </div>
          </div>
        </div>

        <PathSteps steps={pathSteps} current={currentStep} done={done} open={open} />

        <main className="min-w-0">{activeSegment === "" ? null : children}</main>

        <PathFooter steps={pathSteps} current={currentStep} open={open} hints={CONTINUE_HINT} />
      </div>

      <PromptModal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename project"
        label="Project name"
        initialValue={project.name}
        submitLabel="Save name"
        onSubmit={(value) => {
          RenovationProjectService.rename(project.id, value);
          setRenameOpen(false);
          showToast("Project renamed.");
        }}
      />

      <ConfirmModal
        open={duplicateOpen}
        onClose={() => setDuplicateOpen(false)}
        title="Duplicate project"
        description={`This creates a new copy of "${project.name}" with the same assessment, concepts and documents. Professional review and quotation requests are not duplicated.`}
        confirmLabel="Duplicate Project"
        onConfirm={() => {
          const copy = RenovationProjectService.duplicate(project.id);
          setDuplicateOpen(false);
          showToast("Project duplicated.");
          if (copy) router.push(`/studio/renovate/${copy.id}`);
        }}
      />

      <ConfirmModal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Archive project"
        description="Archived projects are hidden from your main list but are never deleted. You can restore this project at any time."
        confirmLabel="Archive Project"
        onConfirm={() => {
          RenovationProjectService.archive(project.id);
          setArchiveOpen(false);
          showToast("Project archived.");
          router.push("/studio/renovate");
        }}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete project"
        description="This permanently deletes this project, including its assessment, concepts, versions, documents and activity history. This cannot be undone."
        confirmLabel="Delete Permanently"
        destructive
        onConfirm={() => {
          RenovationProjectService.delete(project.id);
          setDeleteOpen(false);
          showToast("Project deleted.");
          router.push("/studio/renovate");
        }}
      />
    </div>
  );
}
