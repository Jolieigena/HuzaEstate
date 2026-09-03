"use client";

import { useEffect, useMemo, useState } from "react";
import { useRenovationProjectContext } from "@/components/renovate/RenovationProjectContext";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { calculateRenovationBudget } from "@/lib/renovate/budget";
import { ESTIMATE_TYPE_LABELS, FINISH_LEVEL_LABELS, FinishLevel } from "@/lib/renovate/types";
import { formatCompactRwf, formatDateTime } from "@/lib/renovate/format";
import { useToast } from "@/lib/toast-context";

export default function BudgetPage() {
  const project = useRenovationProjectContext();
  const { showToast } = useToast();

  const defaultArea = useMemo(() => Math.max(20, project.assessment.areas.reduce((sum, a) => sum + (parseFloat(a.approxDimensions) || 15), 0)), [project.assessment.areas]);

  const [area, setArea] = useState(defaultArea);
  const [finishLevel, setFinishLevel] = useState<FinishLevel>(project.budget?.finishLevel ?? project.assessment.budgetTimeline.finishLevel);
  const [contingency, setContingency] = useState(project.budget?.contingencyPct ?? 10);
  const [furniture, setFurniture] = useState(project.budget?.includeFurniture ?? project.assessment.budgetTimeline.furnitureIncluded);
  const [appliances, setAppliances] = useState(project.budget?.includeAppliances ?? project.assessment.budgetTimeline.appliancesIncluded);
  const [landscaping, setLandscaping] = useState(project.budget?.includeLandscaping ?? project.assessment.areas.some((a) => a.areaKey === "garden" || a.areaKey === "landscaping"));
  const [temporaryAccommodation, setTemporaryAccommodation] = useState(project.budget?.includeTemporaryAccommodation ?? false);
  const [professionalFees, setProfessionalFees] = useState(project.budget?.includeProfessionalFees ?? project.assessment.budgetTimeline.professionalFeesIncluded);

  const liveEstimate = useMemo(
    () =>
      calculateRenovationBudget({
        totalAreaSqm: area,
        finishLevel,
        contingencyPct: contingency,
        includeFurniture: furniture,
        includeAppliances: appliances,
        includeLandscaping: landscaping,
        includeTemporaryAccommodation: temporaryAccommodation,
        includeProfessionalFees: professionalFees,
      }),
    [area, finishLevel, contingency, furniture, appliances, landscaping, temporaryAccommodation, professionalFees]
  );

  useEffect(() => {
    if (!project.budget) {
      RenovationProjectService.recalculateBudget(project.id, {
        totalAreaSqm: area,
        finishLevel,
        contingencyPct: contingency,
        includeFurniture: furniture,
        includeAppliances: appliances,
        includeLandscaping: landscaping,
        includeTemporaryAccommodation: temporaryAccommodation,
        includeProfessionalFees: professionalFees,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const saved = project.budget;
  const hasChanges = saved && (saved.finishLevel !== finishLevel || saved.contingencyPct !== contingency || saved.includeFurniture !== furniture || saved.includeAppliances !== appliances || saved.includeLandscaping !== landscaping || saved.includeTemporaryAccommodation !== temporaryAccommodation || saved.includeProfessionalFees !== professionalFees);

  const handleSave = () => {
    RenovationProjectService.recalculateBudget(project.id, {
      totalAreaSqm: area,
      finishLevel,
      contingencyPct: contingency,
      includeFurniture: furniture,
      includeAppliances: appliances,
      includeLandscaping: landscaping,
      includeTemporaryAccommodation: temporaryAccommodation,
      includeProfessionalFees: professionalFees,
    });
    showToast("Budget updated.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 mb-1">Indicative renovation budget</h1>
        <p className="text-slate-500 text-sm">All figures shown in RWF, based on your current assumptions.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Low estimate</p>
          <p className="text-2xl font-black text-slate-900">{formatCompactRwf(liveEstimate.low)}</p>
        </div>
        <div className="bg-white border-2 border-[#2ec440] rounded-2xl shadow-sm p-6">
          <p className="text-xs font-bold text-[#2ec440] uppercase tracking-wide mb-1">Target estimate</p>
          <p className="text-2xl font-black text-slate-900">{formatCompactRwf(liveEstimate.target)}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">High estimate</p>
          <p className="text-2xl font-black text-slate-900">{formatCompactRwf(liveEstimate.high)}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 grid sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-slate-400 font-semibold">Materials estimate</p>
          <p className="font-bold text-slate-900">{formatCompactRwf(liveEstimate.materialsEstimate)}</p>
        </div>
        <div>
          <p className="text-slate-400 font-semibold">Labour estimate</p>
          <p className="font-bold text-slate-900">{formatCompactRwf(liveEstimate.labourEstimate)}</p>
        </div>
        <div>
          <p className="text-slate-400 font-semibold">Professional fees</p>
          <p className="font-bold text-slate-900">{formatCompactRwf(liveEstimate.professionalFeesEstimate)}</p>
        </div>
        <div>
          <p className="text-slate-400 font-semibold">Last recalculated</p>
          <p className="font-bold text-slate-900">{saved ? formatDateTime(saved.lastCalculated) : "Not yet saved"}</p>
        </div>
      </div>

      {project.selectedConceptId && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-600">
          Estimate based on the selected concept and {project.assessment.areas.length} renovation area{project.assessment.areas.length === 1 ? "" : "s"}.
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-4">Adjust assumptions</h2>
        <div className="grid sm:grid-cols-2 gap-5 mb-5">
          <div>
            <label htmlFor="budget-area" className="block text-sm font-bold text-slate-700 mb-2">
              Renovated area assumption (sqm)
            </label>
            <input
              id="budget-area"
              type="number"
              min={1}
              value={area}
              onChange={(e) => setArea(Number(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440]"
            />
          </div>
          <div>
            <label htmlFor="budget-contingency" className="block text-sm font-bold text-slate-700 mb-2">
              Contingency ({contingency}%)
            </label>
            <input id="budget-contingency" type="range" min={5} max={25} value={contingency} onChange={(e) => setContingency(Number(e.target.value))} className="w-full accent-[#2ec440]" />
          </div>
        </div>

        <p className="text-sm font-bold text-slate-700 mb-2">Finish level</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          {(Object.entries(FINISH_LEVEL_LABELS) as [FinishLevel, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFinishLevel(key)}
              aria-pressed={finishLevel === key}
              className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                finishLevel === key ? "bg-[#2ec440]/10 border-[#2ec440] text-[#2ec440]" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer">
            <input type="checkbox" checked={furniture} onChange={(e) => setFurniture(e.target.checked)} className="accent-[#2ec440] w-4 h-4" />
            <span className="text-sm font-semibold text-slate-700">Include furniture</span>
          </label>
          <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer">
            <input type="checkbox" checked={appliances} onChange={(e) => setAppliances(e.target.checked)} className="accent-[#2ec440] w-4 h-4" />
            <span className="text-sm font-semibold text-slate-700">Include appliances</span>
          </label>
          <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer">
            <input type="checkbox" checked={landscaping} onChange={(e) => setLandscaping(e.target.checked)} className="accent-[#2ec440] w-4 h-4" />
            <span className="text-sm font-semibold text-slate-700">Include landscaping</span>
          </label>
          <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer">
            <input type="checkbox" checked={temporaryAccommodation} onChange={(e) => setTemporaryAccommodation(e.target.checked)} className="accent-[#2ec440] w-4 h-4" />
            <span className="text-sm font-semibold text-slate-700">Include temporary accommodation</span>
          </label>
          <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer">
            <input type="checkbox" checked={professionalFees} onChange={(e) => setProfessionalFees(e.target.checked)} className="accent-[#2ec440] w-4 h-4" />
            <span className="text-sm font-semibold text-slate-700">Include professional fees</span>
          </label>
        </div>

        {hasChanges && saved && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800">
            Target changes from {formatCompactRwf(saved.target)} to <span className="font-bold">{formatCompactRwf(liveEstimate.target)}</span> compared with your last saved estimate.
          </div>
        )}

        <button type="button" onClick={handleSave} className="bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg">
          Save Updated Estimate
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-4">Budget breakdown</h2>
        <ul className="divide-y divide-slate-100">
          {liveEstimate.categories.map((cat) => (
            <li key={cat.key} className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-700">{cat.label}</span>
              <span className="text-sm font-bold text-slate-900">{formatCompactRwf(cat.amount)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-bold bg-[#2ec440]/10 text-[#2ec440] px-3 py-1.5 rounded-full">{ESTIMATE_TYPE_LABELS.ai_indicative} — available</span>
        <span className="text-xs font-bold bg-slate-100 text-slate-400 px-3 py-1.5 rounded-full">{ESTIMATE_TYPE_LABELS.professional_estimate} — not yet requested</span>
        <span className="text-xs font-bold bg-slate-100 text-slate-400 px-3 py-1.5 rounded-full">{ESTIMATE_TYPE_LABELS.contractor_quotation} — not yet requested</span>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          <span className="font-bold text-slate-900">This is an early planning estimate, not a contractor quotation.</span> Final cost depends on site inspection, measurements, specifications, labour, materials and concealed conditions.
        </p>
      </div>
    </div>
  );
}
