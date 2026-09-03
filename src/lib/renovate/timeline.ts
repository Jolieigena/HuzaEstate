import { DisruptionLevel, RenovationTimelineEstimate, TimelinePhase, TimelinePhaseKey, TIMELINE_PHASE_LABELS } from "./types";

const BASE_PHASES: { key: TimelinePhaseKey; weeks: number; dependency: string; parallelWith: TimelinePhaseKey[]; disruption: DisruptionLevel }[] = [
  { key: "assessment_design", weeks: 2, dependency: "None — this is the starting phase.", parallelWith: [], disruption: "low" },
  { key: "professional_review", weeks: 1, dependency: "Requires a confirmed concept and brief.", parallelWith: ["procurement"], disruption: "low" },
  { key: "approvals", weeks: 2, dependency: "Requires professional review where permits are needed.", parallelWith: ["procurement"], disruption: "low" },
  { key: "procurement", weeks: 2, dependency: "Can start once the scope of work is confirmed.", parallelWith: ["professional_review", "approvals"], disruption: "low" },
  { key: "site_preparation", weeks: 1, dependency: "Requires procurement of protective materials and site access confirmation.", parallelWith: [], disruption: "medium" },
  { key: "demolition", weeks: 1, dependency: "Requires site preparation to be complete.", parallelWith: [], disruption: "high" },
  { key: "structural_services", weeks: 3, dependency: "Requires demolition to be complete before electrical and plumbing work begins.", parallelWith: [], disruption: "high" },
  { key: "finishes", weeks: 3, dependency: "Requires structural and services work, including inspection, to be complete before walls are closed.", parallelWith: [], disruption: "medium" },
  { key: "fixtures_furniture", weeks: 1, dependency: "Requires finishes (ceiling and painting) to be complete.", parallelWith: [], disruption: "low" },
  { key: "inspection_handover", weeks: 1, dependency: "Requires all fixtures and furniture to be in place.", parallelWith: [], disruption: "low" },
];

export interface TimelineInputs {
  desiredStartDate: string;
  scopeItemCount: number;
  highRiskAreaCount: number;
  propertyRemainsOccupied: boolean | null;
  currentPhaseKey?: TimelinePhaseKey | null;
}

export function calculateRenovationTimeline(inputs: TimelineInputs): RenovationTimelineEstimate {
  const scopeFactor = inputs.scopeItemCount > 25 ? 1.3 : inputs.scopeItemCount > 12 ? 1.1 : 1;
  const riskFactor = 1 + inputs.highRiskAreaCount * 0.15;

  const phases: TimelinePhase[] = BASE_PHASES.map((p) => ({
    key: p.key,
    label: TIMELINE_PHASE_LABELS[p.key],
    estimatedDurationWeeks: Math.max(1, Math.round(p.weeks * scopeFactor * (p.key === "structural_services" || p.key === "demolition" ? riskFactor : 1))),
    dependency: p.dependency,
    canRunInParallelWith: p.parallelWith,
    expectedDisruption: p.disruption,
  }));

  // Parallel phases (procurement alongside review/approvals) don't add to critical-path length.
  const totalDurationWeeks = phases.reduce((sum, p) => (p.key === "procurement" ? sum : sum + p.estimatedDurationWeeks), 0);

  return {
    phases,
    currentPhaseKey: inputs.currentPhaseKey ?? "assessment_design",
    totalDurationWeeks,
    occupancyWarning: inputs.propertyRemainsOccupied === true && inputs.highRiskAreaCount > 0,
    desiredStartDate: inputs.desiredStartDate,
    lastCalculated: new Date().toISOString(),
  };
}
