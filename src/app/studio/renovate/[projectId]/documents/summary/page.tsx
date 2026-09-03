"use client";

import Image from "next/image";
import { useRenovationProjectContext } from "@/components/renovate/RenovationProjectContext";
import { formatCompactRwf, formatDate, propertyLocationLabel, statusLabel } from "@/lib/renovate/format";
import { PROPERTY_TYPE_LABELS, RENOVATION_AREA_LABELS, SAFETY_CONCERN_LABELS, SafetyConcernKey } from "@/lib/renovate/types";

export default function RenovationSummaryPage() {
  const project = useRenovationProjectContext();
  const selectedConcept = project.concepts.find((c) => c.id === project.selectedConceptId) ?? project.concepts[0];
  const activeReview = project.reviewRequests.find((r) => r.status !== "cancelled");
  const acceptedQuotation = project.quotations.find((q) => q.status === "accepted");
  const safetyFlags = (Object.entries(project.assessment.safety.concerns) as [SafetyConcernKey, string][]).filter(([, v]) => v === "yes" || v === "unknown");

  const keep = project.assessment.keepRemoveChange.filter((i) => i.listType === "keep");
  const remove = project.assessment.keepRemoveChange.filter((i) => i.listType === "remove");
  const change = project.assessment.keepRemoveChange.filter((i) => i.listType === "change");

  return (
    <div className="max-w-3xl mx-auto bg-white print:max-w-none">
      <div className="flex items-center justify-between mb-8 print:hidden">
        <h1 className="text-xl font-black text-slate-900">Renovation summary</h1>
        <button type="button" onClick={() => window.print()} className="bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg">
          Print or Save as PDF
        </button>
      </div>

      <div className="border border-slate-200 rounded-2xl p-8 print:border-0 print:p-0 space-y-8">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-xs font-bold uppercase tracking-wide text-[#2ec440] mb-2">HuzaEstate Renovate — Project Summary</p>
          <h1 className="text-3xl font-black text-slate-900 mb-1">{project.name}</h1>
          <p className="text-slate-500">{project.description || "No description provided."}</p>
          <p className="text-sm text-slate-400 mt-2">
            Status: {statusLabel(project.status)} · Generated {formatDate(new Date().toISOString())}
          </p>
        </header>

        <section>
          <h2 className="font-bold text-slate-900 mb-3">Property details</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Location</dt>
            <dd className="text-right font-semibold text-slate-900">{propertyLocationLabel(project)}</dd>
            <dt className="text-slate-500">Property type</dt>
            <dd className="text-right font-semibold text-slate-900">{project.property.propertyType ? PROPERTY_TYPE_LABELS[project.property.propertyType] : "Not provided"}</dd>
            <dt className="text-slate-500">Approx. area</dt>
            <dd className="text-right font-semibold text-slate-900">{project.property.approxAreaSqm ? `${project.property.approxAreaSqm} sqm` : "Not provided"}</dd>
            <dt className="text-slate-500">Occupied during works</dt>
            <dd className="text-right font-semibold text-slate-900">{project.property.willBeOccupiedDuringRenovation === null ? "Not set" : project.property.willBeOccupiedDuringRenovation ? "Yes" : "No"}</dd>
          </dl>
        </section>

        <section>
          <h2 className="font-bold text-slate-900 mb-3">Selected renovation areas</h2>
          <div className="flex flex-wrap gap-2">
            {project.assessment.areas.map((a) => (
              <span key={a.id} className="bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-1.5 rounded-lg">
                {a.customLabel || RENOVATION_AREA_LABELS[a.areaKey]}
              </span>
            ))}
            {project.assessment.areas.length === 0 && <p className="text-sm text-slate-500">No areas selected yet.</p>}
          </div>
        </section>

        <section>
          <h2 className="font-bold text-slate-900 mb-3">Existing condition summary</h2>
          <p className="text-sm text-slate-600">
            {project.assessment.conditions.length} of {project.assessment.areas.length} area{project.assessment.areas.length === 1 ? "" : "s"} assessed ·{" "}
            {project.uploads.photos.length + project.uploads.videos.length + project.uploads.floorPlans.length} reference file{project.uploads.photos.length + project.uploads.videos.length + project.uploads.floorPlans.length === 1 ? "" : "s"} uploaded
          </p>
        </section>

        <section>
          <h2 className="font-bold text-slate-900 mb-3">Keep, remove and change</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-bold text-[#2ec440] mb-1">Keep ({keep.length})</p>
              <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                {keep.map((i) => (
                  <li key={i.id}>{i.item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-red-600 mb-1">Remove ({remove.length})</p>
              <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                {remove.map((i) => (
                  <li key={i.id}>{i.item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-amber-600 mb-1">Change ({change.length})</p>
              <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                {change.map((i) => (
                  <li key={i.id}>{i.item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {selectedConcept && (
          <section>
            <h2 className="font-bold text-slate-900 mb-3">Selected concept — {selectedConcept.name}</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100">
                <Image src={selectedConcept.beforeImage} alt="Before" fill className="object-cover" sizes="350px" />
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100">
                <Image src={selectedConcept.afterImage} alt="After (conceptual)" fill className="object-cover" sizes="350px" />
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-2">{selectedConcept.rationale}</p>
            <p className="text-sm font-semibold text-slate-900">
              {formatCompactRwf(selectedConcept.estimatedCostLowRwf)} – {formatCompactRwf(selectedConcept.estimatedCostHighRwf)} · {selectedConcept.estimatedDurationWeeks} weeks
            </p>
          </section>
        )}

        {project.scope.length > 0 && (
          <section>
            <h2 className="font-bold text-slate-900 mb-3">Scope summary</h2>
            <p className="text-sm text-slate-600">
              {project.scope.length} task{project.scope.length === 1 ? "" : "s"} across {new Set(project.scope.map((s) => s.areaKey)).size} area{new Set(project.scope.map((s) => s.areaKey)).size === 1 ? "" : "s"}. Quantities are indicative only.
            </p>
          </section>
        )}

        {project.budget && (
          <section>
            <h2 className="font-bold text-slate-900 mb-3">Budget range</h2>
            <p className="text-2xl font-black text-slate-900 mb-1">{formatCompactRwf(project.budget.target)}</p>
            <p className="text-sm text-slate-500">
              Range: {formatCompactRwf(project.budget.low)} – {formatCompactRwf(project.budget.high)} · {project.budget.finishLevel} finish
            </p>
          </section>
        )}

        {project.timeline && (
          <section>
            <h2 className="font-bold text-slate-900 mb-3">Timeline</h2>
            <p className="text-sm text-slate-600">Estimated total duration: {project.timeline.totalDurationWeeks} weeks across {project.timeline.phases.length} phases.</p>
          </section>
        )}

        <section>
          <h2 className="font-bold text-slate-900 mb-3">Safety flags</h2>
          {safetyFlags.length === 0 ? (
            <p className="text-sm text-slate-600">No safety concerns flagged during assessment.</p>
          ) : (
            <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
              {safetyFlags.map(([key]) => (
                <li key={key}>{SAFETY_CONCERN_LABELS[key]}</li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-bold text-slate-900 mb-3">Professional review status</h2>
          <p className="text-sm text-slate-600">{activeReview ? `${activeReview.type.replace(/_/g, " ")} — ${activeReview.status.replace(/_/g, " ")}` : "No professional review requested yet."}</p>
        </section>

        <section>
          <h2 className="font-bold text-slate-900 mb-3">Quotation status</h2>
          <p className="text-sm text-slate-600">
            {acceptedQuotation
              ? `Accepted: ${acceptedQuotation.contractor.companyName} — ${formatCompactRwf(acceptedQuotation.total)}`
              : project.quotations.length > 0
              ? `${project.quotations.length} quotation${project.quotations.length === 1 ? "" : "s"} received, none accepted yet.`
              : "No quotations requested yet."}
          </p>
        </section>

        <section className="bg-slate-50 rounded-xl p-5 text-sm text-slate-600 leading-relaxed">
          <p className="font-bold text-slate-900 mb-1">Disclaimer</p>
          <p>
            This summary reflects conceptual renovation directions produced by HuzaEstate Renovate and is not an approved technical design. Budget and timeline figures are indicative only.
            Structural, electrical, plumbing, safety and permit-related work must be reviewed by qualified professionals before execution. Accepting a contractor quotation in this prototype does
            not process payment or create a binding contract.
          </p>
        </section>
      </div>
    </div>
  );
}
