import { extractRequirementsFromPrompt } from "./agentService";
import { RENOVATION_AREA_LABELS, RENOVATION_STYLE_LABELS, RenovationAreaKey, RenovationAssessment, RenovationStyle, SelectedRenovationArea } from "./types";

// Reads a person's own words ("renovate the kitchen and bathroom in a modern style, budget 8 million") into the assessment, so it
// opens already filled in with what they said. It reuses the keyword reader behind the Huza AI conversation: it fills in what it
// recognises (the areas, the style and the budget) and leaves the rest for the person to answer.

export function newArea(areaKey: RenovationAreaKey): SelectedRenovationArea {
  return {
    id: `area_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    areaKey,
    currentUse: "",
    approxDimensions: "",
    mainProblem: "",
    desiredOutcome: "",
    priority: "medium",
    structuralChangesExpected: false,
    notes: "",
  };
}

/** The assessment with whatever the words say filled in. Nothing the person has already entered is overwritten. */
export function assessmentFromPrompt(assessment: RenovationAssessment, words: string): RenovationAssessment {
  if (!words.trim()) return assessment;
  const next: RenovationAssessment = JSON.parse(JSON.stringify(assessment));
  const found = new Map(extractRequirementsFromPrompt(words).map((item) => [item.field, item.value]));

  const areaLabels = (found.get("areas") ?? "").split(",").map((label) => label.trim()).filter(Boolean);
  for (const label of areaLabels) {
    const key = (Object.entries(RENOVATION_AREA_LABELS) as [RenovationAreaKey, string][]).find(([, text]) => text === label)?.[0];
    if (key && !next.areas.some((a) => a.areaKey === key)) next.areas.push(newArea(key));
  }

  const styleLabel = found.get("style");
  if (styleLabel && !next.style.primaryStyle) {
    const key = (Object.entries(RENOVATION_STYLE_LABELS) as [RenovationStyle, string][]).find(([, text]) => text === styleLabel)?.[0];
    if (key) next.style.primaryStyle = key;
  }

  // A budget in dollars is left for the person to enter: the assessment's budget is read in francs here.
  const budget = Number.parseInt((found.get("budget") ?? "").replace(/[^\d]/g, ""), 10);
  if (budget && !/\busd\b|\$|dollar/i.test(words) && !next.budgetTimeline.targetBudget) next.budgetTimeline.targetBudget = budget;

  return next;
}
