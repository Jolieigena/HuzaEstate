import { RenovationAreaKey, RenovationConcept, RENOVATION_AREA_LABELS } from "./types";

export interface RefinementAnalysis {
  elementsAffected: string[];
  costImpact: "increase" | "decrease" | "neutral";
  scopeImpact: "increase" | "decrease" | "neutral";
  conceptPatch: Partial<RenovationConcept>;
  changeSummary: string;
}

/**
 * Lightweight, deterministic heuristic standing in for a real AI refinement
 * engine — used for both full "Refine with Huza AI" requests and targeted
 * single-area edits. Never claims to detect or resolve structural, electrical
 * or moisture conditions; it only estimates a rough cost/scope direction.
 */
export function analyzeRefinement(request: string, concept: RenovationConcept): RefinementAnalysis {
  const text = request.toLowerCase();
  const elementsAffected: string[] = [];
  let costImpact: RefinementAnalysis["costImpact"] = "neutral";
  let scopeImpact: RefinementAnalysis["scopeImpact"] = "neutral";
  let costDelta = 0;

  if (/floor/.test(text)) elementsAffected.push("Flooring");
  if (/cabinet/.test(text)) elementsAffected.push("Cabinetry");
  if (/light/.test(text)) elementsAffected.push("Lighting");
  if (/wall|colour|color|paint/.test(text)) elementsAffected.push("Wall finish");
  if (/storage/.test(text)) elementsAffected.push("Storage");
  if (/roof/.test(text)) elementsAffected.push("Roofing");
  if (/furniture/.test(text)) elementsAffected.push("Furniture");
  if (/layout/.test(text)) elementsAffected.push("Layout");
  if (elementsAffected.length === 0) elementsAffected.push("Selected area");

  if (/lower[- ]cost|cheaper|reduce.*cost|budget/.test(text)) {
    costImpact = "decrease";
    costDelta = -0.1;
  }
  if (/premium|upgrade|luxury|higher[- ]quality/.test(text)) {
    costImpact = "increase";
    costDelta = 0.12;
  }
  if (/add|more|extra/.test(text)) scopeImpact = "increase";
  if (/remove|less|simplify/.test(text)) scopeImpact = "decrease";

  const conceptPatch: Partial<RenovationConcept> = {};
  if (costDelta !== 0) {
    conceptPatch.estimatedCostLowRwf = Math.round(concept.estimatedCostLowRwf * (1 + costDelta));
    conceptPatch.estimatedCostHighRwf = Math.round(concept.estimatedCostHighRwf * (1 + costDelta));
  }

  return {
    elementsAffected,
    costImpact,
    scopeImpact,
    conceptPatch,
    changeSummary: `Refinement requested: "${request}"`,
  };
}

export interface TargetedEditPreview {
  possibleCostEffect: string;
  possibleScopeEffect: string;
}

export function analyzeTargetedEdit(request: string, areaKey: RenovationAreaKey, concept: RenovationConcept): TargetedEditPreview {
  const analysis = analyzeRefinement(request, concept);
  const areaLabel = RENOVATION_AREA_LABELS[areaKey];
  const costText =
    analysis.costImpact === "increase"
      ? `May increase the estimated cost for ${areaLabel.toLowerCase()} slightly.`
      : analysis.costImpact === "decrease"
      ? `May reduce the estimated cost for ${areaLabel.toLowerCase()} slightly.`
      : `Unlikely to materially change the overall estimated cost.`;
  const scopeText =
    analysis.scopeImpact === "increase"
      ? "This may add a small amount of scope to the affected area."
      : analysis.scopeImpact === "decrease"
      ? "This may simplify the scope in the affected area."
      : "This change is expected to stay within the existing scope for this area.";
  return { possibleCostEffect: costText, possibleScopeEffect: scopeText };
}
