import { newId } from "./factory";
import { ContractorQuotation, DemoContractor, QuotationLineItem, ScopeItem } from "./types";

/** Deterministic per-contractor cost/timeline variance so quotations differ meaningfully without randomness across renders. */
function contractorSeed(contractorId: string): number {
  let hash = 0;
  for (let i = 0; i < contractorId.length; i++) hash = (hash * 31 + contractorId.charCodeAt(i)) % 1000;
  return hash / 1000; // 0..1
}

function daysFromNowIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export interface GenerateQuotationsInput {
  targetBudget: number;
  scope: ScopeItem[];
  proposedDurationWeeks: number;
  contractors: DemoContractor[];
}

export const RenovationQuotationService = {
  generateQuotations(input: GenerateQuotationsInput): ContractorQuotation[] {
    const includedTasks = input.scope.filter((s) => s.status !== "excluded").map((s) => s.task);
    const excludedTasks = input.scope.filter((s) => s.status === "excluded").map((s) => s.task);

    return input.contractors.map((contractor) => {
      const seed = contractorSeed(contractor.id);
      const variance = 0.85 + seed * 0.4; // 0.85x - 1.25x
      const total = Math.round(input.targetBudget * variance);
      const labour = Math.round(total * 0.38);
      const professionalFees = Math.round(total * 0.08);
      const taxes = Math.round(total * 0.05);
      const contingency = Math.round(total * 0.07);
      const materialsTotal = total - labour - professionalFees - taxes - contingency;

      const materials: QuotationLineItem[] = [
        { label: "Finishes and fixtures", amount: Math.round(materialsTotal * 0.55) },
        { label: "Cabinetry and joinery", amount: Math.round(materialsTotal * 0.25) },
        { label: "Other materials", amount: materialsTotal - Math.round(materialsTotal * 0.55) - Math.round(materialsTotal * 0.25) },
      ];

      // A couple of contractors deliberately exclude a scope item, matching the
      // "warn where a quotation excludes significant work" requirement.
      const contractorExcludes = seed > 0.6 && excludedTasks.length === 0 && includedTasks.length > 1 ? [includedTasks[includedTasks.length - 1]] : excludedTasks;
      const contractorIncludes = includedTasks.filter((t) => !contractorExcludes.includes(t));

      return {
        id: newId("quote"),
        contractor,
        status: "submitted",
        quotationDate: new Date().toISOString(),
        validUntil: daysFromNowIso(30),
        includedScope: contractorIncludes,
        excludedScope: contractorExcludes,
        materials,
        labour,
        professionalFees,
        taxes,
        contingency,
        total,
        proposedDurationWeeks: Math.max(1, Math.round(input.proposedDurationWeeks * (0.9 + seed * 0.3))),
        paymentSchedule: "30% deposit, 40% at midpoint inspection, 30% on handover.",
        warrantyInfo: "12-month workmanship warranty; manufacturer warranties apply to fixtures and appliances.",
        assumptions: [
          "Assumes site access during standard working hours unless otherwise agreed.",
          "Assumes existing utility connections are in working order.",
          "Excludes costs arising from concealed conditions discovered during works.",
        ],
        attachmentDocumentIds: [],
      };
    });
  },

  /** Comparison helper — never designates a single "best" quotation, only per-dimension highlights. */
  compareQuotations(quotations: ContractorQuotation[]) {
    if (quotations.length === 0) return null;
    const lowestCost = quotations.reduce((a, b) => (b.total < a.total ? b : a));
    const shortestDuration = quotations.reduce((a, b) => (b.proposedDurationWeeks < a.proposedDurationWeeks ? b : a));
    const highestRated = quotations.reduce((a, b) => (b.contractor.rating > a.contractor.rating ? b : a));
    const mostComplete = quotations.reduce((a, b) => (b.excludedScope.length < a.excludedScope.length ? b : a));
    return { lowestCostId: lowestCost.id, shortestDurationId: shortestDuration.id, highestRatedId: highestRated.id, mostCompleteId: mostComplete.id };
  },
};
