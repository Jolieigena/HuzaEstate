import { BudgetCategoryAmount, BudgetEstimate, FinishLevel } from "./types";

// Construction cost per square metre in the Kigali area, RWF, building only: no land, design fees, permits or utility connections.
// Basis, 2026 published Kigali construction guides (checked November 2026; USD converted at about 1,455 RWF):
//   - Kigali Inspectify, "Complete 2026 Construction Guide": basic 350,000-500,000, mid-range modern 500,000-850,000, luxury 900,000-1,500,000.
//   - DC Studios (Kigali), updated October 2026: basic USD 300-350, mid-range USD 425-500, premium finish USD 850-1,000+.
// The guides give three bands and Build has four finish levels, so Premium is the stretch between mid-range and the top band.
// These are market guides, not quotations: replace them with quotes from builders as soon as there are some.
export const COST_PER_SQM: Record<FinishLevel, { low: number; high: number }> = {
  essential: { low: 350_000, high: 500_000 },
  standard: { low: 550_000, high: 750_000 },
  premium: { low: 800_000, high: 1_200_000 },
  luxury: { low: 1_200_000, high: 1_500_000 },
};

/** The sources, as they are named on the document. */
export const PRICE_BASIS = "Kigali construction cost guides published in 2026 (Kigali Inspectify, DC Studios). Market guides, not quotations.";

// How the construction cost divides between the parts of a house. Foundation (about 16% with site preparation) and finishing
// (about 46%: windows and doors, plumbing, electrical, interior, kitchen, external works) both sit inside the ranges the
// guides give (foundation 10-20%, finishing 35-50%); the split of the rest is a typical one. The shares add up to 100%.
const CATEGORY_SHARES: { key: string; label: string; pct: number; optionalFlag?: "landscaping" | "professionalFees" | "furniture" }[] = [
  { key: "site_preparation", label: "Site preparation", pct: 0.04 },
  { key: "foundation", label: "Foundation and substructure", pct: 0.12 },
  { key: "structural_frame", label: "Structural frame", pct: 0.15 },
  { key: "walls", label: "Walls", pct: 0.1 },
  { key: "roofing", label: "Roofing", pct: 0.1 },
  { key: "windows_doors", label: "Windows and doors", pct: 0.08 },
  { key: "plumbing", label: "Plumbing", pct: 0.07 },
  { key: "electrical", label: "Electrical", pct: 0.07 },
  { key: "interior_finishes", label: "Interior finishes", pct: 0.14 },
  { key: "kitchen_cabinetry", label: "Kitchen and cabinetry", pct: 0.08 },
  { key: "external_works", label: "External works", pct: 0.05 },
  // Only when the person asks for them: the guides price these apart from the building.
  { key: "landscaping", label: "Landscaping", pct: 0.03, optionalFlag: "landscaping" },
  { key: "professional_fees", label: "Professional fees", pct: 0.06, optionalFlag: "professionalFees" },
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
  const range = COST_PER_SQM[inputs.finishLevel];
  const costPerSqm = Math.round((range.low + range.high) / 2);
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
    low: target * (range.low / costPerSqm),
    target,
    high: target * (range.high / costPerSqm),
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
