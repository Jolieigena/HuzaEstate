"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";
import { BuildProjectService } from "@/lib/build/projectService";
import { HOME_STYLE_LABELS } from "@/lib/build/types";
import { collectBriefWarnings } from "@/lib/build/briefValidation";
import { formatCompactRwf } from "@/lib/build/format";
import Dialog from "@/components/Dialog";
import GenerationProgress from "@/components/build/GenerationProgress";
import { FloorPlanGraphic } from "@/components/build/FloorPlanSvg";
import RefineDrawer from "@/components/build/RefineDrawer";

function GenerateConceptsModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  const project = useBuildProjectContext();
  const titleId = useId();
  const bedrooms = project.brief.household.rooms.find((r) => r.key === "bedrooms")?.quantity ?? 0;
  const warnings = collectBriefWarnings(project.brief);
  const requirementsCount = project.brief.household.rooms.length + project.brief.sustainability.items.filter((i) => i.priority).length + project.brief.accessibility.items.filter((i) => i.priority).length;
  const generationAllowed = { allowed: true, message: "" };

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName="max-w-lg">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="text-xl font-black text-slate-900 mb-1">
          Generate your design
        </h2>
        <p className="text-slate-500 text-sm mb-6">Huza AI will draw a design from your confirmed brief. You can change it afterwards with Edit with AI.</p>

        <dl className="bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-2 gap-y-3 text-sm mb-4">
          <dt className="text-slate-500">Project</dt>
          <dd className="text-right font-semibold text-slate-900">{project.name}</dd>
          <dt className="text-slate-500">Plot area</dt>
          <dd className="text-right font-semibold text-slate-900">{project.brief.plot.areaSqm ? `${project.brief.plot.areaSqm} sqm` : "Not set"}</dd>
          <dt className="text-slate-500">Floors</dt>
          <dd className="text-right font-semibold text-slate-900">{project.brief.household.floors}</dd>
          <dt className="text-slate-500">Bedrooms</dt>
          <dd className="text-right font-semibold text-slate-900">{bedrooms}</dd>
          <dt className="text-slate-500">Style</dt>
          <dd className="text-right font-semibold text-slate-900">{project.brief.style.primaryStyle ? HOME_STYLE_LABELS[project.brief.style.primaryStyle] : "Not set"}</dd>
          <dt className="text-slate-500">Target budget</dt>
          <dd className="text-right font-semibold text-slate-900">{project.brief.budget.targetBudget ? formatCompactRwf(project.brief.budget.targetBudget) : "Not set"}</dd>
          <dt className="text-slate-500">Requirements captured</dt>
          <dd className="text-right font-semibold text-slate-900">{requirementsCount}</dd>
        </dl>

        {warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <p className="text-xs font-bold text-amber-800 mb-1.5">Important</p>
            <ul className="space-y-1">
              {warnings.slice(0, 3).map((w) => (
                <li key={w.id} className="text-xs text-amber-700">
                  {w.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!generationAllowed.allowed && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-xs font-bold text-red-800 mb-1.5">Temporarily unavailable</p>
            <p className="text-xs text-red-700">{generationAllowed.message}</p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Link href={`/studio/build/${project.id}/brief`} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-center">
            Return to Brief
          </Link>
          <button type="button" onClick={onConfirm} disabled={!generationAllowed.allowed} className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-[#2ec440] text-white font-bold transition-colors shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-900">
            Generate My Design
          </button>
        </div>
      </div>
    </Dialog>
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
            Generate My Design
          </button>
        ) : (
          <Link href={`/studio/build/${project.id}/brief`} className="inline-block bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 px-8 rounded-xl transition-colors shadow-lg">
            Go to Brief
          </Link>
        )}

        <GenerateConceptsModal
          open={generateOpen}
          onClose={() => setGenerateOpen(false)}
          onConfirm={() => {
            setGenerateOpen(false);
            BuildProjectService.startGeneration(project.id);
          }}
        />
      </div>
    );
  }

  const manualHref = `/studio/build/${project.id}/designer?fromConcept=${current.id}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Your design</h1>
          <p className="text-sm font-semibold text-slate-600">
            {current.metrics.floorAreaSqm} sqm · {current.metrics.floors} floor{current.metrics.floors === 1 ? "" : "s"} · {current.metrics.bedrooms} bed / {current.metrics.bathrooms} bath · {formatCompactRwf(current.metrics.budgetLowRwf)} – {formatCompactRwf(current.metrics.budgetHighRwf)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => setRefineOpen(true)} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-6 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
            Edit with AI
          </button>
          <Link href={manualHref} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 font-bold text-slate-700 transition-colors hover:border-slate-400">
            Continue manually
          </Link>
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

      <GenerateConceptsModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onConfirm={() => {
          setGenerateOpen(false);
          BuildProjectService.startGeneration(project.id);
        }}
      />
    </div>
  );
}
