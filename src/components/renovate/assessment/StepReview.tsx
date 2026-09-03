"use client";

import {
  AssessmentStepKey,
  PROPERTY_TYPE_LABELS,
  RENOVATION_AREA_LABELS,
  RenovationAssessment,
  RenovationPropertyInfo,
  RENOVATION_STYLE_LABELS,
  SAFETY_CONCERN_LABELS,
  SafetyConcernKey,
} from "@/lib/renovate/types";
import { AssessmentWarning } from "@/lib/renovate/assessmentValidation";
import { formatCurrency } from "@/lib/renovate/format";
import { ProjectUploads } from "@/lib/renovate/types";

interface Props {
  property: RenovationPropertyInfo;
  assessment: RenovationAssessment;
  uploads: ProjectUploads;
  warnings: AssessmentWarning[];
  onEditStep: (step: AssessmentStepKey) => void;
  onToggleDisclaimer: (accepted: boolean) => void;
}

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <button type="button" onClick={onEdit} className="text-xs font-bold text-[#2ec440] hover:text-[#28b039]">
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

export default function StepReview({ property, assessment, uploads, warnings, onEditStep, onToggleDisclaimer }: Props) {
  const safetyFlags = (Object.entries(assessment.safety.concerns) as [SafetyConcernKey, string][]).filter(([, v]) => v === "yes" || v === "unknown");
  const missing: string[] = [];
  if (!assessment.style.primaryStyle) missing.push("Primary style");
  if (!assessment.budgetTimeline.targetBudget) missing.push("Target budget");
  if (assessment.areas.length === 0) missing.push("Renovation areas");
  const totalUploads = uploads.photos.length + uploads.videos.length + uploads.floorPlans.length + uploads.inspiration.length;

  return (
    <div className="space-y-5">
      <Section title="Property" onEdit={() => onEditStep("property")}>
        <p className="text-sm text-slate-600">
          {property.name} · {property.propertyType ? PROPERTY_TYPE_LABELS[property.propertyType] : "Type not set"} · {property.location || "Location not set"}
        </p>
      </Section>

      <Section title="Renovation areas" onEdit={() => onEditStep("areas")}>
        {assessment.areas.length === 0 ? (
          <p className="text-sm text-slate-400">No areas selected.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assessment.areas.map((a) => (
              <span key={a.id} className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                {a.customLabel || RENOVATION_AREA_LABELS[a.areaKey]}
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Existing condition" onEdit={() => onEditStep("condition")}>
        <p className="text-sm text-slate-600">
          {assessment.conditions.length} of {assessment.areas.length} area{assessment.areas.length === 1 ? "" : "s"} assessed · {totalUploads} file{totalUploads === 1 ? "" : "s"} uploaded
        </p>
      </Section>

      <Section title="Keep, remove and change" onEdit={() => onEditStep("keep_remove_change")}>
        <p className="text-sm text-slate-600">
          {assessment.keepRemoveChange.filter((i) => i.listType === "keep").length} to keep · {assessment.keepRemoveChange.filter((i) => i.listType === "remove").length} to remove ·{" "}
          {assessment.keepRemoveChange.filter((i) => i.listType === "change").length} to change
        </p>
      </Section>

      <Section title="Style" onEdit={() => onEditStep("style")}>
        <p className="text-sm text-slate-600">{assessment.style.primaryStyle ? RENOVATION_STYLE_LABELS[assessment.style.primaryStyle] : "No style selected yet."}</p>
      </Section>

      <Section title="Budget and timeline" onEdit={() => onEditStep("budget_timeline")}>
        <p className="text-sm text-slate-600">
          {assessment.budgetTimeline.targetBudget ? formatCurrency(assessment.budgetTimeline.targetBudget) : "No target budget set"}
          {assessment.budgetTimeline.requiredCompletionDate ? ` · Completion by ${assessment.budgetTimeline.requiredCompletionDate}` : ""}
        </p>
      </Section>

      <Section title="Safety and constraints" onEdit={() => onEditStep("safety")}>
        {safetyFlags.length === 0 ? (
          <p className="text-sm text-slate-600">No safety concerns flagged.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {safetyFlags.map(([key]) => (
              <span key={key} className="bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                {SAFETY_CONCERN_LABELS[key]}
              </span>
            ))}
          </div>
        )}
      </Section>

      {missing.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Missing information</p>
          <p className="text-sm text-slate-600">{missing.join(", ")}</p>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5">
          {warnings.map((w) => (
            <p key={w.id} className="text-amber-800 text-sm leading-relaxed">
              {w.message}
            </p>
          ))}
        </div>
      )}

      {safetyFlags.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
          <p className="text-purple-800 text-sm font-semibold">Professional inspection required before execution for the flagged items above.</p>
        </div>
      )}

      <label className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-5 cursor-pointer">
        <input
          type="checkbox"
          checked={assessment.disclaimerAccepted}
          onChange={(e) => onToggleDisclaimer(e.target.checked)}
          className="w-5 h-5 mt-0.5 rounded accent-[#2ec440] flex-shrink-0"
        />
        <span className="text-sm text-slate-700 leading-relaxed">
          I understand that AI renovation outputs are conceptual. Structural, electrical, plumbing, safety and permit-related work must be reviewed by qualified professionals.
        </span>
      </label>
    </div>
  );
}
