"use client";

import Link from "next/link";
import { useRenovationProjectContext } from "@/components/renovate/RenovationProjectContext";
import { getNextAction, getProjectProgress } from "@/lib/renovate/progress";
import { formatCompactRwf, formatDate, formatRelativeTime, propertyLocationLabel } from "@/lib/renovate/format";
import { ASSESSMENT_STEP_KEYS, PROPERTY_TYPE_LABELS, RENOVATION_AREA_LABELS } from "@/lib/renovate/types";
import { StatusBadge, ReviewStatusBadge, QuotationStatusBadge } from "@/components/renovate/StatusBadge";

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function RenovationProjectOverviewPage() {
  const project = useRenovationProjectContext();
  const base = `/studio/renovate/${project.id}`;
  const nextAction = getNextAction(project);
  const progress = getProjectProgress(project);
  const selectedConcept = project.concepts.find((c) => c.id === project.selectedConceptId);
  const activeReview = project.reviewRequests.find((r) => r.status !== "cancelled" && r.status !== "completed");
  const latestQuotation = project.quotations[0];
  const safetyFlags = Object.entries(project.assessment.safety.concerns).filter(([, v]) => v === "yes" || v === "unknown");

  return (
    <div className="space-y-6">
      {nextAction && (
        <div className="bg-slate-900 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[#2ec440] text-xs font-bold uppercase tracking-wide mb-2">Recommended next step</p>
            <h2 className="text-white text-xl font-bold mb-1">{nextAction.label}</h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-lg">{nextAction.description}</p>
          </div>
          <Link href={nextAction.href} className="flex-shrink-0 bg-[#2ec440] hover:bg-[#28b039] text-white font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap text-center">
            Continue
          </Link>
        </div>
      )}

      {safetyFlags.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-amber-900 font-bold text-sm mb-1">Professional inspection required before execution</p>
            <p className="text-amber-800 text-sm leading-relaxed">
              This project flagged {safetyFlags.length} safety-sensitive item{safetyFlags.length === 1 ? "" : "s"} during assessment. Huza AI does not confirm structural, electrical or moisture safety.
            </p>
          </div>
        </div>
      )}

      <div className="bg-[#2ec440]/10 border border-[#2ec440]/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[#2ec440] font-bold text-xs uppercase tracking-wide">Renovation Execution</span>
          <h3 className="text-slate-900 font-bold text-base mt-0.5">Execution & Site Delivery Tracking Available</h3>
          <p className="text-slate-600 text-xs mt-0.5">Track daily site diary, schedule, material deliveries, stage inspections, and handover.</p>
        </div>
        <Link href="/execution" className="px-5 py-2.5 bg-[#2ec440] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-opacity text-center whitespace-nowrap">
          Open Execution Tracking →
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Selected concept" action={<Link href={`${base}/concepts`} className="text-sm font-bold text-[#2ec440] hover:text-[#28b039]">View concepts</Link>}>
            {selectedConcept ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative w-full sm:w-40 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedConcept.afterImage} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow">
                  <p className="font-bold text-slate-900 mb-1">{selectedConcept.name}</p>
                  <p className="text-sm text-slate-500 leading-relaxed mb-3">{selectedConcept.rationale}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-slate-600">
                    <span>{selectedConcept.estimatedDurationWeeks} weeks</span>
                    <span>
                      {formatCompactRwf(selectedConcept.estimatedCostLowRwf)} – {formatCompactRwf(selectedConcept.estimatedCostHighRwf)}
                    </span>
                  </div>
                </div>
              </div>
            ) : project.concepts.length > 0 ? (
              <p className="text-slate-500 text-sm">You have {project.concepts.length} generated concepts but haven&apos;t selected a preferred one yet.</p>
            ) : (
              <p className="text-slate-500 text-sm">No concepts have been generated yet.</p>
            )}
          </SectionCard>

          <SectionCard title="Property summary" action={<Link href={`${base}/assessment`} className="text-sm font-bold text-[#2ec440] hover:text-[#28b039]">Edit</Link>}>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-slate-400 font-semibold">Location</dt>
                <dd className="text-slate-900 font-semibold">{propertyLocationLabel(project)}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-semibold">Property type</dt>
                <dd className="text-slate-900 font-semibold">{project.property.propertyType ? PROPERTY_TYPE_LABELS[project.property.propertyType] : "Not set"}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-semibold">Approx. area</dt>
                <dd className="text-slate-900 font-semibold">{project.property.approxAreaSqm ? `${project.property.approxAreaSqm} sqm` : "Not set"}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-semibold">Floors</dt>
                <dd className="text-slate-900 font-semibold">{project.property.floors ?? "Not set"}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-semibold">Construction year</dt>
                <dd className="text-slate-900 font-semibold">{project.property.constructionYear ?? "Not set"}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-semibold">Occupied during works</dt>
                <dd className="text-slate-900 font-semibold">{project.property.willBeOccupiedDuringRenovation === null ? "Not set" : project.property.willBeOccupiedDuringRenovation ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard title="Renovation areas" action={<Link href={`${base}/assessment`} className="text-sm font-bold text-[#2ec440] hover:text-[#28b039]">Edit</Link>}>
            <div className="flex flex-wrap gap-2">
              {project.assessment.areas.length === 0 ? (
                <p className="text-slate-500 text-sm">No renovation areas selected yet.</p>
              ) : (
                project.assessment.areas.map((a) => (
                  <span key={a.id} className="bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-1.5 rounded-lg">
                    {a.customLabel || RENOVATION_AREA_LABELS[a.areaKey]}
                  </span>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard title="Recent activity" action={<Link href={`${base}/activity`} className="text-sm font-bold text-[#2ec440] hover:text-[#28b039]">View all</Link>}>
            {project.activity.length === 0 ? (
              <p className="text-slate-500 text-sm">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {project.activity.slice(0, 5).map((event) => (
                  <li key={event.id} className="flex items-start gap-3 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2ec440] mt-2 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="text-slate-800">
                        <span className="font-semibold">{event.actor}</span> — {event.details}
                      </p>
                      <p className="text-slate-400 text-xs">{formatRelativeTime(event.timestamp)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Brief completion">
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
                <span>{project.assessment.completedSteps.length} of {ASSESSMENT_STEP_KEYS.length} steps</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[#2ec440] rounded-full" style={{ width: `${Math.round((project.assessment.completedSteps.length / ASSESSMENT_STEP_KEYS.length) * 100)}%` }} />
              </div>
            </div>
            <Link href={`${base}/assessment`} className="text-sm font-bold text-[#2ec440] hover:text-[#28b039]">
              {project.assessment.completedSteps.length === 0 ? "Start the assessment" : "Continue the assessment"}
            </Link>
          </SectionCard>

          <SectionCard title="Indicative budget" action={<Link href={`${base}/budget`} className="text-sm font-bold text-[#2ec440] hover:text-[#28b039]">View budget</Link>}>
            {project.budget ? (
              <>
                <p className="text-2xl font-black text-slate-900 mb-1">{formatCompactRwf(project.budget.target)}</p>
                <p className="text-sm text-slate-500">
                  {formatCompactRwf(project.budget.low)} – {formatCompactRwf(project.budget.high)}
                </p>
              </>
            ) : (
              <p className="text-slate-500 text-sm">No budget estimate calculated yet.</p>
            )}
          </SectionCard>

          {project.scope.length > 0 && (
            <SectionCard title="Scope progress" action={<Link href={`${base}/scope`} className="text-sm font-bold text-[#2ec440] hover:text-[#28b039]">View scope</Link>}>
              <p className="text-2xl font-black text-slate-900 mb-1">{project.scope.length}</p>
              <p className="text-sm text-slate-500">scope item{project.scope.length === 1 ? "" : "s"} across {new Set(project.scope.map((s) => s.areaKey)).size} area{new Set(project.scope.map((s) => s.areaKey)).size === 1 ? "" : "s"}</p>
            </SectionCard>
          )}

          <SectionCard title="Professional review" action={<Link href={`${base}/professionals`} className="text-sm font-bold text-[#2ec440] hover:text-[#28b039]">View</Link>}>
            {activeReview ? (
              <div>
                <ReviewStatusBadge status={activeReview.status} className="mb-2" />
                <p className="text-sm text-slate-600">
                  {activeReview.professional?.name ?? "Awaiting assignment"} · Requested {formatDate(activeReview.submittedAt)}
                </p>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No professional review requested yet.</p>
            )}
          </SectionCard>

          <SectionCard title="Quotations" action={<Link href={`${base}/quotes`} className="text-sm font-bold text-[#2ec440] hover:text-[#28b039]">View</Link>}>
            {latestQuotation ? (
              <div>
                <QuotationStatusBadge status={latestQuotation.status} className="mb-2" />
                <p className="text-sm text-slate-600">{project.quotations.length} quotation{project.quotations.length === 1 ? "" : "s"} received</p>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No quotations requested yet.</p>
            )}
          </SectionCard>

          <SectionCard title="Recent documents" action={<Link href={`${base}/documents`} className="text-sm font-bold text-[#2ec440] hover:text-[#28b039]">View all</Link>}>
            {project.documents.length === 0 ? (
              <p className="text-slate-500 text-sm">No documents yet.</p>
            ) : (
              <ul className="space-y-2">
                {project.documents.slice(0, 4).map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 font-medium truncate">{doc.name}</span>
                    <span className="text-slate-400 text-xs flex-shrink-0 ml-2">{formatDate(doc.date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={project.status} />
            </div>
            <p className="text-xs text-slate-400">Created {formatDate(project.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
