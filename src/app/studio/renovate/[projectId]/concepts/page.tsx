"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { useRenovationProjectContext } from "@/components/renovate/RenovationProjectContext";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { RENOVATION_STYLE_LABELS } from "@/lib/renovate/types";
import { hasPicture, redesignRooms } from "@/lib/renovate/redesign";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import Dialog from "@/components/Dialog";
import GenerationProgress from "@/components/renovate/GenerationProgress";
import EditPanel from "@/components/shared/EditPanel";

function GenerateDesignModal({ open, onClose, onConfirm, replacing }: { open: boolean; onClose: () => void; onConfirm: () => void; replacing: boolean }) {
  const project = useRenovationProjectContext();
  const titleId = useId();
  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName="max-w-lg">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="mb-1 text-xl font-black text-slate-900">
          {replacing ? "New design with AI" : "Design your renovation"}
        </h2>
        <p className="mb-6 text-sm text-slate-500">Huza AI will redesign your rooms from your photos and your confirmed brief.{replacing ? " Your current design is kept as a version." : ""}</p>
        <dl className="mb-6 grid grid-cols-2 gap-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
          <dt className="text-slate-500">Property</dt>
          <dd className="text-right font-semibold text-slate-900">{project.property.name || "Not set"}</dd>
          <dt className="text-slate-500">Rooms</dt>
          <dd className="text-right font-semibold text-slate-900">{project.assessment.areas.length}</dd>
          <dt className="text-slate-500">Style</dt>
          <dd className="text-right font-semibold text-slate-900">{project.assessment.style.primaryStyle ? RENOVATION_STYLE_LABELS[project.assessment.style.primaryStyle] : "Not set"}</dd>
        </dl>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href={`/studio/renovate/${project.id}/assessment`} className="rounded-xl border border-slate-200 px-5 py-3 text-center font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            Return to the brief
          </Link>
          <button type="button" onClick={onConfirm} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
            {replacing ? "Make a new design" : "Design my renovation"}
          </button>
        </div>
      </div>
    </Dialog>
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
        <GenerateDesignModal
          open={generateOpen}
          replacing={false}
          onClose={() => setGenerateOpen(false)}
          onConfirm={() => {
            setGenerateOpen(false);
            RenovationProjectService.startGeneration(project.id);
          }}
        />
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
          <button type="button" onClick={() => setGenerateOpen(true)} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 font-bold text-slate-700 transition-colors hover:border-slate-400">
            New design with AI
          </button>
          {views.length > 0 && (
            <button type="button" onClick={() => setEditOpen(true)} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 font-bold text-slate-700 transition-colors hover:border-slate-400">
              Edit with AI
            </button>
          )}
          <Link href={`/studio/renovate/${project.id}/designer`} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-6 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
            Continue manually
          </Link>
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

      <EditPanel
        open={editOpen}
        onClose={() => setEditOpen(false)}
        suggestions={["Make the room brighter", "Use lighter colours on the walls", "Change the floor to timber", "Add more plants", "Add built-in storage", "Make it feel warmer"]}
        placeholder="e.g. Paint the walls light grey and add a green sofa"
        onSubmit={edit}
      />
      <GenerateDesignModal
        open={generateOpen}
        replacing
        onClose={() => setGenerateOpen(false)}
        onConfirm={() => {
          setGenerateOpen(false);
          RenovationProjectService.startGeneration(project.id);
        }}
      />
    </div>
  );
}
