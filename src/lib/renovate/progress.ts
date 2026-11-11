import { assessmentStepKeys, RenovationProject } from "./types";

export function getProjectProgress(project: RenovationProject): number {
  switch (project.status) {
    case "draft":
      return 5;
    case "property_setup":
      return 10;
    case "assessment_in_progress": {
      const keys = assessmentStepKeys(project.assessment);
      const ratio = keys.filter((key) => project.assessment.completedSteps.includes(key)).length / keys.length;
      return Math.max(15, Math.round(15 + ratio * 30));
    }
    case "ready_to_generate":
      return 48;
    case "generating":
      return 55;
    case "concepts_ready":
      return project.selectedConceptId ? 68 : 60;
    case "refinement_in_progress":
      return 72;
    case "scope_ready":
      return 78;
    case "awaiting_professional_review":
      return 85;
    case "awaiting_quotations":
      return 90;
    case "quotation_received":
      return 95;
    case "ready_for_execution":
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

export function getNextAction(project: RenovationProject): NextAction | null {
  const base = `/studio/renovate/${project.id}`;
  switch (project.status) {
    case "draft":
    case "property_setup":
      return { label: "Choose the property", href: `${base}/assessment`, description: "Confirm the property being renovated before starting the assessment." };
    case "assessment_in_progress":
      return { label: "Continue the assessment", href: `${base}/assessment`, description: "Finish the remaining assessment steps and confirm your renovation brief." };
    case "ready_to_generate":
      return { label: "Design my renovation", href: `${base}/concepts`, description: "Your brief is confirmed — Huza AI can design your renovation." };
    case "generating":
      return { label: "View generation progress", href: `${base}/concepts`, description: "Huza AI is preparing your renovation concepts." };
    case "concepts_ready":
      return project.selectedConceptId
        ? { label: "Review the scope of work", href: `${base}/scope`, description: "Generate a room-by-room scope for your selected concept." }
        : { label: "See your redesign", href: `${base}/concepts`, description: "Look at your redesign and carry on." };
    case "refinement_in_progress":
      return { label: "Review your latest version", href: `${base}/concepts`, description: "Check the refinement Huza AI just applied as a new version." };
    case "scope_ready":
      return { label: "Download your renovation summary", href: `${base}/documents/summary`, description: "Keep the design and the scope of work, or hire a professional." };
    case "awaiting_professional_review":
      return { label: "View review status", href: `${base}/professionals`, description: "Track your professional review request and any feedback received." };
    case "awaiting_quotations":
      return { label: "View quotation status", href: `${base}/quotes`, description: "Track your contractor quotation requests." };
    case "quotation_received":
      return { label: "Compare quotations", href: `${base}/quotes`, description: "Compare received quotations before accepting one." };
    case "ready_for_execution":
      return { label: "Download the renovation summary", href: `${base}/documents`, description: "Your project is ready for execution — export a summary for your records." };
    default:
      return null;
  }
}
