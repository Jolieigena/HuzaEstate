"use client";

import Link from "next/link";
import Image from "next/image";
import { Concept } from "@/lib/build/types";
import { formatCompactRwf, formatDate } from "@/lib/build/format";

interface ConceptCardProps {
  concept: Concept;
  projectId: string;
  isSelected: boolean;
  compareChecked: boolean;
  onToggleCompare: () => void;
  onSelectConcept: () => void;
  onRefine: () => void;
  onDuplicate: () => void;
}

export default function ConceptCard({ concept, projectId, isSelected, compareChecked, onToggleCompare, onSelectConcept, onRefine, onDuplicate }: ConceptCardProps) {
  return (
    <div className={`bg-white rounded-3xl overflow-hidden border shadow-sm hover:shadow-xl transition-all flex flex-col ${isSelected ? "border-[#2ec440] ring-1 ring-[#2ec440]" : "border-slate-100"}`}>
      <div className="relative h-48 overflow-hidden">
        <Image src={concept.previewImage} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
        <div className="absolute top-3 left-3 bg-slate-900/70 text-white text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg">Conceptual</div>
        {isSelected && (
          <div className="absolute top-3 right-3 bg-[#2ec440] text-white text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg">Preferred</div>
        )}
        <label className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/95 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 cursor-pointer">
          <input type="checkbox" checked={compareChecked} onChange={onToggleCompare} className="accent-[#2ec440] w-3.5 h-3.5" />
          Compare
        </label>
      </div>

      <div className="p-5 sm:p-6 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-slate-900">{concept.name}</h3>
          <span className="text-xs font-semibold text-slate-400">v{concept.version}</span>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">{concept.rationale}</p>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm text-slate-600 font-semibold mb-4">
          <span>{concept.metrics.floorAreaSqm} sqm</span>
          <span>{concept.metrics.floors} floor{concept.metrics.floors === 1 ? "" : "s"}</span>
          <span>{concept.metrics.bedrooms} bed / {concept.metrics.bathrooms} bath</span>
          <span>{concept.metrics.parking} parking</span>
        </div>

        <p className="text-sm font-bold text-slate-900 mb-3">
          {formatCompactRwf(concept.metrics.budgetLowRwf)} – {formatCompactRwf(concept.metrics.budgetHighRwf)}
        </p>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
              <span>Sustainability</span>
              <span>{concept.metrics.sustainabilityScore}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-[#2ec440] rounded-full" style={{ width: `${concept.metrics.sustainabilityScore}%` }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
              <span>Efficiency</span>
              <span>{concept.metrics.efficiencyScore}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${concept.metrics.efficiencyScore}%` }} />
            </div>
          </div>
        </div>

        <div className="mb-4 space-y-1.5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Key advantage</p>
          <p className="text-sm text-slate-700">{concept.advantages[0]}</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-2">Main compromise</p>
          <p className="text-sm text-slate-700">{concept.compromises[0]}</p>
        </div>

        <p className="text-xs text-slate-400 mb-4">Generated {formatDate(concept.generatedAt)}</p>

        <div className="mt-auto space-y-2">
          <Link
            href={`/studio/build/${projectId}/concepts/${concept.id}`}
            className="block text-center w-full bg-slate-900 hover:bg-[#2ec440] text-white font-semibold py-2.5 rounded-xl transition-all"
          >
            View Concept
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onRefine} className="text-sm font-semibold bg-white border border-slate-200 hover:border-[#2ec440] hover:text-[#2ec440] text-slate-700 py-2.5 rounded-xl transition-all">
              Ask AI to Refine
            </button>
            <button type="button" onClick={onDuplicate} className="text-sm font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 py-2.5 rounded-xl transition-all">
              Duplicate
            </button>
          </div>
          <button
            type="button"
            onClick={onSelectConcept}
            disabled={isSelected}
            className="w-full text-sm font-bold bg-[#2ec440]/10 hover:bg-[#2ec440]/20 disabled:opacity-50 disabled:cursor-not-allowed text-[#2ec440] py-2.5 rounded-xl transition-all"
          >
            {isSelected ? "Preferred Concept" : "Select as Preferred"}
          </button>
        </div>
      </div>
    </div>
  );
}
