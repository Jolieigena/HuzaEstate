import { Concept, ConceptMetrics } from "./types";

export interface RefinementAnalysis {
  elementsAffected: string[];
  costImpact: "increase" | "decrease" | "neutral";
  areaImpact: "increase" | "decrease" | "neutral";
  metricsPatch: Partial<ConceptMetrics>;
  changeSummary: string;
}

/**
 * Lightweight, deterministic heuristic that stands in for a real AI
 * refinement engine. It looks for a handful of common request patterns and
 * estimates their rough cost/area impact so the confirmation step has
 * something meaningful to show before a new version is created.
 */
export function analyzeRefinement(request: string, concept: Concept): RefinementAnalysis {
  const text = request.toLowerCase();
  const elementsAffected: string[] = [];
  let costImpact: RefinementAnalysis["costImpact"] = "neutral";
  let areaImpact: RefinementAnalysis["areaImpact"] = "neutral";
  let areaDelta = 0;
  let costDelta = 0;

  if (/kitchen/.test(text)) elementsAffected.push("Kitchen");
  if (/bedroom/.test(text)) elementsAffected.push("Bedrooms");
  if (/office/.test(text)) elementsAffected.push("Home office");
  if (/roof/.test(text)) elementsAffected.push("Roof and exterior style");
  if (/ventilat|natural light|daylight/.test(text)) elementsAffected.push("Window and opening placement");
  if (/expand|future/.test(text)) elementsAffected.push("Structural grid and future extension zone");
  if (/exterior|facade|style/.test(text)) elementsAffected.push("Exterior finish and style");
  if (/move|relocat/.test(text)) elementsAffected.push("Room placement");
  if (elementsAffected.length === 0) elementsAffected.push("Overall layout");

  if (/larger|bigger|increase|more space|expand/.test(text)) {
    areaImpact = "increase";
    costImpact = "increase";
    areaDelta = 0.08;
    costDelta = 0.1;
  }
  if (/smaller|reduce|shrink|compact/.test(text)) {
    areaImpact = "decrease";
    costImpact = "decrease";
    areaDelta = -0.06;
    costDelta = -0.08;
  }
  if (/reduce.*cost|lower.*cost|cheaper|less expensive/.test(text)) {
    costImpact = "decrease";
    costDelta = Math.min(costDelta, -0.1);
  }
  if (/premium|luxury|upgrade/.test(text)) {
    costImpact = "increase";
    costDelta = Math.max(costDelta, 0.12);
  }

  const metricsPatch: Partial<ConceptMetrics> = {};
  if (areaDelta !== 0) metricsPatch.floorAreaSqm = Math.round(concept.metrics.floorAreaSqm * (1 + areaDelta));
  if (costDelta !== 0) {
    metricsPatch.budgetLowRwf = Math.round(concept.metrics.budgetLowRwf * (1 + costDelta));
    metricsPatch.budgetHighRwf = Math.round(concept.metrics.budgetHighRwf * (1 + costDelta));
  }

  return {
    elementsAffected,
    costImpact,
    areaImpact,
    metricsPatch,
    changeSummary: `Refinement requested: "${request}"`,
  };
}
