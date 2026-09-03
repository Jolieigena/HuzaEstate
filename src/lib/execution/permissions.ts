// Execution module role-based and action-based permissions checking

import { ExecutionRole, ExecutionProject } from "./types";

export type ExecutionAction =
  | "project.view"
  | "project.setup_confirm"
  | "schedule.edit"
  | "task.update"
  | "site_diary.create"
  | "site_diary.edit_submitted" // strictly restricted!
  | "site_diary.comment"
  | "progress_report.submit"
  | "material.add"
  | "material.substitution_request"
  | "material.substitution_approve"
  | "inspection.request"
  | "inspection.perform" // engineer/architect/inspector only
  | "milestone.submit"
  | "milestone.review_customer"
  | "milestone.review_professional"
  | "change_request.raise"
  | "change_request.review_qs"
  | "change_request.approve_customer"
  | "issue.raise"
  | "issue.resolve"
  | "defect.report"
  | "defect.correct"
  | "defect.verify"
  | "handover.prepare"
  | "handover.accept_customer"
  | "warranty.report"
  | "admin.pause"
  | "admin.view_metadata"
  | "admin.privileged_view";

export function canPerformExecutionAction(
  role: ExecutionRole,
  action: ExecutionAction,
  _project?: ExecutionProject,
  _userEmail?: string
): boolean {
  switch (action) {
    case "project.view":
      return true; // route guard checks assigned role

    case "project.setup_confirm":
      return role === "customer" || role === "contractor" || role === "architect" || role === "engineer";

    case "schedule.edit":
    case "task.update":
    case "site_diary.create":
    case "progress_report.submit":
    case "material.add":
    case "material.substitution_request":
    case "milestone.submit":
    case "defect.correct":
    case "handover.prepare":
      return role === "contractor" || role === "site_supervisor";

    case "site_diary.edit_submitted":
      // NO ONE can directly overwrite a locked/submitted diary entry. Must be amended with audit trail!
      return false;

    case "site_diary.comment":
      return true;

    case "material.substitution_approve":
      return role === "customer" || role === "architect" || role === "engineer";

    case "inspection.request":
      return role === "contractor" || role === "site_supervisor" || role === "customer";

    case "inspection.perform":
      // Main contractor CANNOT perform or pass their own independent inspection on behalf of inspector!
      return role === "engineer" || role === "architect" || role === "administrator";

    case "milestone.review_customer":
      return role === "customer";

    case "milestone.review_professional":
      return role === "architect" || role === "engineer" || role === "quantity_surveyor";

    case "change_request.raise":
      return true; // any stakeholder can raise a change request

    case "change_request.review_qs":
      return role === "quantity_surveyor" || role === "architect" || role === "engineer";

    case "change_request.approve_customer":
      // Main contractor or admin CANNOT approve change request on behalf of customer!
      return role === "customer";

    case "issue.raise":
    case "defect.report":
    case "warranty.report":
      return true;

    case "issue.resolve":
      return role === "contractor" || role === "site_supervisor" || role === "architect" || role === "engineer";

    case "defect.verify":
      return role === "customer" || role === "architect" || role === "engineer";

    case "handover.accept_customer":
      // Admin or contractor CANNOT accept handover on customer behalf!
      return role === "customer";

    case "admin.pause":
    case "admin.view_metadata":
    case "admin.privileged_view":
      return role === "administrator";

    default:
      return false;
  }
}
