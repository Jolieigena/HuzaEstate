"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";
import { BuildProjectService } from "@/lib/build/projectService";
import { Concept } from "@/lib/build/types";
import { formatCompactRwf } from "@/lib/build/format";
import { useToast } from "@/lib/toast-context";
import ConfirmModal from "@/components/shared/ConfirmModal";
import RefineDrawer from "@/components/build/RefineDrawer";

function levelLabel(n: number): string {
  if (n >= 80) return "Strong";
  if (n >= 60) return "Good";
  if (n >= 40) return "Moderate";
  return "Limited";
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="h-64 bg-white border border-slate-100 rounded-2xl animate-pulse" />}>
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const project = useBuildProjectContext();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const initialIds = searchParams?.get("ids")?.split(",").filter(Boolean) ?? [];

  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds.length ? initialIds : project.concepts.slice(0, 3).map((c) => c.id));
  const [selectTarget, setSelectTarget] = useState<Concept | null>(null);
  const [refineTarget, setRefineTarget] = useState<Concept | null>(null);

  const concepts = useMemo(() => project.concepts.filter((c) => selectedIds.includes(c.id)), [project.concepts, selectedIds]);

  const toggleId = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : prev.length >= 3 ? prev : [...prev, id]));
  };

  if (project.concepts.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 text-center">
        <h1 className="text-xl font-black text-slate-900 mb-2">No concepts to compare yet</h1>
        <p className="text-slate-500 mb-6">Generate concepts first, then come back to compare them side by side.</p>
        <Link href={`/studio/build/${project.id}/concepts`} className="inline-block bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3 px-6 rounded-xl transition-colors">
          Go to Concepts
        </Link>
      </div>
    );
  }

  const lowestCostId = [...project.concepts].sort((a, b) => a.metrics.budgetLowRwf - b.metrics.budgetLowRwf)[0]?.id;
  const largestAreaId = [...project.concepts].sort((a, b) => b.metrics.floorAreaSqm - a.metrics.floorAreaSqm)[0]?.id;
  const bestSustainabilityId = [...project.concepts].sort((a, b) => b.metrics.sustainabilityScore - a.metrics.sustainabilityScore)[0]?.id;
  const balancedId = project.concepts.find((c) => c.direction === "balanced")?.id;

  const rows: { label: string; render: (c: Concept) => React.ReactNode }[] = [
    { label: "Total floor area", render: (c) => `${c.metrics.floorAreaSqm} sqm` },
    { label: "Number of floors", render: (c) => c.metrics.floors },
    { label: "Bedrooms", render: (c) => c.metrics.bedrooms },
    { label: "Bathrooms", render: (c) => c.metrics.bathrooms },
    { label: "Parking", render: (c) => c.metrics.parking },
    { label: "Approximate footprint", render: (c) => `${Math.round(c.metrics.floorAreaSqm / c.metrics.floors)} sqm / floor` },
    { label: "Outdoor space", render: (c) => (c.direction === "spacious" ? "Generous" : c.direction === "balanced" ? "Moderate" : "Compact") },
    { label: "Natural light", render: (c) => levelLabel(c.metrics.efficiencyScore < 70 ? 75 : 65) },
    { label: "Privacy", render: () => "Bedrooms separated from shared living areas" },
    { label: "Expandability", render: (c) => (c.direction === "efficient" ? "Limited" : c.direction === "balanced" ? "Moderate" : "High") },
    { label: "Sustainability score", render: (c) => `${c.metrics.sustainabilityScore} / 100` },
    { label: "Budget range", render: (c) => `${formatCompactRwf(c.metrics.budgetLowRwf)} – ${formatCompactRwf(c.metrics.budgetHighRwf)}` },
    { label: "Build complexity", render: (c) => (c.direction === "spacious" ? "Higher" : c.direction === "efficient" ? "Lower" : "Moderate") },
    { label: "Advantages", render: (c) => <ul className="list-disc list-inside text-left space-y-0.5">{c.advantages.map((a) => <li key={a}>{a}</li>)}</ul> },
    { label: "Compromises", render: (c) => <ul className="list-disc list-inside text-left space-y-0.5">{c.compromises.map((a) => <li key={a}>{a}</li>)}</ul> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 mb-1">Compare concepts</h1>
        <p className="text-slate-500 text-sm">Compare two or three concepts side by side. Choose based on your priorities — no direction is universally &ldquo;best.&rdquo;</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex flex-wrap gap-2">
        {project.concepts.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => toggleId(c.id)}
            aria-pressed={selectedIds.includes(c.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              selectedIds.includes(c.id) ? "bg-[#2ec440]/10 border-[#2ec440] text-[#2ec440]" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {c.name} (v{c.version})
          </button>
        ))}
      </div>

      {concepts.length < 2 ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-10 text-center text-slate-500">Select at least two concepts above to compare.</div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="sticky left-0 bg-white text-left p-4 font-bold text-slate-400 w-40">Category</th>
                {concepts.map((c) => (
                  <th key={c.id} className="p-4 text-left min-w-[220px]">
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 mb-2">
                      <Image src={c.previewImage} alt="" fill className="object-cover" sizes="240px" />
                    </div>
                    <p className="font-bold text-slate-900">{c.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.id === lowestCostId && <span className="text-[10px] font-bold bg-[#2ec440]/10 text-[#2ec440] px-2 py-0.5 rounded-full">Lowest cost</span>}
                      {c.id === largestAreaId && <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Largest space</span>}
                      {c.id === bestSustainabilityId && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Most sustainable</span>}
                      {c.id === balancedId && <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Balanced option</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-slate-50 last:border-b-0 align-top">
                  <td className="sticky left-0 bg-white p-4 font-bold text-slate-500 text-xs uppercase tracking-wide">{row.label}</td>
                  {concepts.map((c) => (
                    <td key={c.id} className="p-4 text-slate-700">
                      {row.render(c)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="sticky left-0 bg-white p-4" />
                {concepts.map((c) => (
                  <td key={c.id} className="p-4">
                    <div className="flex flex-col gap-2">
                      <Link href={`/studio/build/${project.id}/concepts/${c.id}`} className="text-center text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-xl transition-colors">
                        View Full Concept
                      </Link>
                      <button type="button" onClick={() => setSelectTarget(c)} className="text-sm font-bold bg-[#2ec440]/10 hover:bg-[#2ec440]/20 text-[#2ec440] py-2 rounded-xl transition-colors">
                        Select Preferred
                      </button>
                      <button type="button" onClick={() => setRefineTarget(c)} className="text-sm font-semibold bg-white border border-slate-200 hover:border-[#2ec440] hover:text-[#2ec440] text-slate-700 py-2 rounded-xl transition-colors">
                        Refine with Huza AI
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400 italic">The right concept depends on your priorities — cost, space, sustainability and build complexity often trade off against each other.</p>

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
      />
      <RefineDrawer projectId={project.id} concept={refineTarget} open={refineTarget !== null} onClose={() => setRefineTarget(null)} />
    </div>
  );
}
