"use client";

import {
  BriefStepKey,
  DesignBrief,
  FINISH_LEVEL_LABELS,
  HOME_STYLE_LABELS,
  PROPERTY_USE_LABELS,
} from "@/lib/build/types";
import { BriefWarning } from "@/lib/build/briefValidation";
import { formatCurrency } from "@/lib/build/format";

function SummarySection({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
        <button type="button" onClick={onEdit} className="text-xs font-bold text-[#2ec440] hover:text-[#28b039] transition-colors">
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm py-1">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-semibold text-right">{value || "—"}</span>
    </div>
  );
}

export default function BriefStepReview({
  brief,
  warnings,
  onEditStep,
  onToggleDisclaimer,
}: {
  brief: DesignBrief;
  warnings: BriefWarning[];
  onEditStep: (step: BriefStepKey) => void;
  onToggleDisclaimer: (accepted: boolean) => void;
}) {
  const uploadedFiles = [...brief.plot.files, ...brief.style.inspirationFiles];

  return (
    <div className="space-y-5">
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="font-bold text-amber-800 text-sm mb-2">A few things worth double-checking</p>
          <ul className="space-y-1.5">
            {warnings.map((w) => (
              <li key={w.id} className="text-amber-700 text-sm flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <SummarySection title="Project" onEdit={() => onEditStep("basics")}>
          <Row label="Location" value={[brief.basics.neighbourhood, brief.basics.district, brief.basics.provinceOrCity].filter(Boolean).join(", ")} />
          <Row label="Property use" value={brief.basics.propertyUse ? PROPERTY_USE_LABELS[brief.basics.propertyUse] : ""} />
          <Row label="Occupants" value={brief.basics.occupants} />
          <Row label="Construction start" value={brief.basics.constructionStartPeriod} />
        </SummarySection>

        <SummarySection title="Plot" onEdit={() => onEditStep("plot")}>
          <Row label="Address" value={brief.plot.address} />
          <Row label="Shape" value={brief.plot.shape} />
          <Row label="Area" value={brief.plot.areaSqm ? `${brief.plot.areaSqm} sqm` : ""} />
          <Row label="Slope" value={brief.plot.slope} />
        </SummarySection>

        <SummarySection title="Household & spaces" onEdit={() => onEditStep("household")}>
          <Row label="Floors" value={brief.household.floors} />
          <Row label="Kitchen" value={brief.household.kitchenType.replace("_", " ")} />
          <Row label="Parking" value={brief.household.parkingSpaces} />
          <Row label="Total spaces" value={brief.household.rooms.reduce((sum, r) => sum + r.quantity, 0)} />
        </SummarySection>

        <SummarySection title="Style" onEdit={() => onEditStep("style")}>
          <Row label="Primary style" value={brief.style.primaryStyle ? HOME_STYLE_LABELS[brief.style.primaryStyle] : ""} />
          <Row label="Layout" value={brief.style.layoutPreference.replace("_", " ")} />
          <Row label="Natural light" value={brief.style.naturalLightPriority} />
          <Row label="Inspiration references" value={brief.style.inspirationImageIds.length + brief.style.inspirationFiles.length} />
        </SummarySection>

        <SummarySection title="Budget" onEdit={() => onEditStep("budget")}>
          <Row label="Target" value={brief.budget.targetBudget ? formatCurrency(brief.budget.targetBudget, brief.budget.currency) : ""} />
          <Row label="Range" value={brief.budget.minBudget && brief.budget.maxBudget ? `${formatCurrency(brief.budget.minBudget, brief.budget.currency)} – ${formatCurrency(brief.budget.maxBudget, brief.budget.currency)}` : ""} />
          <Row label="Finish level" value={FINISH_LEVEL_LABELS[brief.budget.finishLevel]} />
          <Row label="Flexibility" value={brief.budget.flexibility.replace(/_/g, " ")} />
        </SummarySection>

        <SummarySection title="Sustainability & accessibility" onEdit={() => onEditStep("sustainability")}>
          <Row label="Required sustainability items" value={brief.sustainability.items.filter((i) => i.priority === "required").length} />
          <Row label="Preferred sustainability items" value={brief.sustainability.items.filter((i) => i.priority === "preferred").length} />
          <Row label="Required accessibility items" value={brief.accessibility.items.filter((i) => i.priority === "required").length} />
          <Row label="Preferred accessibility items" value={brief.accessibility.items.filter((i) => i.priority === "preferred").length} />
        </SummarySection>
      </div>

      <SummarySection title="Uploaded references" onEdit={() => onEditStep("plot")}>
        {uploadedFiles.length === 0 ? (
          <p className="text-sm text-slate-500">No files uploaded yet.</p>
        ) : (
          <ul className="space-y-1">
            {uploadedFiles.map((f) => (
              <li key={f.id} className="text-sm text-slate-700 font-medium">
                {f.name}
              </li>
            ))}
          </ul>
        )}
      </SummarySection>

      <label className="flex items-start gap-3 bg-white border border-slate-200 rounded-2xl p-5 cursor-pointer">
        <input
          type="checkbox"
          checked={brief.disclaimerAccepted}
          onChange={(e) => onToggleDisclaimer(e.target.checked)}
          className="accent-[#2ec440] w-5 h-5 mt-0.5 flex-shrink-0"
        />
        <span className="text-sm text-slate-700 leading-relaxed">
          I understand that HuzaEstate Build produces conceptual design directions and not approved construction drawings.
        </span>
      </label>
    </div>
  );
}
