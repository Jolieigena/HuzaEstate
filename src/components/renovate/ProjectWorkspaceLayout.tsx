"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RenovationProject } from "@/lib/renovate/types";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { getProjectProgress, getNextAction } from "@/lib/renovate/progress";
import { formatRelativeTime, propertyLocationLabel } from "@/lib/renovate/format";
import { useToast } from "@/lib/toast-context";
import { StatusBadge } from "./StatusBadge";
import ActionMenu, { ActionMenuItem } from "@/components/shared/ActionMenu";
import ConfirmModal from "@/components/shared/ConfirmModal";
import PromptModal from "@/components/shared/PromptModal";

const NAV_ITEMS: { key: string; label: string; segment: string }[] = [
  { key: "overview", label: "Overview", segment: "" },
  { key: "assessment", label: "Assessment", segment: "assessment" },
  { key: "designer", label: "Designer", segment: "designer" },
  { key: "concepts", label: "Concepts", segment: "concepts" },
  { key: "scope", label: "Scope", segment: "scope" },
  { key: "budget", label: "Budget", segment: "budget" },
  { key: "professionals", label: "Professionals", segment: "professionals" },
  { key: "quotes", label: "Quotations", segment: "quotes" },
  { key: "documents", label: "Documents", segment: "documents" },
  { key: "activity", label: "Activity", segment: "activity" },
];

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
  const nextAction = getNextAction(project);
  const location = propertyLocationLabel(project);

  const menuItems: ActionMenuItem[] = [
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
              {nextAction && (
                <Link
                  href={nextAction.href}
                  className="bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-5 sm:px-6 py-3 rounded-xl transition-colors shadow-lg text-sm whitespace-nowrap"
                >
                  {nextAction.label}
                </Link>
              )}
              <ActionMenu items={menuItems} />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="print:hidden lg:w-56 flex-shrink-0">
            <nav aria-label="Project sections" className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:sticky lg:top-24">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSegment === item.segment;
                return (
                  <Link
                    key={item.key}
                    href={`${base}${item.segment ? `/${item.segment}` : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                      isActive ? "bg-[#2ec440]/10 text-[#2ec440]" : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <main className="flex-grow min-w-0">{children}</main>
        </div>
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
