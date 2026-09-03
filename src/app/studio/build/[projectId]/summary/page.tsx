"use client";

import Image from "next/image";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";
import { formatCompactRwf, formatDate, projectLocationLabel, statusLabel } from "@/lib/build/format";
import { ROOM_LABELS, RoomKey } from "@/lib/build/types";

export default function ProjectSummaryPage() {
  const project = useBuildProjectContext();
  const selectedConcept = project.concepts.find((c) => c.id === project.selectedConceptId) ?? project.concepts[0];
  const requiredSustainability = project.brief.sustainability.items.filter((i) => i.priority);
  const activeReview = project.reviewRequests.find((r) => r.status !== "cancelled");

  return (
    <div className="max-w-3xl mx-auto bg-white print:max-w-none">
      <div className="flex items-center justify-between mb-8 print:hidden">
        <h1 className="text-xl font-black text-slate-900">Project summary</h1>
        <button type="button" onClick={() => window.print()} className="bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg">
          Print or Save as PDF
        </button>
      </div>

      <div className="border border-slate-200 rounded-2xl p-8 print:border-0 print:p-0 space-y-8">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-xs font-bold uppercase tracking-wide text-[#2ec440] mb-2">HuzaEstate Build — Project Summary</p>
          <h1 className="text-3xl font-black text-slate-900 mb-1">{project.name}</h1>
          <p className="text-slate-500">{project.description || "No description provided."}</p>
          <p className="text-sm text-slate-400 mt-2">
            Status: {statusLabel(project.status)} · Generated {formatDate(new Date().toISOString())}
          </p>
        </header>

        <section>
          <h2 className="font-bold text-slate-900 mb-3">Plot summary</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Location</dt>
            <dd className="text-right font-semibold text-slate-900">{projectLocationLabel(project)}</dd>
            <dt className="text-slate-500">Plot area</dt>
            <dd className="text-right font-semibold text-slate-900">{project.brief.plot.areaSqm ? `${project.brief.plot.areaSqm} sqm` : "Not provided"}</dd>
            <dt className="text-slate-500">Shape</dt>
            <dd className="text-right font-semibold text-slate-900 capitalize">{project.brief.plot.shape}</dd>
            <dt className="text-slate-500">Slope</dt>
            <dd className="text-right font-semibold text-slate-900 capitalize">{project.brief.plot.slope}</dd>
          </dl>
        </section>

        <section>
          <h2 className="font-bold text-slate-900 mb-3">Requirements</h2>
          <div className="flex flex-wrap gap-2">
            <span className="bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-1.5 rounded-lg">{project.brief.household.floors} floors</span>
            {project.brief.household.rooms.map((r) => (
              <span key={r.key} className="bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-1.5 rounded-lg">
                {ROOM_LABELS[r.key as RoomKey] ?? r.label}
                {r.quantity > 1 ? ` × ${r.quantity}` : ""}
              </span>
            ))}
          </div>
        </section>

        {selectedConcept && (
          <section>
            <h2 className="font-bold text-slate-900 mb-3">Selected concept — {selectedConcept.name}</h2>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 mb-3">
              <Image src={selectedConcept.previewImage} alt="" fill className="object-cover" sizes="700px" />
            </div>
            <p className="text-sm text-slate-600 mb-2">{selectedConcept.rationale}</p>
            <p className="text-sm font-semibold text-slate-900">
              {selectedConcept.metrics.floorAreaSqm} sqm · {selectedConcept.metrics.bedrooms} bed · {selectedConcept.metrics.bathrooms} bath ·{" "}
              {formatCompactRwf(selectedConcept.metrics.budgetLowRwf)} – {formatCompactRwf(selectedConcept.metrics.budgetHighRwf)}
            </p>
          </section>
        )}

        {project.budget && (
          <section>
            <h2 className="font-bold text-slate-900 mb-3">Budget summary</h2>
            <p className="text-2xl font-black text-slate-900 mb-1">{formatCompactRwf(project.budget.target)}</p>
            <p className="text-sm text-slate-500">
              Range: {formatCompactRwf(project.budget.low)} – {formatCompactRwf(project.budget.high)} · {project.budget.finishLevel} finish · {project.budget.totalAreaSqm} sqm
            </p>
          </section>
        )}

        {requiredSustainability.length > 0 && (
          <section>
            <h2 className="font-bold text-slate-900 mb-3">Sustainability requirements</h2>
            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
              {requiredSustainability.map((i) => (
                <li key={i.key}>
                  {i.label} — {i.priority}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="font-bold text-slate-900 mb-3">Professional review status</h2>
          <p className="text-sm text-slate-600">{activeReview ? `${activeReview.type.replace(/_/g, " ")} — ${activeReview.status.replace(/_/g, " ")}` : "No professional review requested yet."}</p>
        </section>

        <section className="bg-slate-50 rounded-xl p-5 text-sm text-slate-600 leading-relaxed">
          <p className="font-bold text-slate-900 mb-1">Disclaimer</p>
          <p>
            This summary reflects conceptual design directions produced by HuzaEstate Build and is not an approved construction drawing. Budget figures are indicative only. Final architectural,
            structural and permit documents must be prepared or approved by qualified professionals.
          </p>
        </section>
      </div>
    </div>
  );
}
