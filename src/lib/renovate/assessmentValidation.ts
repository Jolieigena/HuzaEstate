import { AssessmentStepKey, HIGH_RISK_AREA_KEYS, RenovationAssessment, RenovationPropertyInfo } from "./types";

export type StepErrors = Record<string, string>;

export function validateStep(step: AssessmentStepKey, assessment: RenovationAssessment, property: RenovationPropertyInfo): StepErrors {
  const errors: StepErrors = {};

  if (step === "property") {
    if (!property.propertyType) errors.propertyType = "Select a property type.";
    if (!property.location.trim()) errors.location = "Location is required.";
  }

  if (step === "areas") {
    if (assessment.areas.length === 0) errors.areas = "Select at least one renovation area.";
  }

  if (step === "keep_remove_change") {
    // No hard requirement — an empty list is valid, just less useful.
  }

  if (step === "style") {
    if (!assessment.style.primaryStyle) errors.primaryStyle = "Choose one primary style direction.";
  }

  if (step === "budget_timeline") {
    const { minBudget, targetBudget, maxBudget } = assessment.budgetTimeline;
    if (minBudget !== null && minBudget < 0) errors.minBudget = "Budget cannot be negative.";
    if (targetBudget !== null && targetBudget < 0) errors.targetBudget = "Budget cannot be negative.";
    if (maxBudget !== null && maxBudget < 0) errors.maxBudget = "Budget cannot be negative.";
    if (minBudget !== null && targetBudget !== null && minBudget > targetBudget) errors.minBudget = "Minimum budget should not be greater than your target budget.";
    if (targetBudget !== null && maxBudget !== null && targetBudget > maxBudget) errors.targetBudget = "Target budget should not be greater than your maximum budget.";
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

  const { targetBudget } = assessment.budgetTimeline;
  const essentialAreaCount = assessment.areas.filter((a) => a.priority === "essential" || a.priority === "high").length;
  if (targetBudget && essentialAreaCount > 0) {
    const perAreaBudget = targetBudget / essentialAreaCount;
    if (perAreaBudget < 2_000_000) {
      warnings.push({ id: "budget-low-for-scope", message: "Your target budget looks low for the number of high-priority areas selected — consider narrowing the scope or increasing the budget." });
    }
  }

  if (assessment.budgetTimeline.desiredStartDate && assessment.budgetTimeline.requiredCompletionDate) {
    const start = new Date(assessment.budgetTimeline.desiredStartDate);
    const end = new Date(assessment.budgetTimeline.requiredCompletionDate);
    const weeks = (end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000);
    if (Number.isFinite(weeks) && weeks > 0 && weeks < 3 && essentialAreaCount > 0) {
      warnings.push({ id: "timeline-short", message: "Your desired timeline looks short for the selected scope — renovation work often needs more lead time, especially for wet areas." });
    }
  }

  const highRiskCount = assessment.areas.filter((a) => HIGH_RISK_AREA_KEYS.includes(a.areaKey)).length;
  if (highRiskCount > 1) {
    warnings.push({ id: "multiple-high-risk-areas", message: "Multiple high-risk areas were selected (extension, additional floor, roofing or full property) — a professional inspection is strongly recommended before execution." });
  }

  if (assessment.occupiedDuringRenovation && essentialAreaCount > 1) {
    warnings.push({ id: "occupied-during-major-work", message: "The property will remain occupied during renovation — plan for temporary disruption to plumbing, electrical or access in the affected areas." });
  }

  return warnings;
}
