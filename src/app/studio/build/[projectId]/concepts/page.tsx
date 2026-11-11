"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";
import { BuildProjectService } from "@/lib/build/projectService";
import { HOME_STYLE_LABELS } from "@/lib/build/types";
import { collectBriefWarnings } from "@/lib/build/briefValidation";
import { formatTypedCompact, useStudioMoney } from "@/lib/currency/studioMoney";
import NewDesignPanel from "@/components/shared/NewDesignPanel";
import GenerationProgress from "@/components/build/GenerationProgress";
import { FloorPlanGraphic } from "@/components/build/FloorPlanSvg";
import RefineDrawer from "@/components/build/RefineDrawer";

/** What the new design will be made from, in the pane on the right. */
function NewDesign({ open, onClose, replacing }: { open: boolean; onClose: () => void; replacing: boolean }) {
  const project = useBuildProjectContext();
  const bedrooms = project.brief.household.rooms.find((r) => r.key === "bedrooms")?.quantity ?? 0;
  const { toRwf } = useStudioMoney();
  const warnings = collectBriefWarnings(project.brief, toRwf).map((w) => w.message);
  const budget = project.brief.budget;
  return (
    <NewDesignPanel
      open={open}
      onClose={onClose}
      rows={[
        ["Project", project.name],
        ["Plot area", project.brief.plot.areaSqm ? `${project.brief.plot.areaSqm} sqm` : "Not set"],
        ["Floors", String(project.brief.household.floors)],
        ["Bedrooms", String(bedrooms)],
        ["Style", project.brief.style.primaryStyle ? HOME_STYLE_LABELS[project.brief.style.primaryStyle] : "Not set"],
        ["Target budget", budget.targetBudget ? formatTypedCompact(budget.targetBudget, budget.currency) : "Not set"],
      ]}
      warnings={warnings}
      briefHref={`/studio/build/${project.id}/brief`}
      confirmLabel={replacing ? "Make a new design" : "Make my design"}
      onConfirm={() => {
        onClose();
        BuildProjectService.startGeneration(project.id);
      }}
    />
  );
}

export default function ConceptsPage() {
  const project = useBuildProjectContext();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);

  const briefReady = project.status !== "draft" && project.status !== "brief_in_progress";
  // The design on show: the version picked, else the chosen one, else the newest.
  const current = project.concepts.find((c) => c.id === viewId) ?? project.concepts.find((c) => c.id === project.selectedConceptId) ?? project.concepts[project.concepts.length - 1];

  // The design on show is the chosen one: a project made before designs chose themselves has none chosen yet, and Continue waits for it.
  useEffect(() => {
    if (current && project.status !== "generating" && !project.selectedConceptId) BuildProjectService.selectConcept(project.id, current.id);
  }, [current, project.id, project.status, project.selectedConceptId]);

  if (project.status === "generating") {
    return <GenerationProgress project={project} />;
  }

  if (project.concepts.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-10 sm:p-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#2ec440]/10 text-[#2ec440] flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-3">No design yet</h2>
        <p className="text-slate-500 leading-relaxed max-w-md mx-auto mb-8">
          {briefReady
            ? "Your brief is confirmed. Generate your design."
            : "Confirm your design brief before generating concepts."}
        </p>
        {briefReady ? (
          <button type="button" onClick={() => setGenerateOpen(true)} className="inline-block bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 px-8 rounded-xl transition-colors shadow-lg">
            Design my home
          </button>
        ) : (
          <Link href={`/studio/build/${project.id}/brief`} className="inline-block bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 px-8 rounded-xl transition-colors shadow-lg">
            Go to Brief
          </Link>
        )}

        <NewDesign open={generateOpen} onClose={() => setGenerateOpen(false)} replacing={false} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Your design</h1>
          <p className="text-sm font-semibold text-slate-600">
            {current.metrics.floorAreaSqm} sqm · {current.metrics.floors} floor{current.metrics.floors === 1 ? "" : "s"} · {current.metrics.bedrooms} bed / {current.metrics.bathrooms} bath
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => { setRefineOpen(false); setGenerateOpen(true); }} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 font-bold text-slate-700 transition-colors hover:border-slate-400">
            New design
          </button>
          <button type="button" onClick={() => { setGenerateOpen(false); setRefineOpen(true); }} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-6 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
            Edit design
          </button>
        </div>
      </div>

      {project.concepts.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Versions">
          {project.concepts.map((concept, index) => (
            <button
              key={concept.id}
              type="button"
              aria-pressed={concept.id === current.id}
              onClick={() => {
                setViewId(concept.id);
                BuildProjectService.selectConcept(project.id, concept.id);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${concept.id === current.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Version {index + 1}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-10">
        {current.floors.map((floor) => (
          <section key={floor.id}>
            {current.floors.length > 1 && <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-500">{floor.name}</h2>}
            <div className="w-full [&>svg]:h-auto [&>svg]:w-full">
              <FloorPlanGraphic floor={floor} />
            </div>
          </section>
        ))}
      </div>

      <RefineDrawer projectId={project.id} concept={current} open={refineOpen} onClose={() => setRefineOpen(false)} />

      <NewDesign open={generateOpen} onClose={() => setGenerateOpen(false)} replacing />
    </div>
  );
}
