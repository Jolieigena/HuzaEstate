"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";
import { checkGenerationAllowed } from "@/lib/admin/featureFlags";
import { BuildProjectService } from "@/lib/build/projectService";
import { Concept, HOME_STYLE_LABELS } from "@/lib/build/types";
import { collectBriefWarnings } from "@/lib/build/briefValidation";
import { formatCompactRwf } from "@/lib/build/format";
import { useToast } from "@/lib/toast-context";
import Dialog from "@/components/Dialog";
import ConfirmModal from "@/components/shared/ConfirmModal";
import GenerationProgress from "@/components/build/GenerationProgress";
import ConceptCard from "@/components/build/ConceptCard";
import RefineDrawer from "@/components/build/RefineDrawer";

type SortKey = "default" | "cost" | "area" | "sustainability" | "efficiency";

function GenerateConceptsModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  const project = useBuildProjectContext();
  const titleId = useId();
  const bedrooms = project.brief.household.rooms.find((r) => r.key === "bedrooms")?.quantity ?? 0;
  const warnings = collectBriefWarnings(project.brief);
  const requirementsCount = project.brief.household.rooms.length + project.brief.sustainability.items.filter((i) => i.priority).length + project.brief.accessibility.items.filter((i) => i.priority).length;
  const generationAllowed = open ? checkGenerationAllowed("build") : { allowed: true, message: "" };

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName="max-w-lg">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="text-xl font-black text-slate-900 mb-1">
          Generate three concepts
        </h2>
        <p className="text-slate-500 text-sm mb-6">Huza AI will create Efficient, Balanced and Spacious directions from your confirmed brief.</p>

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
            Generate Three Concepts
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export default function ConceptsPage() {
  const project = useBuildProjectContext();
  const router = useRouter();
  const { showToast } = useToast();

  const [sort, setSort] = useState<SortKey>("default");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectTarget, setSelectTarget] = useState<Concept | null>(null);
  const [refineTarget, setRefineTarget] = useState<Concept | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const briefReady = project.status !== "draft" && project.status !== "brief_in_progress";

  const sortedConcepts = useMemo(() => {
    const list = [...project.concepts];
    switch (sort) {
      case "cost":
        return list.sort((a, b) => a.metrics.budgetLowRwf - b.metrics.budgetLowRwf);
      case "area":
        return list.sort((a, b) => b.metrics.floorAreaSqm - a.metrics.floorAreaSqm);
      case "sustainability":
        return list.sort((a, b) => b.metrics.sustainabilityScore - a.metrics.sustainabilityScore);
      case "efficiency":
        return list.sort((a, b) => b.metrics.efficiencyScore - a.metrics.efficiencyScore);
      default:
        return list;
    }
  }, [project.concepts, sort]);

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
        <h2 className="text-2xl font-black text-slate-900 mb-3">No concepts generated yet</h2>
        <p className="text-slate-500 leading-relaxed max-w-md mx-auto mb-8">
          {briefReady
            ? "Your brief is confirmed. Generate three concept directions — Efficient, Balanced and Spacious — to compare."
            : "Confirm your design brief before generating concepts."}
        </p>
        {briefReady ? (
          <button type="button" onClick={() => setGenerateOpen(true)} className="inline-block bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 px-8 rounded-xl transition-colors shadow-lg">
            Generate Concepts
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900">Generated concepts</h1>
          <p className="text-slate-500 text-sm">Conceptual design directions — not construction-ready drawings.</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="concept-sort" className="sr-only">
            Sort concepts
          </label>
          <select id="concept-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-3 py-2.5">
            <option value="default">Default order</option>
            <option value="cost">Lowest estimated cost</option>
            <option value="area">Largest floor area</option>
            <option value="sustainability">Best sustainability</option>
            <option value="efficiency">Best space efficiency</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedConcepts.map((concept) => (
          <ConceptCard
            key={concept.id}
            concept={concept}
            projectId={project.id}
            isSelected={project.selectedConceptId === concept.id}
            compareChecked={compareIds.includes(concept.id)}
            onToggleCompare={() =>
              setCompareIds((prev) => (prev.includes(concept.id) ? prev.filter((id) => id !== concept.id) : prev.length >= 3 ? prev : [...prev, concept.id]))
            }
            onSelectConcept={() => setSelectTarget(concept)}
            onRefine={() => setRefineTarget(concept)}
            onDuplicate={() => {
              BuildProjectService.duplicateConceptAsVersion(project.id, concept.id);
              showToast("Duplicated as a new version.");
            }}
          />
        ))}
      </div>

      {compareIds.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white rounded-full shadow-2xl px-6 py-3.5 flex items-center gap-4">
          <span className="text-sm font-semibold">{compareIds.length} concepts selected</span>
          <button
            type="button"
            onClick={() => router.push(`/studio/build/${project.id}/compare?ids=${compareIds.join(",")}`)}
            className="bg-[#2ec440] hover:bg-[#28b039] text-white font-bold text-sm px-5 py-2 rounded-full transition-colors"
          >
            Compare
          </button>
          <button type="button" onClick={() => setCompareIds([])} aria-label="Clear compare selection" className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <ConfirmModal
        open={selectTarget !== null}
        onClose={() => setSelectTarget(null)}
        title={selectTarget ? `Select "${selectTarget.name}" as preferred?` : ""}
        confirmLabel="Select as Preferred"
        description="You can change your preferred concept at any time."
        onConfirm={() => {
          if (!selectTarget) return;
          BuildProjectService.selectConcept(project.id, selectTarget.id);
          showToast("Concept selected as preferred.");
          setSelectTarget(null);
        }}
      >
        {selectTarget && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm space-y-2">
            <p className="font-bold text-slate-900">Main advantages</p>
            <ul className="list-disc list-inside text-slate-600">
              {selectTarget.advantages.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <p className="font-bold text-slate-900 mt-2">Budget range</p>
            <p className="text-slate-600">
              {formatCompactRwf(selectTarget.metrics.budgetLowRwf)} – {formatCompactRwf(selectTarget.metrics.budgetHighRwf)}
            </p>
            <p className="font-bold text-slate-900 mt-2">Important compromises</p>
            <ul className="list-disc list-inside text-slate-600">
              {selectTarget.compromises.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </ConfirmModal>

      <RefineDrawer projectId={project.id} concept={refineTarget} open={refineTarget !== null} onClose={() => setRefineTarget(null)} />

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
