import { RenovationProjectService } from "./projectService";
import { generateScope } from "./scopeGenerator";
import { HIGH_RISK_AREA_KEYS, RenovationProject } from "./types";

/** Works out the scope of work from the brief and saves it with the project. */
export function makeScope(project: RenovationProject): void {
  const items = generateScope(project.assessment.areas, project.assessment.keepRemoveChange, project.assessment.safety);
  RenovationProjectService.generateScope(project.id, items);
  const highRiskCount = project.assessment.areas.filter((a) => HIGH_RISK_AREA_KEYS.includes(a.areaKey)).length;
  RenovationProjectService.recalculateTimeline(project.id, {
    desiredStartDate: project.assessment.budgetTimeline.desiredStartDate,
    scopeItemCount: items.length,
    highRiskAreaCount: highRiskCount,
    propertyRemainsOccupied: project.assessment.budgetTimeline.propertyRemainsOccupied,
  });
}
