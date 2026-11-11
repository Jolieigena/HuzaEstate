"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { useRenovationProjectContext } from "@/components/renovate/RenovationProjectContext";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { RENOVATION_STYLE_LABELS } from "@/lib/renovate/types";
import { hasPicture, redesignRooms } from "@/lib/renovate/redesign";
import { makeScope } from "@/lib/renovate/makeScope";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import NewDesignPanel from "@/components/shared/NewDesignPanel";
import GenerationProgress from "@/components/renovate/GenerationProgress";
import EditPanel from "@/components/shared/EditPanel";

/** What the new design will be made from, in the pane on the right. */
function NewDesign({ open, onClose, replacing }: { open: boolean; onClose: () => void; replacing: boolean }) {
  const project = useRenovationProjectContext();
  return (
    <NewDesignPanel
      open={open}
      onClose={onClose}
      rows={[
        ["Property", project.property.name || "Not set"],
        ["Rooms", String(project.assessment.areas.length)],
        ["Style", project.assessment.style.primaryStyle ? RENOVATION_STYLE_LABELS[project.assessment.style.primaryStyle] : "Not set"],
      ]}
      briefHref={`/studio/renovate/${project.id}/assessment`}
      confirmLabel={replacing ? "Make a new design" : "Design my renovation"}
      onConfirm={() => {
        onClose();
        RenovationProjectService.startGeneration(project.id);
      }}
    />
  );
}

/** The redesign: each room as it is and as the AI redesigned it, full width, with ways to change it. */
export default function ConceptsPage() {
  const project = useRenovationProjectContext();
  const { token } = useAuth();
  const { showToast } = useToast();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const briefReady = project.status !== "draft" && project.status !== "property_setup" && project.status !== "assessment_in_progress";
  const design = project.concepts.find((c) => c.id === project.selectedConceptId) ?? project.concepts[project.concepts.length - 1];

  // The design on show is the chosen one: a project made when three concepts were offered may have none chosen, and Continue waits for it.
  useEffect(() => {
    if (design && project.selectedConceptId !== design.id) RenovationProjectService.selectConcept(project.id, design.id);
  }, [design, project.id, project.selectedConceptId]);

  // The scope of work is made with the design, so it is ready to look at, to change and to put in the download.
  useEffect(() => {
    if (design && project.status !== "generating" && project.scope.length === 0 && project.assessment.areas.length > 0) makeScope(project);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design?.id, project.id, project.status, project.scope.length]);

  if (project.status === "generating") return <GenerationProgress project={project} />;

  if (!design) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm sm:p-16">
        <h2 className="mb-6 text-2xl font-black text-slate-900">{briefReady ? "Your renovation design" : "Confirm your brief first"}</h2>
        {briefReady ? (
          <button type="button" onClick={() => setGenerateOpen(true)} className="inline-block rounded-xl bg-slate-900 px-8 py-3.5 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
            Design my renovation
          </button>
        ) : (
          <Link href={`/studio/renovate/${project.id}/assessment`} className="inline-block rounded-xl bg-slate-900 px-8 py-3.5 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
            Go to the brief
          </Link>
        )}
        <NewDesign open={generateOpen} replacing={false} onClose={() => setGenerateOpen(false)} />
      </div>
    );
  }

  const views = design.areaViews.filter(hasPicture);

  const edit = async (request: string): Promise<string | null> => {
    if (!token) return "Please sign in again.";
    const outcome = await redesignRooms(token, project, { request, current: design.areaViews });
    if (outcome.made === 0 && outcome.error) return outcome.error;
    const first = outcome.views.find(hasPicture);
    RenovationProjectService.refineConcept(project.id, design.id, request, `Changed with AI: "${request}"`, { areaViews: outcome.views, ...(first ? { afterImage: first.afterImage } : {}) });
    showToast("Your design was changed. It is saved as a new version.");
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-black text-slate-900">Your redesign</h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => { setEditOpen(false); setGenerateOpen(true); }} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400">
            New design
          </button>
          {views.length > 0 && (
            <button type="button" onClick={() => { setGenerateOpen(false); setEditOpen(true); }} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400">
              Edit design
            </button>
          )}
        </div>
      </div>

      {views.length > 0 ? (
        <div className="space-y-8">
          {views.map((view) => (
            <section key={view.areaKey}>
              <h2 className="mb-3 text-lg font-black text-slate-900">{view.label}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <figure>
                  <img src={view.beforeImage} alt={`${view.label}, before`} className="aspect-[16/10] w-full rounded-2xl bg-slate-100 object-cover" />
                  <figcaption className="mt-2 text-sm font-bold text-slate-600">Before</figcaption>
                </figure>
                <figure>
                  <img src={view.afterImage} alt={`${view.label}, redesigned`} className="aspect-[16/10] w-full rounded-2xl bg-slate-100 object-cover" />
                  <figcaption className="mt-2 text-sm font-bold text-slate-600">After</figcaption>
                </figure>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm font-semibold text-slate-600">
          No room photo to redesign yet.{" "}
          <Link href={`/studio/renovate/${project.id}/assessment`} className="text-[#2ec440] hover:text-[#28b039]">
            Add a photo of the room
          </Link>
        </p>
      )}

      {project.scope.length > 0 && (
        <div>
          <Link href={`/studio/renovate/${project.id}/scope`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400">
            View and edit scope of work
          </Link>
        </div>
      )}

      <p className="text-xs text-slate-500">These are AI concept pictures, not approved technical designs. Structural, electrical, plumbing, safety and permit-related work must be reviewed by qualified professionals.</p>

      <EditPanel
        open={editOpen}
        onClose={() => setEditOpen(false)}
        suggestions={["Make the room brighter", "Use lighter colours on the walls", "Change the floor to timber", "Add more plants", "Add built-in storage", "Make it feel warmer"]}
        placeholder="e.g. Paint the walls light grey and add a green sofa"
        onSubmit={edit}
      />
      <NewDesign open={generateOpen} replacing onClose={() => setGenerateOpen(false)} />
    </div>
  );
}
