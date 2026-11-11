"use client";

import {
  AssessmentStepKey,
  RENOVATION_AREA_LABELS,
  RenovationAssessment,
  RenovationPropertyInfo,
  RENOVATION_STYLE_LABELS,
  SAFETY_CONCERN_LABELS,
  SafetyConcernKey,
  ProjectUploads,
} from "@/lib/renovate/types";
import { AssessmentWarning } from "@/lib/renovate/assessmentValidation";
import { formatTyped } from "@/lib/currency/studioMoney";

interface Props {
  property: RenovationPropertyInfo;
  assessment: RenovationAssessment;
  uploads: ProjectUploads;
  warnings: AssessmentWarning[];
  onEditStep: (step: AssessmentStepKey) => void;
}

function Row({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 px-5 py-3.5">
      <h3 className="w-24 shrink-0 text-sm font-semibold text-slate-900">{title}</h3>
      <div className="min-w-0 flex-1 text-sm text-slate-600">{children}</div>
      <button type="button" onClick={onEdit} className="text-xs font-bold text-[#2ec440] hover:text-[#28b039]">
        Edit
      </button>
    </div>
  );
}

export default function StepReview({ assessment, warnings, onEditStep }: Props) {
  const safetyFlags = (Object.entries(assessment.safety.concerns) as [SafetyConcernKey, string][]).filter(([, v]) => v === "yes" || v === "unknown");
  const budget = assessment.budgetTimeline.targetBudget;

  return (
    <div className="space-y-4">
      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
        <Row title="Rooms" onEdit={() => onEditStep("areas")}>
          {assessment.areas.length === 0 ? (
            <span className="text-slate-400">No rooms selected.</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assessment.areas.map((a) => (
                <span key={a.id} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {a.customLabel || RENOVATION_AREA_LABELS[a.areaKey]}
                </span>
              ))}
            </div>
          )}
        </Row>
        <Row title="Style" onEdit={() => onEditStep("areas")}>
          {assessment.style.primaryStyle ? RENOVATION_STYLE_LABELS[assessment.style.primaryStyle] : "No style preference."}
        </Row>
        {budget ? (
          <Row title="Budget" onEdit={() => onEditStep("areas")}>
            {formatTyped(budget, assessment.budgetTimeline.currency)}
          </Row>
        ) : null}
        {safetyFlags.length > 0 && (
          <Row title="Safety" onEdit={() => onEditStep("safety")}>
            <div className="flex flex-wrap gap-2">
              {safetyFlags.map(([key]) => (
                <span key={key} className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  {SAFETY_CONCERN_LABELS[key]}
                </span>
              ))}
            </div>
          </Row>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="space-y-1.5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          {warnings.map((w) => (
            <p key={w.id} className="text-sm leading-relaxed text-amber-800">
              {w.message}
            </p>
          ))}
        </div>
      )}

      {safetyFlags.length > 0 && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
          <p className="text-sm font-semibold text-purple-800">Professional inspection required before execution for the flagged items above.</p>
        </div>
      )}

    </div>
  );
}
