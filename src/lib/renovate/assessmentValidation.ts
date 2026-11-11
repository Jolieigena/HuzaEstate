import { AssessmentStepKey, HIGH_RISK_AREA_KEYS, RenovationAssessment, RenovationPropertyInfo } from "./types";

export type StepErrors = Record<string, string>;

export function validateStep(step: AssessmentStepKey, assessment: RenovationAssessment, property: RenovationPropertyInfo): StepErrors {
  const errors: StepErrors = {};

  if (step === "areas") {
    if (assessment.areas.length === 0) errors.areas = "Select at least one renovation area.";
  }

  if (step === "keep_remove_change") {
    // No hard requirement — an empty list is valid, just less useful.
  }

  if (step === "review") {
    if (!assessment.disclaimerAccepted) errors.disclaimer = "Please confirm you understand the disclaimer before continuing.";
  }

  return errors;
}

export function stepIsValid(step: AssessmentStepKey, assessment: RenovationAssessment, property: RenovationPropertyInfo): boolean {
  return Object.keys(validateStep(step, assessment, property)).length === 0;
}

export interface AssessmentWarning {
  id: string;
  message: string;
}

/** Non-blocking warnings shown on the review step — a draft can always still be saved. */
export function collectAssessmentWarnings(assessment: RenovationAssessment): AssessmentWarning[] {
  const warnings: AssessmentWarning[] = [];

  const essentialAreaCount = assessment.areas.filter((a) => a.priority === "essential" || a.priority === "high").length;

  const highRiskCount = assessment.areas.filter((a) => HIGH_RISK_AREA_KEYS.includes(a.areaKey)).length;
  if (highRiskCount > 1) {
    warnings.push({ id: "multiple-high-risk-areas", message: "Multiple high-risk areas were selected (extension, additional floor, roofing or full property) — a professional inspection is strongly recommended before execution." });
  }

  if (assessment.occupiedDuringRenovation && essentialAreaCount > 1) {
    warnings.push({ id: "occupied-during-major-work", message: "The property will remain occupied during renovation — plan for temporary disruption to plumbing, electrical or access in the affected areas." });
  }

  return warnings;
}
