import { BRIEF_STEP_KEYS, BuildProject, QUICK_BRIEF_STEP_KEYS, isQuickBrief } from "./types";

/** The steps a project's brief has: three on the short path, seven in the full brief. */
function briefStepKeysOf(project: BuildProject) {
  return isQuickBrief(project.brief) ? QUICK_BRIEF_STEP_KEYS : BRIEF_STEP_KEYS;
}

export function briefStepCount(project: BuildProject): number {
  return briefStepKeysOf(project).length;
}

/** How many of those steps are done, counting only the ones the brief actually has. */
export function briefStepsDone(project: BuildProject): number {
  return briefStepKeysOf(project).filter((key) => project.brief.completedSteps.includes(key)).length;
}

export function getProjectProgress(project: BuildProject): number {
  switch (project.status) {
    case "draft":
      return 5;
    case "brief_in_progress": {
      const ratio = briefStepsDone(project) / briefStepCount(project);
      return Math.max(10, Math.round(10 + ratio * 35));
    }
    case "ready_to_generate":
      return 50;
    case "generating":
      return 58;
    case "concepts_ready":
      return project.selectedConceptId ? 78 : 65;
    case "refinement_in_progress":
      return 82;
    case "awaiting_professional_review":
      return 90;
    case "professionally_reviewed":
      return 100;
    case "archived":
      return 100;
    default:
      return 0;
  }
}

export interface NextAction {
  label: string;
  href: string;
  description: string;
}

export function getNextAction(project: BuildProject): NextAction | null {
  switch (project.status) {
    case "draft":
      return { label: "Fill in your brief", href: `/studio/build/${project.id}/brief`, description: "Add a few details so Huza AI and the manual designer have what they need." };
    case "brief_in_progress":
      return { label: "Confirm your design brief", href: `/studio/build/${project.id}/brief`, description: "Finish the remaining brief steps and confirm your requirements." };
    case "ready_to_generate":
      return { label: project.creationMode === "ai" ? "Start designing" : "Generate your first concepts", href: `/studio/build/${project.id}/concepts`, description: "Your brief is confirmed — generate three design directions to compare." };
    case "generating":
      return { label: "View generation progress", href: `/studio/build/${project.id}/concepts`, description: "Huza AI is preparing your concept directions." };
    case "concepts_ready":
      return project.selectedConceptId
        ? { label: "Request professional review", href: `/studio/build/${project.id}/professionals`, description: "Share your selected concept with a professional before construction." }
        : { label: "Compare your concepts", href: `/studio/build/${project.id}/compare`, description: "Compare the three generated directions and select your favourite." };
    case "refinement_in_progress":
      return { label: "Review your latest version", href: `/studio/build/${project.id}/concepts`, description: "Check the refinement Huza AI just applied as a new version." };
    case "awaiting_professional_review":
      return { label: "View review status", href: `/studio/build/${project.id}/professionals`, description: "Track your professional review request and any feedback received." };
    case "professionally_reviewed":
      return { label: "View professional feedback", href: `/studio/build/${project.id}/professionals`, description: "Read the professional's comments and plan your next revision." };
    default:
      return null;
  }
}
