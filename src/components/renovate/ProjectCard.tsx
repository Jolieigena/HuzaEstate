"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RenovationProject, CREATION_MODE_LABELS, RENOVATION_AREA_LABELS } from "@/lib/renovate/types";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { formatRelativeTime, formatCompactRwf, propertyLocationLabel } from "@/lib/renovate/format";
import { getProjectProgress } from "@/lib/renovate/progress";
import { useToast } from "@/lib/toast-context";
import { StatusBadge } from "./StatusBadge";
import ActionMenu, { ActionMenuItem } from "@/components/shared/ActionMenu";
import ConfirmModal from "@/components/shared/ConfirmModal";
import PromptModal from "@/components/shared/PromptModal";

function primaryAction(project: RenovationProject): { label: string; href: string } {
  const base = `/studio/renovate/${project.id}`;
  if (project.status === "draft" || project.status === "property_setup" || project.status === "assessment_in_progress") return { label: "Continue Assessment", href: `${base}/assessment` };
  if (project.status === "concepts_ready" || project.status === "refinement_in_progress") return { label: "View Concepts", href: `${base}/concepts` };
  if (project.status === "scope_ready") return { label: "View Scope", href: `${base}/scope` };
  if (project.status === "quotation_received" || project.status === "awaiting_quotations") return { label: "Review Quotations", href: `${base}/quotes` };
  return { label: "Open Project", href: base };
}

function HouseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

export default function ProjectCard({ project }: { project: RenovationProject }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [renameOpen, setRenameOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const selectedConcept = project.concepts.find((c) => c.id === project.selectedConceptId);
  const image = selectedConcept?.afterImage ?? project.property.imageUrl ?? "/hero-house.jpg";
  const location = propertyLocationLabel(project);
  const budget = project.budget;
  const progress = getProjectProgress(project);
  const action = primaryAction(project);
  const areaLabels = project.assessment.areas.slice(0, 3).map((a) => a.customLabel || RENOVATION_AREA_LABELS[a.areaKey]);

  const menuItems: ActionMenuItem[] = [
    { key: "open", label: "Open Project", onSelect: () => router.push(`/studio/renovate/${project.id}`) },
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
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
      <Link href={`/studio/renovate/${project.id}`} className="relative h-44 overflow-hidden block flex-shrink-0">
        <Image src={image} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 400px" />
        <div className="absolute top-3 left-3">
          <StatusBadge status={project.status} className="bg-white/95" />
        </div>
        {selectedConcept && (
          <div className="absolute bottom-3 left-3 bg-slate-900/70 text-white text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg">Conceptual</div>
        )}
      </Link>

      <div className="p-5 sm:p-6 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link href={`/studio/renovate/${project.id}`} className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate hover:text-[#2ec440] transition-colors">{project.name}</h3>
          </Link>
          <ActionMenu items={menuItems} label={`Actions for ${project.name}`} />
        </div>
        <p className="text-sm text-slate-500 truncate mb-3">{location}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500 mb-4">
          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{CREATION_MODE_LABELS[project.creationMode]}</span>
          <span>Updated {formatRelativeTime(project.updatedAt)}</span>
        </div>

        {areaLabels.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-slate-600 font-semibold mb-4">
            <HouseIcon />
            <span className="truncate">{areaLabels.join(", ")}{project.assessment.areas.length > 3 ? "…" : ""}</span>
          </div>
        )}

        {budget && (
          <p className="text-sm font-bold text-slate-900 mb-4">
            {formatCompactRwf(budget.low)} – {formatCompactRwf(budget.high)}
          </p>
        )}

        <div className="mb-5">
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-[#2ec440] rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <Link
          href={action.href}
          className="mt-auto block text-center w-full bg-slate-900 hover:bg-[#2ec440] text-white font-semibold py-3 rounded-xl transition-all shadow-sm"
        >
          {action.label}
        </Link>
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
        description={`This creates a new copy of "${project.name}" with the same assessment, concepts and documents.`}
        confirmLabel="Duplicate Project"
        onConfirm={() => {
          RenovationProjectService.duplicate(project.id);
          setDuplicateOpen(false);
          showToast("Project duplicated.");
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
        }}
      />
    </div>
  );
}
