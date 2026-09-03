import { BudgetCategoryAmount, BudgetEstimate, FinishLevel } from "./types";

// Indicative cost-per-square-metre assumptions for the Kigali area, RWF.
// These are prototype planning figures only — see the disclaimer shown on
// the Budget page. A real implementation would source this from a pricing
// service and location-specific data.
const BASE_COST_PER_SQM: Record<FinishLevel, number> = {
  essential: 350_000,
  standard: 500_000,
  premium: 750_000,
  luxury: 1_100_000,
};

// Percentage of the base construction cost each category represents.
// Landscaping, professional fees and furniture are added only when included.
const CATEGORY_SHARES: { key: string; label: string; pct: number; optionalFlag?: "landscaping" | "professionalFees" | "furniture" }[] = [
  { key: "site_preparation", label: "Site preparation", pct: 0.04 },
  { key: "foundation", label: "Foundation and substructure", pct: 0.12 },
  { key: "structural_frame", label: "Structural frame", pct: 0.14 },
  { key: "walls", label: "Walls", pct: 0.1 },
  { key: "roofing", label: "Roofing", pct: 0.1 },
  { key: "windows_doors", label: "Windows and doors", pct: 0.08 },
  { key: "plumbing", label: "Plumbing", pct: 0.07 },
  { key: "electrical", label: "Electrical", pct: 0.07 },
  { key: "interior_finishes", label: "Interior finishes", pct: 0.13 },
  { key: "kitchen_cabinetry", label: "Kitchen and cabinetry", pct: 0.06 },
  { key: "external_works", label: "External works", pct: 0.05 },
  { key: "landscaping", label: "Landscaping", pct: 0.03, optionalFlag: "landscaping" },
  { key: "professional_fees", label: "Professional fees", pct: 0.06, optionalFlag: "professionalFees" },
  { key: "permit_allowances", label: "Permit-related allowances", pct: 0.02 },
  { key: "furniture", label: "Furniture allowance", pct: 0.05, optionalFlag: "furniture" },
];

export interface BudgetInputs {
  totalAreaSqm: number;
  finishLevel: FinishLevel;
  contingencyPct: number;
  includeLandscaping: boolean;
  includeFurniture: boolean;
  includeProfessionalFees: boolean;
  locationAssumption?: string;
}

export function calculateBudget(inputs: BudgetInputs): BudgetEstimate {
  const area = Math.max(inputs.totalAreaSqm, 0);
  const costPerSqm = BASE_COST_PER_SQM[inputs.finishLevel];
  const baseTotal = area * costPerSqm;

  const categories: BudgetCategoryAmount[] = [];
  let runningTotal = 0;

  for (const cat of CATEGORY_SHARES) {
    if (cat.optionalFlag === "landscaping" && !inputs.includeLandscaping) continue;
    if (cat.optionalFlag === "professionalFees" && !inputs.includeProfessionalFees) continue;
    if (cat.optionalFlag === "furniture" && !inputs.includeFurniture) continue;
    const amount = baseTotal * cat.pct;
    categories.push({ key: cat.key, label: cat.label, amount });
    runningTotal += amount;
  }

  const contingencyAmount = runningTotal * (inputs.contingencyPct / 100);
  categories.push({ key: "contingency", label: "Contingency", amount: contingencyAmount });
  const target = runningTotal + contingencyAmount;

  return {
    low: target * 0.88,
    target,
    high: target * 1.18,
    costPerSqm,
    totalAreaSqm: area,
    finishLevel: inputs.finishLevel,
    locationAssumption: inputs.locationAssumption ?? "Kigali metropolitan area",
    contingencyPct: inputs.contingencyPct,
    includeLandscaping: inputs.includeLandscaping,
    includeFurniture: inputs.includeFurniture,
    includeProfessionalFees: inputs.includeProfessionalFees,
    categories,
    lastCalculated: new Date().toISOString(),
    estimateType: "ai_indicative",
  };
}
