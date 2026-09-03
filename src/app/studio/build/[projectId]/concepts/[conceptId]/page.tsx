"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";
import { BuildProjectService } from "@/lib/build/projectService";
import { formatCompactRwf, formatDate } from "@/lib/build/format";
import { useToast } from "@/lib/toast-context";
import FloorPlanSvg from "@/components/build/FloorPlanSvg";
import ConfirmModal from "@/components/shared/ConfirmModal";
import RefineDrawer from "@/components/build/RefineDrawer";
import { ExteriorViews } from "@/lib/build/types";

const EXTERIOR_LABELS: { key: keyof ExteriorViews; label: string }[] = [
  { key: "front", label: "Front" },
  { key: "rear", label: "Rear" },
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
  { key: "day", label: "Day" },
  { key: "evening", label: "Evening" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-7">
      <h2 className="text-lg font-bold text-slate-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function ConceptDetailPage() {
  const project = useBuildProjectContext();
  const params = useParams<{ conceptId: string }>();
  const { showToast } = useToast();
  const concept = project.concepts.find((c) => c.id === params?.conceptId);

  const [floorIndex, setFloorIndex] = useState(0);
  const [exteriorView, setExteriorView] = useState<keyof ExteriorViews>("front");
  const [selectOpen, setSelectOpen] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);

  if (!concept) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 text-center">
        <h1 className="text-xl font-black text-slate-900 mb-2">Concept not found</h1>
        <p className="text-slate-500 mb-6">This concept may have been removed or the link is incorrect.</p>
        <Link href={`/studio/build/${project.id}/concepts`} className="inline-block bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3 px-6 rounded-xl transition-colors">
          Back to Concepts
        </Link>
      </div>
    );
  }

  const isSelected = project.selectedConceptId === concept.id;
  const floor = concept.floors[floorIndex] ?? concept.floors[0];

  return (
    <div className="space-y-6">
      <Section title="Overview">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100">
            <Image src={concept.previewImage} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 600px" />
            <div className="absolute top-3 left-3 bg-slate-900/70 text-white text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg">Conceptual</div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-black text-slate-900">{concept.name}</h1>
              <span className="text-sm font-semibold text-slate-400">v{concept.version}</span>
              {isSelected && <span className="bg-[#2ec440]/10 text-[#2ec440] text-xs font-bold px-2.5 py-1 rounded-lg">Preferred concept</span>}
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">{concept.rationale}</p>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs font-bold">Floor area</p>
                <p className="font-bold text-slate-900">{concept.metrics.floorAreaSqm} sqm</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs font-bold">Floors</p>
                <p className="font-bold text-slate-900">{concept.metrics.floors}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs font-bold">Bedrooms / Bathrooms</p>
                <p className="font-bold text-slate-900">{concept.metrics.bedrooms} / {concept.metrics.bathrooms}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs font-bold">Budget range</p>
                <p className="font-bold text-slate-900">{formatCompactRwf(concept.metrics.budgetLowRwf)} – {formatCompactRwf(concept.metrics.budgetHighRwf)}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 italic">Conceptual design direction — not an approved construction drawing. Generated {formatDate(concept.generatedAt)}.</p>
          </div>
        </div>
      </Section>

      <Section title="Site concept">
        <p className="text-sm text-slate-600 leading-relaxed mb-3">{concept.decisions.plotResponse}</p>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          <span className="bg-slate-100 px-3 py-1.5 rounded-lg">House footprint: ground floor, set back from the road boundary</span>
          <span className="bg-slate-100 px-3 py-1.5 rounded-lg">{concept.metrics.parking} parking spaces near the entrance</span>
          <span className="bg-slate-100 px-3 py-1.5 rounded-lg">Outdoor space reserved on the rear/side of the plot</span>
          <span className="bg-slate-100 px-3 py-1.5 rounded-lg">Room left for future expansion</span>
        </div>
      </Section>

      <Section title="Floor plans">
        <div className="flex gap-2 mb-4">
          {concept.floors.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFloorIndex(i)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${floorIndex === i ? "bg-[#2ec440]/10 text-[#2ec440]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {f.name}
            </button>
          ))}
        </div>
        <FloorPlanSvg floor={floor} />
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Rooms on this floor</p>
            <ul className="space-y-1">
              {floor.rooms.map((r) => (
                <li key={r.id} className="flex justify-between text-sm text-slate-700">
                  <span>{r.name}</span>
                  <span className="text-slate-400">{(r.w * r.h).toFixed(1)} sqm</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Floor total</p>
            <p className="text-xl font-black text-slate-900">{floor.rooms.reduce((s, r) => s + r.w * r.h, 0).toFixed(0)} sqm</p>
            <p className="text-xs text-slate-400 mt-2">Circulation is approximated within room sizing, not shown separately.</p>
          </div>
        </div>
      </Section>

      <Section title="Exterior views">
        <div className="flex flex-wrap gap-2 mb-4">
          {EXTERIOR_LABELS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setExteriorView(v.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${exteriorView === v.key ? "bg-[#2ec440]/10 text-[#2ec440]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100">
          <Image src={concept.exteriorViews[exteriorView]} alt={`${exteriorView} exterior view`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 800px" />
          <div className="absolute top-3 left-3 bg-slate-900/70 text-white text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg">Conceptual</div>
        </div>
      </Section>

      <Section title="Interior directions">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {concept.interiorDirections.map((dir) => (
            <div key={dir.room}>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2">
                <Image src={dir.image} alt={dir.room} fill className="object-cover" sizes="240px" />
              </div>
              <p className="text-sm font-bold text-slate-900">{dir.room}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{dir.note}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Design decisions">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-bold text-slate-700">Room grouping</dt>
            <dd className="text-slate-600">{concept.decisions.grouping}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-700">Privacy</dt>
            <dd className="text-slate-600">{concept.decisions.privacy}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-700">Natural light</dt>
            <dd className="text-slate-600">{concept.decisions.naturalLight}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-700">Budget response</dt>
            <dd className="text-slate-600">{concept.decisions.budgetResponse}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-700">Future expansion</dt>
            <dd className="text-slate-600">{concept.decisions.futureExpansion}</dd>
          </div>
        </dl>
      </Section>

      <Section title="Risks and assumptions">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          {([
            ["Missing site information", concept.risks.missingSiteInfo],
            ["Planning assumptions", concept.risks.planningAssumptions],
            ["Structural assumptions", concept.risks.structuralAssumptions],
            ["Budget assumptions", concept.risks.budgetAssumptions],
          ] as [string, string[]][]).map(([label, items]) =>
            items.length > 0 ? (
              <div key={label}>
                <p className="font-bold text-slate-700 mb-1">{label}</p>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </div>
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-800 mb-1">Needs professional validation</p>
          <p className="text-sm text-amber-700">{concept.risks.needsProfessionalValidation.join(", ")}</p>
        </div>
      </Section>

      <Section title="Actions">
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setSelectOpen(true)} disabled={isSelected} className="bg-[#2ec440]/10 hover:bg-[#2ec440]/20 disabled:opacity-50 text-[#2ec440] font-bold px-5 py-3 rounded-xl transition-colors">
            {isSelected ? "Preferred Concept" : "Select Concept"}
          </button>
          <button type="button" onClick={() => setRefineOpen(true)} className="bg-white border border-slate-200 hover:border-[#2ec440] hover:text-[#2ec440] text-slate-700 font-bold px-5 py-3 rounded-xl transition-colors">
            Refine with Huza AI
          </button>
          <Link href={`/studio/build/${project.id}/designer?fromConcept=${concept.id}`} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold px-5 py-3 rounded-xl transition-colors">
            Open in Manual Designer
          </Link>
          <Link href={`/studio/build/${project.id}/compare?ids=${concept.id}`} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold px-5 py-3 rounded-xl transition-colors">
            Compare
          </Link>
          <Link href={`/studio/build/${project.id}/budget`} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold px-5 py-3 rounded-xl transition-colors">
            View Budget
          </Link>
          <Link href={`/studio/build/${project.id}/professionals`} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold px-5 py-3 rounded-xl transition-colors">
            Request Professional Review
          </Link>
          <Link href={`/studio/build/${project.id}/summary`} className="bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-5 py-3 rounded-xl transition-colors">
            Download Project Summary
          </Link>
        </div>
      </Section>

      <ConfirmModal
        open={selectOpen}
        onClose={() => setSelectOpen(false)}
        title={`Select "${concept.name}" as preferred?`}
        confirmLabel="Select as Preferred"
        description="You can change your preferred concept at any time."
        onConfirm={() => {
          BuildProjectService.selectConcept(project.id, concept.id);
          showToast("Concept selected as preferred.");
          setSelectOpen(false);
        }}
      />
      <RefineDrawer projectId={project.id} concept={concept} open={refineOpen} onClose={() => setRefineOpen(false)} />
    </div>
  );
}
