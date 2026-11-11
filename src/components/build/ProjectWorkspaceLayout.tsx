"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BuildProject } from "@/lib/build/types";
import { BuildProjectService } from "@/lib/build/projectService";
import { getProjectProgress } from "@/lib/build/progress";
import { formatRelativeTime, projectLocationLabel } from "@/lib/build/format";
import { useToast } from "@/lib/toast-context";
import { StatusBadge } from "./StatusBadge";
import ActionMenu, { ActionMenuItem } from "@/components/shared/ActionMenu";
import ConfirmModal from "@/components/shared/ConfirmModal";
import PromptModal from "@/components/shared/PromptModal";

/** The path a person follows, one step after the other. Pages a step needs (comparing, the room editor, the budget) belong to it and are reached from it. */
const STEPS: { key: string; label: string; segment: string; segments: string[] }[] = [
  { key: "home", label: "Describe your home", segment: "brief", segments: ["brief"] },
  { key: "plans", label: "Floor plans", segment: "concepts", segments: ["concepts", "compare", "designer"] },
  { key: "full", label: "Full design", segment: "full-design", segments: ["full-design"] },
  { key: "review", label: "Download", segment: "summary", segments: ["summary", "budget"] },
  { key: "hire", label: "Hire a professional", segment: "professionals", segments: ["professionals"] },
];

/** Which steps are done, and which the person may open now: a step opens once the one before it is done. */
function pathState(project: BuildProject) {
  const briefConfirmed = !["draft", "brief_in_progress"].includes(project.status);
  const planChosen = !!project.selectedConceptId;
  const reviewRequested = ["awaiting_professional_review", "professionally_reviewed"].includes(project.status);
  const fullDesigned = !!project.fullDesign;
  const done = [briefConfirmed, planChosen, fullDesigned, reviewRequested, reviewRequested];
  const open = [true, briefConfirmed, planChosen, planChosen, planChosen];
  // Where "continue where I left off" goes.
  const resume = !briefConfirmed ? 0 : !planChosen ? 1 : !fullDesigned ? 2 : !reviewRequested ? 3 : 4;
  return { done, open, resume };
}

const CONTINUE_HINT = ["Confirm your brief to see floor plans.", "Choose one floor plan to continue.", "", "", ""];

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function ProjectWorkspaceLayout({ project, children }: { project: BuildProject; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const [renameOpen, setRenameOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const base = `/studio/build/${project.id}`;
  const activeSegment = pathname === base ? "" : pathname.replace(`${base}/`, "").split("/")[0];
  const { done, open, resume } = pathState(project);
  const currentStep = STEPS.findIndex((step) => step.segments.includes(activeSegment));
  const stepHref = (index: number) => `${base}/${STEPS[index].segment}`;

  // The project's own front page is the path itself: it opens on the step the person is up to.
  useEffect(() => {
    if (activeSegment === "") router.replace(`${base}/${STEPS[resume].segment}`);
  }, [activeSegment, base, resume, router]);
  const progress = getProjectProgress(project);
  const location = projectLocationLabel(project);

  const menuItems: ActionMenuItem[] = [
    { key: "documents", label: "Documents", onSelect: () => router.push(`${base}/documents`) },
    { key: "activity", label: "Activity", onSelect: () => router.push(`${base}/activity`) },
    { key: "rename", label: "Rename", onSelect: () => setRenameOpen(true) },
    { key: "duplicate", label: "Duplicate", onSelect: () => setDuplicateOpen(true) },
    project.status === "archived"
      ? { key: "restore", label: "Restore", onSelect: () => {
          BuildProjectService.restore(project.id);
          showToast("Project restored from archive.");
        } }
      : { key: "archive", label: "Archive", onSelect: () => setArchiveOpen(true) },
    { key: "delete", label: "Delete", danger: true, onSelect: () => setDeleteOpen(true) },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-10 print:bg-white print:py-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 print:px-0 print:max-w-none">
        <nav aria-label="Breadcrumb" className="print:hidden flex items-center gap-2 text-sm text-slate-500 mb-4">
          <Link href="/studio/build" className="hover:text-slate-900 font-semibold transition-colors">
            My Build Projects
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

        <ol aria-label="Your path" className="print:hidden mb-8 flex items-center gap-x-3 overflow-x-auto whitespace-nowrap border-b border-slate-200 text-sm sm:gap-x-4 sm:text-base">
          {STEPS.map((step, index) => {
            const isCurrent = index === currentStep;
            const isDone = done[index] && !isCurrent;
            const reachable = open[index];
            const tone = isCurrent ? "font-black text-slate-900" : isDone ? "font-bold text-[#2ec440]" : reachable ? "font-bold text-slate-700" : "font-bold text-slate-300";
            const body = (
              <span className={`-mb-px inline-flex items-center gap-1.5 border-b-2 pb-3 ${isCurrent ? "border-slate-900" : "border-transparent"} ${tone}`}>
                {isDone && <CheckIcon />}
                {step.label}
              </span>
            );
            return (
              <li key={step.key} ref={isCurrent ? (el) => { const bar = el?.parentElement; if (el && bar) bar.scrollLeft = el.offsetLeft - (bar.clientWidth - el.clientWidth) / 2; } : undefined} className="flex items-center gap-x-3 sm:gap-x-4">
                {index > 0 && (
                  <span aria-hidden="true" className="-mt-3 text-slate-300">
                    ›
                  </span>
                )}
                {reachable ? (
                  <Link href={stepHref(index)} aria-current={isCurrent ? "step" : undefined} className="block">
                    {body}
                  </Link>
                ) : (
                  <span aria-disabled="true" className="block cursor-not-allowed">
                    {body}
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <main className="min-w-0">{activeSegment === "" ? null : children}</main>

        {/* Back and Continue, so the person is always told where to go next. The brief has its own steps and buttons inside it. */}
        {currentStep >= 1 && (
          <div className="print:hidden mt-10 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link href={stepHref(currentStep - 1)} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 font-bold text-slate-700 transition-colors hover:border-slate-400">
              Back
            </Link>
            {currentStep < STEPS.length - 1 && (
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                {!open[currentStep + 1] && CONTINUE_HINT[currentStep] && <p className="text-sm font-semibold text-slate-500 sm:text-right">{CONTINUE_HINT[currentStep]}</p>}
                {open[currentStep + 1] ? (
                  <Link href={stepHref(currentStep + 1)} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-8 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
                    Continue: {STEPS[currentStep + 1].label}
                  </Link>
                ) : (
                  <span aria-disabled="true" className="inline-flex min-h-12 cursor-not-allowed items-center justify-center rounded-xl bg-slate-200 px-8 font-bold text-slate-400">
                    Continue: {STEPS[currentStep + 1].label}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <PromptModal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename project"
        label="Project name"
        initialValue={project.name}
        submitLabel="Save name"
        onSubmit={(value) => {
          BuildProjectService.rename(project.id, value);
          setRenameOpen(false);
          showToast("Project renamed.");
        }}
      />

      <ConfirmModal
        open={duplicateOpen}
        onClose={() => setDuplicateOpen(false)}
        title="Duplicate project"
        description={`This creates a new copy of "${project.name}" with the same brief, design and documents. Professional review requests are not duplicated.`}
        confirmLabel="Duplicate Project"
        onConfirm={() => {
          const copy = BuildProjectService.duplicate(project.id);
          setDuplicateOpen(false);
          showToast("Project duplicated.");
          if (copy) router.push(`/studio/build/${copy.id}`);
        }}
      />

      <ConfirmModal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Archive project"
        description="Archived projects are hidden from your main list but are never deleted. You can restore this project at any time."
        confirmLabel="Archive Project"
        onConfirm={() => {
          BuildProjectService.archive(project.id);
          setArchiveOpen(false);
          showToast("Project archived.");
          router.push("/studio/build");
        }}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete project"
        description="This permanently deletes this project, including its brief, concepts, versions, documents and activity history. This cannot be undone."
        confirmLabel="Delete Permanently"
        destructive
        onConfirm={() => {
          BuildProjectService.delete(project.id);
          setDeleteOpen(false);
          showToast("Project deleted.");
          router.push("/studio/build");
        }}
      />
    </div>
  );
}
