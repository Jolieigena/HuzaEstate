"use client";

import Link from "next/link";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";
import { getNextAction, getProjectProgress } from "@/lib/build/progress";
import { formatCompactRwf, formatDate, formatRelativeTime, projectLocationLabel } from "@/lib/build/format";
import { BRIEF_STEP_KEYS, PROPERTY_USE_LABELS, ROOM_LABELS, RoomKey } from "@/lib/build/types";
import { StatusBadge, ReviewStatusBadge } from "@/components/build/StatusBadge";

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

export default function ProjectOverviewPage() {
  const project = useBuildProjectContext();
  const base = `/studio/build/${project.id}`;
  const nextAction = getNextAction(project);
  const progress = getProjectProgress(project);
  const selectedConcept = project.concepts.find((c) => c.id === project.selectedConceptId);
  const activeReview = project.reviewRequests.find((r) => r.status !== "cancelled" && r.status !== "completed");
  const bedroomsReq = project.brief.household.rooms.find((r) => r.key === "bedrooms");

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

      <div className="bg-[#2ec440]/10 border border-[#2ec440]/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[#2ec440] font-bold text-xs uppercase tracking-wide">Construction Execution</span>
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
                  <img src={selectedConcept.previewImage} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow">
                  <p className="font-bold text-slate-900 mb-1">{selectedConcept.name} concept</p>
                  <p className="text-sm text-slate-500 leading-relaxed mb-3">{selectedConcept.rationale}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-slate-600">
                    <span>{selectedConcept.metrics.floorAreaSqm} sqm</span>
                    <span>{selectedConcept.metrics.bedrooms} bed</span>
                    <span>{selectedConcept.metrics.bathrooms} bath</span>
                    <span>
                      {formatCompactRwf(selectedConcept.metrics.budgetLowRwf)} – {formatCompactRwf(selectedConcept.metrics.budgetHighRwf)}
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

          <SectionCard title="Plot summary" action={<Link href={`${base}/brief`} className="text-sm font-bold text-[#2ec440] hover:text-[#28b039]">Edit</Link>}>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-slate-400 font-semibold">Location</dt>
                <dd className="text-slate-900 font-semibold">{projectLocationLabel(project)}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-semibold">Plot area</dt>
                <dd className="text-slate-900 font-semibold">{project.brief.plot.areaSqm ? `${project.brief.plot.areaSqm} sqm` : "Not set"}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-semibold">Shape</dt>
                <dd className="text-slate-900 font-semibold capitalize">{project.brief.plot.shape}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-semibold">Slope</dt>
                <dd className="text-slate-900 font-semibold capitalize">{project.brief.plot.slope}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-semibold">Property use</dt>
                <dd className="text-slate-900 font-semibold">{project.brief.basics.propertyUse ? PROPERTY_USE_LABELS[project.brief.basics.propertyUse] : "Not set"}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-semibold">Occupants</dt>
                <dd className="text-slate-900 font-semibold">{project.brief.basics.occupants ?? "Not set"}</dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard title="Home requirements" action={<Link href={`${base}/brief`} className="text-sm font-bold text-[#2ec440] hover:text-[#28b039]">Edit</Link>}>
            <div className="flex flex-wrap gap-2">
              <span className="bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-1.5 rounded-lg">{project.brief.household.floors} floor{project.brief.household.floors === 1 ? "" : "s"}</span>
              {bedroomsReq && <span className="bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-1.5 rounded-lg">{bedroomsReq.quantity} bedrooms</span>}
              {project.brief.household.rooms
                .filter((r) => r.key !== "bedrooms")
                .slice(0, 8)
                .map((r) => (
                  <span key={r.key} className="bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-1.5 rounded-lg">
                    {ROOM_LABELS[r.key as RoomKey] ?? r.label}
                    {r.quantity > 1 ? ` × ${r.quantity}` : ""}
                  </span>
                ))}
              {project.brief.household.rooms.length === 0 && <p className="text-slate-500 text-sm">No rooms defined yet.</p>}
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
                <span>{project.brief.completedSteps.length} of {BRIEF_STEP_KEYS.length} steps</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[#2ec440] rounded-full" style={{ width: `${Math.round((project.brief.completedSteps.length / BRIEF_STEP_KEYS.length) * 100)}%` }} />
              </div>
            </div>
            <Link href={`${base}/brief`} className="text-sm font-bold text-[#2ec440] hover:text-[#28b039]">
              {project.brief.completedSteps.length === 0 ? "Start the brief" : "Continue the brief"}
            </Link>
          </SectionCard>

          <SectionCard title="Budget range" action={<Link href={`${base}/budget`} className="text-sm font-bold text-[#2ec440] hover:text-[#28b039]">View budget</Link>}>
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
