import { BudgetCategoryAmount, BudgetCategoryKey, FinishLevel, RenovationAreaKey, RenovationBudgetEstimate } from "./types";

// Indicative renovation cost-per-square-metre assumptions for the Kigali
// area, RWF, applied only to the areas actually being renovated (not the
// whole property). These are prototype planning figures only — see the
// disclaimer shown on the Budget page.
const BASE_COST_PER_SQM: Record<FinishLevel, number> = {
  essential: 150_000,
  standard: 250_000,
  premium: 420_000,
  luxury: 650_000,
};

const CATEGORY_SHARES: { key: BudgetCategoryKey; pct: number; optionalFlag?: "furniture" | "landscaping" | "temporaryAccommodation" | "professionalFees" }[] = [
  { key: "design_professional_fees", pct: 0.07, optionalFlag: "professionalFees" },
  { key: "assessment_inspection", pct: 0.02 },
  { key: "demolition", pct: 0.06 },
  { key: "waste_removal", pct: 0.02 },
  { key: "structural", pct: 0.08 },
  { key: "roofing", pct: 0.05 },
  { key: "electrical", pct: 0.08 },
  { key: "plumbing", pct: 0.08 },
  { key: "walls_ceiling", pct: 0.1 },
  { key: "flooring", pct: 0.09 },
  { key: "kitchen", pct: 0.08 },
  { key: "bathrooms", pct: 0.07 },
  { key: "windows_doors", pct: 0.05 },
  { key: "fixtures", pct: 0.04 },
  { key: "lighting", pct: 0.03 },
  { key: "furniture", pct: 0.05, optionalFlag: "furniture" },
  { key: "exterior_work", pct: 0.04 },
  { key: "landscaping", pct: 0.03, optionalFlag: "landscaping" },
  { key: "temporary_accommodation", pct: 0.03, optionalFlag: "temporaryAccommodation" },
];

export interface RenovationBudgetInputs {
  totalAreaSqm: number;
  finishLevel: FinishLevel;
  contingencyPct: number;
  includeFurniture: boolean;
  includeAppliances: boolean;
  includeLandscaping: boolean;
  includeTemporaryAccommodation: boolean;
  includeProfessionalFees: boolean;
  includedAreaKeys?: RenovationAreaKey[];
}

export function calculateRenovationBudget(inputs: RenovationBudgetInputs): RenovationBudgetEstimate {
  const area = Math.max(inputs.totalAreaSqm, 0);
  const costPerSqm = BASE_COST_PER_SQM[inputs.finishLevel];
  const baseTotal = area * costPerSqm;

  const categories: BudgetCategoryAmount[] = [];
  let runningTotal = 0;
  let materialsTotal = 0;
  let labourTotal = 0;
  let feesTotal = 0;

  for (const cat of CATEGORY_SHARES) {
    if (cat.optionalFlag === "furniture" && !inputs.includeFurniture) continue;
    if (cat.optionalFlag === "landscaping" && !inputs.includeLandscaping) continue;
    if (cat.optionalFlag === "temporaryAccommodation" && !inputs.includeTemporaryAccommodation) continue;
    if (cat.optionalFlag === "professionalFees" && !inputs.includeProfessionalFees) continue;
    let amount = baseTotal * cat.pct;
    if (cat.key === "kitchen" && inputs.includeAppliances) amount *= 1.35;
    categories.push({ key: cat.key, label: BUDGET_LABEL(cat.key), amount });
    runningTotal += amount;
    if (cat.key === "design_professional_fees" || cat.key === "assessment_inspection") feesTotal += amount;
    else if (cat.key === "furniture") labourTotal += amount * 0; // furniture is materials, handled below
    else labourTotal += amount * 0.42;
    materialsTotal += amount * (cat.key === "furniture" ? 1 : 0.58);
  }

  const contingencyAmount = runningTotal * (inputs.contingencyPct / 100);
  categories.push({ key: "contingency", label: "Contingency", amount: contingencyAmount });
  const target = runningTotal + contingencyAmount;

  return {
    low: Math.round(target * 0.85),
    target: Math.round(target),
    high: Math.round(target * 1.2),
    currency: "RWF",
    finishLevel: inputs.finishLevel,
    contingencyPct: inputs.contingencyPct,
    includeFurniture: inputs.includeFurniture,
    includeAppliances: inputs.includeAppliances,
    includeLandscaping: inputs.includeLandscaping,
    includeTemporaryAccommodation: inputs.includeTemporaryAccommodation,
    includeProfessionalFees: inputs.includeProfessionalFees,
    categories,
    materialsEstimate: Math.round(materialsTotal),
    labourEstimate: Math.round(labourTotal),
    professionalFeesEstimate: Math.round(feesTotal),
    contingencyAmount: Math.round(contingencyAmount),
    estimateType: "ai_indicative",
    lastCalculated: new Date().toISOString(),
  };
}

function BUDGET_LABEL(key: BudgetCategoryKey): string {
  // Kept local to avoid a circular import with types.ts's label map at module-eval time.
  const labels: Record<BudgetCategoryKey, string> = {
    design_professional_fees: "Design and professional fees",
    assessment_inspection: "Assessment and inspection",
    demolition: "Demolition",
    waste_removal: "Waste removal",
    structural: "Structural work",
    roofing: "Roofing",
    electrical: "Electrical",
    plumbing: "Plumbing",
    walls_ceiling: "Walls and ceiling",
    flooring: "Flooring",
    kitchen: "Kitchen",
    bathrooms: "Bathrooms",
    windows_doors: "Windows and doors",
    fixtures: "Fixtures",
    lighting: "Lighting",
    furniture: "Furniture",
    exterior_work: "Exterior work",
    landscaping: "Landscaping",
    temporary_accommodation: "Temporary accommodation",
    contingency: "Contingency",
  };
  return labels[key];
}
