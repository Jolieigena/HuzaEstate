"use client";

import { FloorPlanGraphic } from "@/components/build/FloorPlanSvg";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";
import { projectLocationLabel } from "@/lib/build/format";
import { ROOM_LABELS, RoomKey } from "@/lib/build/types";

/** The download step: the whole design and the document to keep. */
export default function ProjectSummaryPage() {
  const project = useBuildProjectContext();
  const design = project.concepts.find((c) => c.id === project.selectedConceptId) ?? project.concepts[project.concepts.length - 1];
  const requiredSustainability = project.brief.sustainability.items.filter((i) => i.priority);
  const activeReview = project.reviewRequests.find((r) => r.status !== "cancelled");

  return (
    <div className="space-y-8 print:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <h1 className="text-xl font-black text-slate-900">Your design</h1>
        <button type="button" onClick={() => window.print()} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-6 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
          Download PDF
        </button>
      </div>

      <header className="hidden print:block border-b border-slate-200 pb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#2ec440] mb-1">HuzaEstate Build</p>
        <h1 className="text-3xl font-black text-slate-900">{project.name}</h1>
        <p className="text-slate-500">{projectLocationLabel(project)}</p>
      </header>

      {design && (
        <section>
          <h2 className="text-lg font-black text-slate-900">Your design</h2>
          <p className="mb-4 text-sm font-semibold text-slate-600">
            {design.metrics.floorAreaSqm} sqm · {design.metrics.floors} floor{design.metrics.floors === 1 ? "" : "s"} · {design.metrics.bedrooms} bed / {design.metrics.bathrooms} bath
          </p>
          <div className="space-y-8">
            {design.floors.map((floor) => (
              <div key={floor.id} className="break-inside-avoid">
                {design.floors.length > 1 && <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-500">{floor.name}</h3>}
                <div className="w-full [&>svg]:h-auto [&>svg]:w-full">
                  <FloorPlanGraphic floor={floor} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-8 sm:grid-cols-2 break-inside-avoid">
        <div>
          <h2 className="mb-3 font-bold text-slate-900">Plot</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Location</dt>
            <dd className="text-right font-semibold text-slate-900">{projectLocationLabel(project)}</dd>
            <dt className="text-slate-500">Plot area</dt>
            <dd className="text-right font-semibold text-slate-900">{project.brief.plot.areaSqm ? `${project.brief.plot.areaSqm} sqm` : "Not provided"}</dd>
            <dt className="text-slate-500">Shape</dt>
            <dd className="text-right font-semibold capitalize text-slate-900">{project.brief.plot.shape}</dd>
            <dt className="text-slate-500">Slope</dt>
            <dd className="text-right font-semibold capitalize text-slate-900">{project.brief.plot.slope}</dd>
          </dl>
        </div>
        <div>
          <h2 className="mb-3 font-bold text-slate-900">Requirements</h2>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">{project.brief.household.floors} floors</span>
            {project.brief.household.rooms.map((r) => (
              <span key={r.key} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                {ROOM_LABELS[r.key as RoomKey] ?? r.label}
                {r.quantity > 1 ? ` × ${r.quantity}` : ""}
              </span>
            ))}
          </div>
          {requiredSustainability.length > 0 && (
            <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-slate-600">
              {requiredSustainability.map((i) => (
                <li key={i.key}>{i.label}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {activeReview && (
        <section className="break-inside-avoid">
          <h2 className="mb-2 font-bold text-slate-900">Professional review</h2>
          <p className="text-sm text-slate-600">
            {activeReview.type.replace(/_/g, " ")} — {activeReview.status.replace(/_/g, " ")}
          </p>
        </section>
      )}

      <section className="break-inside-avoid rounded-xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
        <p className="mb-1 font-bold text-slate-900">Disclaimer</p>
        <p>
          This is a conceptual design produced by HuzaEstate Build and is not an approved construction drawing. Final architectural, structural and permit documents must be prepared or approved by qualified professionals.
        </p>
      </section>
    </div>
  );
}
