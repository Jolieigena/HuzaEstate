"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRenovationProjectContext } from "@/components/renovate/RenovationProjectContext";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { formatCompactRwf, formatDate } from "@/lib/renovate/format";
import { useToast } from "@/lib/toast-context";
import { DISRUPTION_LEVEL_LABELS } from "@/lib/renovate/types";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import ConfirmModal from "@/components/shared/ConfirmModal";
import RefineDrawer from "@/components/renovate/RefineDrawer";
import TargetedEditPanel from "@/components/renovate/TargetedEditPanel";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-7">
      <h2 className="text-lg font-bold text-slate-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function ConceptDetailPage() {
  const project = useRenovationProjectContext();
  const params = useParams<{ conceptId: string }>();
  const { showToast } = useToast();
  const concept = project.concepts.find((c) => c.id === params?.conceptId);

  const [areaIndex, setAreaIndex] = useState(0);
  const [selectOpen, setSelectOpen] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [targetedEditOpen, setTargetedEditOpen] = useState(false);

  if (!concept) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 text-center">
        <h1 className="text-xl font-black text-slate-900 mb-2">Concept not found</h1>
        <p className="text-slate-500 mb-6">This concept may have been removed or the link is incorrect.</p>
        <Link href={`/studio/renovate/${project.id}/concepts`} className="inline-block bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3 px-6 rounded-xl transition-colors">
          Back to Concepts
        </Link>
      </div>
    );
  }

  const isSelected = project.selectedConceptId === concept.id;
  const activeAreaView = concept.areaViews[areaIndex] ?? { areaKey: "living_room" as const, label: "Overview", beforeImage: concept.beforeImage, afterImage: concept.afterImage };

  return (
    <div className="space-y-6">
      <Section title="Overview">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-black text-slate-900">{concept.name}</h1>
          <span className="text-sm font-semibold text-slate-400">v{concept.version}</span>
          {isSelected && <span className="bg-[#2ec440]/10 text-[#2ec440] text-xs font-bold px-2.5 py-1 rounded-lg">Selected concept</span>}
        </div>
        <p className="text-slate-600 leading-relaxed mb-4">{concept.rationale}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-2">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-400 text-xs font-bold">Estimated budget</p>
            <p className="font-bold text-slate-900">
              {formatCompactRwf(concept.estimatedCostLowRwf)} – {formatCompactRwf(concept.estimatedCostHighRwf)}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-400 text-xs font-bold">Estimated duration</p>
            <p className="font-bold text-slate-900">{concept.estimatedDurationWeeks} weeks</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-400 text-xs font-bold">Disruption</p>
            <p className="font-bold text-slate-900">{DISRUPTION_LEVEL_LABELS[concept.disruptionLevel]}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-400 text-xs font-bold">Material reuse score</p>
            <p className="font-bold text-slate-900">{concept.sustainabilityScore}/100</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 italic">Conceptual renovation direction — not an approved technical design. Generated {formatDate(concept.generatedAt)}.</p>
      </Section>

      <Section title="Before and after">
        {concept.areaViews.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {concept.areaViews.map((v, i) => (
              <button
                key={v.areaKey + i}
                type="button"
                onClick={() => setAreaIndex(i)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${areaIndex === i ? "bg-[#2ec440]/10 text-[#2ec440]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
        <BeforeAfterSlider
          beforeSrc={activeAreaView.beforeImage}
          afterSrc={activeAreaView.afterImage}
          beforeAlt={`${activeAreaView.label} before renovation`}
          afterAlt={`${activeAreaView.label} after renovation (conceptual)`}
        />
      </Section>

      <Section title="What remains, changes and is removed">
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-bold text-[#2ec440] mb-1.5">What remains</p>
            <ul className="list-disc list-inside text-slate-600 space-y-0.5">
              {concept.whatRemains.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-bold text-amber-600 mb-1.5">What changes</p>
            <ul className="list-disc list-inside text-slate-600 space-y-0.5">
              {concept.whatChanges.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-bold text-red-600 mb-1.5">What is removed</p>
            <ul className="list-disc list-inside text-slate-600 space-y-0.5">
              {concept.whatIsRemoved.length ? concept.whatIsRemoved.map((i) => <li key={i}>{i}</li>) : <li className="list-none text-slate-400">Nothing flagged for removal.</li>}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Materials, colours and direction">
        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-bold text-slate-700">Suggested materials</dt>
            <dd className="text-slate-600">{concept.suggestedMaterials.join(", ")}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-700">Suggested colours</dt>
            <dd className="text-slate-600">{concept.suggestedColours.join(", ")}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-700">Lighting direction</dt>
            <dd className="text-slate-600">{concept.lightingDirection}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-700">Storage strategy</dt>
            <dd className="text-slate-600">{concept.storageStrategy}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-700">Furniture direction</dt>
            <dd className="text-slate-600">{concept.furnitureDirection}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-700">Sustainability considerations</dt>
            <dd className="text-slate-600">{concept.sustainabilityConsiderations}</dd>
          </div>
        </dl>
      </Section>

      <Section title="Assumptions and risks">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-bold text-slate-700 mb-1">Assumptions</p>
            <ul className="list-disc list-inside text-slate-600 space-y-0.5">
              {concept.assumptions.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">Risks</p>
            <ul className="list-disc list-inside text-slate-600 space-y-0.5">
              {concept.risks.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        </div>
        {concept.professionalReviewRequired && (
          <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-sm font-bold text-purple-800">Professional review recommended before execution.</p>
          </div>
        )}
      </Section>

      <Section title="Actions">
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setSelectOpen(true)} disabled={isSelected} className="bg-[#2ec440]/10 hover:bg-[#2ec440]/20 disabled:opacity-50 text-[#2ec440] font-bold px-5 py-3 rounded-xl transition-colors">
            {isSelected ? "Selected Concept" : "Select Concept"}
          </button>
          <button type="button" onClick={() => setRefineOpen(true)} className="bg-white border border-slate-200 hover:border-[#2ec440] hover:text-[#2ec440] text-slate-700 font-bold px-5 py-3 rounded-xl transition-colors">
            Refine with Huza AI
          </button>
          <button type="button" onClick={() => setTargetedEditOpen(true)} className="bg-white border border-slate-200 hover:border-[#2ec440] hover:text-[#2ec440] text-slate-700 font-bold px-5 py-3 rounded-xl transition-colors">
            Edit a Specific Part
          </button>
          <Link href={`/studio/renovate/${project.id}/designer`} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold px-5 py-3 rounded-xl transition-colors">
            Open Manual Planner
          </Link>
          <Link href={`/studio/renovate/${project.id}/compare?ids=${concept.id}`} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold px-5 py-3 rounded-xl transition-colors">
            Compare
          </Link>
          <Link href={`/studio/renovate/${project.id}/scope`} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold px-5 py-3 rounded-xl transition-colors">
            View Scope
          </Link>
          <Link href={`/studio/renovate/${project.id}/budget`} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold px-5 py-3 rounded-xl transition-colors">
            View Budget
          </Link>
          <Link href={`/studio/renovate/${project.id}/professionals`} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold px-5 py-3 rounded-xl transition-colors">
            Request Professional Review
          </Link>
          <Link href={`/studio/renovate/${project.id}/quotes`} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold px-5 py-3 rounded-xl transition-colors">
            Request Contractor Quotations
          </Link>
          <Link href={`/studio/renovate/${project.id}/documents`} className="bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-5 py-3 rounded-xl transition-colors">
            Download Summary
          </Link>
        </div>
      </Section>

      <ConfirmModal
        open={selectOpen}
        onClose={() => setSelectOpen(false)}
        title={`Select "${concept.name}" as your concept?`}
        confirmLabel="Select Concept"
        description="You can change your selected concept at any time."
        onConfirm={() => {
          RenovationProjectService.selectConcept(project.id, concept.id);
          showToast("Concept selected.");
          setSelectOpen(false);
        }}
      />
      <RefineDrawer projectId={project.id} concept={concept} open={refineOpen} onClose={() => setRefineOpen(false)} />
      <TargetedEditPanel projectId={project.id} concept={concept} open={targetedEditOpen} onClose={() => setTargetedEditOpen(false)} />
    </div>
  );
}
