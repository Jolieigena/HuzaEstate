import { BriefStepKey, DesignBrief } from "./types";

export type StepErrors = Record<string, string>;

export function validateStep(step: BriefStepKey, brief: DesignBrief): StepErrors {
  const errors: StepErrors = {};

  if (step === "basics") {
    if (!brief.basics.countryValue.trim()) errors.countryValue = "Country is required.";
    if (!brief.basics.provinceOrCity.trim()) errors.provinceOrCity = "Province or city is required.";
    if (!brief.basics.propertyUse) errors.propertyUse = "Select the intended use for this property.";
    if (brief.basics.occupants !== null && (brief.basics.occupants < 1 || brief.basics.occupants > 50)) {
      errors.occupants = "Enter a realistic number of occupants (1-50).";
    }
  }

  if (step === "plot") {
    if (brief.plot.widthM !== null && brief.plot.widthM <= 0) errors.widthM = "Width must be greater than zero.";
    if (brief.plot.lengthM !== null && brief.plot.lengthM <= 0) errors.lengthM = "Length must be greater than zero.";
    if (brief.plot.areaSqm !== null && brief.plot.areaSqm <= 0) errors.areaSqm = "Area must be greater than zero.";
  }

  if (step === "household") {
    if (brief.household.floors < 1 || brief.household.floors > 6) errors.floors = "Enter a realistic number of floors (1-6).";
    const bedrooms = brief.household.rooms.find((r) => r.key === "bedrooms");
    if (!bedrooms || bedrooms.quantity < 1) errors.bedrooms = "At least one bedroom is required.";
  }

  if (step === "style") {
    if (!brief.style.primaryStyle) errors.primaryStyle = "Choose one primary style direction.";
  }

  if (step === "budget") {
    const { minBudget, targetBudget, maxBudget } = brief.budget;
    if (minBudget !== null && minBudget < 0) errors.minBudget = "Budget cannot be negative.";
    if (targetBudget !== null && targetBudget < 0) errors.targetBudget = "Budget cannot be negative.";
    if (maxBudget !== null && maxBudget < 0) errors.maxBudget = "Budget cannot be negative.";
    if (minBudget !== null && targetBudget !== null && minBudget > targetBudget) {
      errors.minBudget = "Minimum budget should not be greater than your target budget.";
    }
    if (targetBudget !== null && maxBudget !== null && targetBudget > maxBudget) {
      errors.targetBudget = "Target budget should not be greater than your maximum budget.";
    }
  }

  return errors;
}

export function stepIsValid(step: BriefStepKey, brief: DesignBrief): boolean {
  return Object.keys(validateStep(step, brief)).length === 0;
}

export interface BriefWarning {
  id: string;
  message: string;
}

export function collectBriefWarnings(brief: DesignBrief): BriefWarning[] {
  const warnings: BriefWarning[] = [];

  if (!brief.plot.areaSqm) warnings.push({ id: "missing-plot-area", message: "Plot area hasn't been provided yet, so floor area suggestions will be less accurate." });
  if (!brief.plot.coordinates && !brief.plot.address) warnings.push({ id: "missing-plot-location", message: "No plot location has been set on the map or as an address." });

  const bedrooms = brief.household.rooms.find((r) => r.key === "bedrooms")?.quantity ?? 0;
  const estimatedFootprint = bedrooms * 22 + 40; // rough per-bedroom + common-space allowance
  if (brief.plot.areaSqm && estimatedFootprint * brief.household.floors > brief.plot.areaSqm * 0.6) {
    warnings.push({ id: "area-exceeds-plot", message: "Your requested rooms may require more floor area than comfortably fits this plot at the requested number of floors." });
  }

  if (brief.household.floors > 1) {
    warnings.push({ id: "structural-review", message: "Homes with more than one floor will need a professional structural review before construction." });
  }

  const { minBudget, targetBudget, finishLevel } = brief.budget;
  if (targetBudget && brief.plot.areaSqm) {
    const perSqm = targetBudget / Math.max(brief.plot.areaSqm * 0.55, 1);
    if (finishLevel === "luxury" && perSqm < 600_000) {
      warnings.push({ id: "budget-low-for-finish", message: "Your budget may be tight for a luxury finish level at this size — consider Premium or a larger budget." });
    }
  }
  if (minBudget && targetBudget && minBudget === targetBudget) {
    warnings.push({ id: "budget-inflexible", message: "Your minimum and target budgets are the same, which leaves little room for adjustment during refinement." });
  }

  const requiredAccessibility = brief.accessibility.items.filter((i) => i.priority === "required");
  const requiredSustainability = brief.sustainability.items.filter((i) => i.priority === "required");
  if (requiredAccessibility.length > 3 && brief.household.floors > 1) {
    warnings.push({ id: "accessibility-multi-floor", message: "Several accessibility requirements are marked required on a multi-floor home — consider a ground-floor bedroom and lift allowance." });
  }
  if (requiredSustainability.length && !brief.budget.targetBudget) {
    warnings.push({ id: "sustainability-budget", message: "Sustainability requirements are marked required, but no budget has been set to plan for them." });
  }

  return warnings;
}
