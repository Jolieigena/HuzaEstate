// Construction and Renovation Execution Tracking module types

export type ExecutionProjectStatus =
  | "setup_in_progress"
  | "awaiting_documents"
  | "awaiting_team_confirmation"
  | "ready_to_start"
  | "active"
  | "at_risk"
  | "delayed"
  | "paused"
  | "substantial_completion"
  | "snagging"
  | "ready_for_handover"
  | "handed_over"
  | "cancelled"
  | "archived";

export const EXECUTION_STATUS_LABELS: Record<ExecutionProjectStatus, string> = {
  setup_in_progress: "Setup in Progress",
  awaiting_documents: "Awaiting Documents",
  awaiting_team_confirmation: "Awaiting Team Confirmation",
  ready_to_start: "Ready to Start",
  active: "Active",
  at_risk: "At Risk",
  delayed: "Delayed",
  paused: "Paused",
  substantial_completion: "Substantial Completion",
  snagging: "Snagging",
  ready_for_handover: "Ready for Handover",
  handed_over: "Handed Over",
  cancelled: "Cancelled",
  archived: "Archived",
};

export type ExecutionRole =
  | "customer"
  | "contractor"
  | "site_supervisor"
  | "architect"
  | "engineer"
  | "quantity_surveyor"
  | "administrator";

export const EXECUTION_ROLE_LABELS: Record<ExecutionRole, string> = {
  customer: "Customer / Property Owner",
  contractor: "Main Contractor",
  site_supervisor: "Site Supervisor",
  architect: "Architect / Designer",
  engineer: "Engineer / Inspector",
  quantity_surveyor: "Quantity Surveyor",
  administrator: "Administrator",
};

export type Currency = "RWF" | "USD";

export type ProjectSourceType = "build" | "renovate" | "manual" | "admin";

export interface ExecutionTeamMember {
  id: string;
  userId?: string;
  name: string;
  role: ExecutionRole;
  email: string;
  phone: string;
  company?: string;
  permissions: string[];
  startDate: string;
  endDate?: string;
  contactPreferences: string;
  isEmergencyContact: boolean;
  confirmed: boolean;
}

export type ApprovalStatus =
  | "not_required"
  | "not_started"
  | "in_preparation"
  | "submitted"
  | "approved"
  | "rejected"
  | "expired"
  | "unknown";

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  not_required: "Not Required",
  not_started: "Not Started",
  in_preparation: "In Preparation",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
  unknown: "Unknown",
};

export interface ApprovalRecord {
  id: string;
  name: string; // e.g. Building Permit, Renovation Approval, HOA Approval
  category: "permit" | "owner" | "hoa" | "environmental" | "utility" | "drawings" | "insurance" | "safety";
  status: ApprovalStatus;
  referenceNumber?: string;
  issuingAuthority?: string;
  submissionDate?: string;
  approvalDate?: string;
  expiryDate?: string;
  supportingDocIds: string[];
  notes?: string;
}

export type PhaseName =
  | "Pre-construction"
  | "Site preparation"
  | "Demolition"
  | "Foundation and substructure"
  | "Structural work"
  | "Roofing"
  | "Plumbing and electrical"
  | "Walls and ceilings"
  | "Windows and doors"
  | "Finishes"
  | "Fixtures and cabinetry"
  | "External works"
  | "Landscaping"
  | "Testing and inspection"
  | "Snagging"
  | "Handover";

export type TaskStatus =
  | "not_started"
  | "ready"
  | "in_progress"
  | "blocked"
  | "awaiting_inspection"
  | "completed"
  | "delayed"
  | "cancelled";

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Not Started",
  ready: "Ready",
  in_progress: "In Progress",
  blocked: "Blocked",
  awaiting_inspection: "Awaiting Inspection",
  completed: "Completed",
  delayed: "Delayed",
  cancelled: "Cancelled",
};

export type TaskPriority = "low" | "normal" | "high" | "critical";

export interface ExecutionTask {
  id: string;
  workPackageId: string;
  phase: PhaseName;
  title: string;
  description: string;
  plannedStart: string;
  plannedFinish: string;
  actualStart?: string;
  actualFinish?: string;
  assigneeName: string;
  assigneeRole: ExecutionRole;
  progressPercent: number; // 0..100
  status: TaskStatus;
  priority: TaskPriority;
  dependencies: string[]; // task IDs
  delayReason?: string;
  notes?: string;
}

export interface WorkPackage {
  id: string;
  name: string;
  phase: PhaseName;
  description: string;
  leadRole: ExecutionRole;
  taskIds: string[];
  progressPercent: number;
}

export type MilestoneStatus =
  | "not_started"
  | "in_progress"
  | "submitted_for_review"
  | "inspection_required"
  | "changes_required"
  | "resubmitted"
  | "accepted"
  | "rejected"
  | "payment_eligible"
  | "closed";

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted_for_review: "Submitted for Review",
  inspection_required: "Inspection Required",
  changes_required: "Changes Required",
  resubmitted: "Resubmitted",
  accepted: "Accepted",
  rejected: "Rejected",
  payment_eligible: "Payment Eligible",
  closed: "Closed",
};

export type PaymentEligibilityStatus =
  | "not_eligible"
  | "eligibility_pending"
  | "eligible"
  | "payment_integration_not_configured";

export const PAYMENT_ELIGIBILITY_LABELS: Record<PaymentEligibilityStatus, string> = {
  not_eligible: "Not Eligible",
  eligibility_pending: "Eligibility Pending",
  eligible: "Eligible for Payment",
  payment_integration_not_configured: "Payment Integration Not Configured",
};

export interface ExecutionMilestone {
  id: string;
  title: string;
  description: string;
  relatedTaskIds: string[];
  plannedDate: string;
  actualCompletionDate?: string;
  completionCriteria: string[];
  requiredEvidence: string[];
  requiredInspectionType?: string;
  responsibleParty: string;
  contractValueAllocation: number; // currency amount
  status: MilestoneStatus;
  customerReviewNotes?: string;
  customerAcceptedAt?: string;
  professionalReviewNotes?: string;
  professionalApprovedAt?: string;
  paymentEligibility: PaymentEligibilityStatus;
  submissionSummary?: string;
  submittedEvidenceUrls?: string[];
}

export type DiaryEntryStatus = "draft" | "submitted" | "amended" | "locked";

export interface DiaryAmendmentHistory {
  timestamp: string;
  amendedBy: string;
  role: ExecutionRole;
  reason: string;
  fieldChanges: Record<string, { before: string; after: string }>;
}

export interface SiteDiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  workPackageId?: string;
  workCompleted: string;
  workInProgress: string;
  labourCount: number;
  contractorTeams: string[];
  equipmentOnSite: string[];
  materialsUsed: string[];
  deliveriesReceived: string[];
  siteConditions: string;
  weatherSummary: string; // entered manually
  visitors: string[];
  inspectionsHeld: string[];
  delaysEncountered: string;
  incidents: string;
  safetyObservations: string;
  photoUrls: string[];
  videoUrls: string[];
  notes: string;
  submittedBy: string;
  submittedByRole: ExecutionRole;
  submittedAt: string;
  status: DiaryEntryStatus;
  amendments: DiaryAmendmentHistory[];
  comments: {
    id: string;
    authorName: string;
    authorRole: ExecutionRole;
    timestamp: string;
    text: string;
  }[];
}

export type ReportType = "daily_update" | "weekly_report" | "milestone_report" | "delay_report" | "recovery_plan";

export interface ProgressReport {
  id: string;
  reportType: ReportType;
  periodStart: string;
  periodEnd: string;
  plannedProgressPercent: number;
  actualProgressPercent: number;
  completedWorkSummary: string;
  currentWorkSummary: string;
  upcomingWorkSummary: string;
  delaysAndBlockers: string;
  risksAndMitigations: string;
  decisionsRequired: string;
  evidencePhotoUrls: string[];
  updatedCompletionForecast: string;
  submittedBy: string;
  submittedAt: string;
  isAiObservation?: boolean; // labeled "Automated visual observation—not professional verification"
}

export type MaterialStatus =
  | "planned"
  | "awaiting_approval"
  | "approved"
  | "ordered"
  | "partially_delivered"
  | "delivered"
  | "rejected"
  | "returned"
  | "installed";

export const MATERIAL_STATUS_LABELS: Record<MaterialStatus, string> = {
  planned: "Planned",
  awaiting_approval: "Awaiting Approval",
  approved: "Approved",
  ordered: "Ordered",
  partially_delivered: "Partially Delivered",
  delivered: "Delivered",
  rejected: "Rejected",
  returned: "Returned",
  installed: "Installed",
};

export interface MaterialItem {
  id: string;
  materialName: string;
  specification: string;
  quantity: number;
  unit: string;
  sourceSupplier: string;
  requiredDate: string;
  orderedDate?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: MaterialStatus;
  inspectionStatus: "pending" | "passed" | "rejected" | "passed_with_notes";
  storageLocationOnSite?: string;
  relatedTaskId?: string;
  deliveryPhotos?: string[];
  quantityDiscrepancyNotes?: string;
  damageNotes?: string;
  supportingDocIds: string[];
}

export type SubstitutionStatus = "draft" | "submitted" | "under_review" | "approved" | "rejected" | "info_requested";

export interface MaterialSubstitution {
  id: string;
  originalMaterial: string;
  proposedReplacement: string;
  reason: string;
  costImpact: number; // positive = increase, negative = decrease
  scheduleImpactDays: number;
  performanceDifference: string;
  appearanceDifference: string;
  warrantyDifference: string;
  samplePhotoUrls: string[];
  submittedBy: string;
  submittedAt: string;
  status: SubstitutionStatus;
  professionalReviewer?: string;
  professionalNotes?: string;
  customerDecisionNotes?: string;
  decisionDate?: string;
}

export type InspectionType =
  | "site_readiness"
  | "foundation"
  | "structural_frame"
  | "roofing"
  | "electrical_rough_in"
  | "plumbing_rough_in"
  | "waterproofing"
  | "wall_closure"
  | "finishes"
  | "accessibility"
  | "safety"
  | "final_inspection"
  | "custom";

export const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  site_readiness: "Site Readiness",
  foundation: "Foundation & Substructure",
  structural_frame: "Structural Frame",
  roofing: "Roofing & Water Tightness",
  electrical_rough_in: "Electrical Rough-in",
  plumbing_rough_in: "Plumbing Rough-in",
  waterproofing: "Waterproofing Barrier",
  wall_closure: "Pre-Wall Closure",
  finishes: "Finishes & Joinery",
  accessibility: "Accessibility Check",
  safety: "Site Safety Audit",
  final_inspection: "Final Handover Inspection",
  custom: "Custom Stage Inspection",
};

export type InspectionOutcome =
  | "scheduled"
  | "in_progress"
  | "passed"
  | "passed_with_observations"
  | "corrective_work_required"
  | "failed"
  | "reinspection_required"
  | "cancelled";

export const INSPECTION_OUTCOME_LABELS: Record<InspectionOutcome, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  passed: "Passed",
  passed_with_observations: "Passed with Observations",
  corrective_work_required: "Corrective Work Required",
  failed: "Failed",
  reinspection_required: "Re-inspection Required",
  cancelled: "Cancelled",
};

export interface InspectionCheckitem {
  id: string;
  label: string;
  passed: boolean | null; // null = unrated
  notes?: string;
}

export interface InspectionRecord {
  id: string;
  type: InspectionType;
  title: string;
  relatedMilestoneId?: string;
  requestedBy: string;
  assignedInspectorName: string;
  assignedInspectorRole: ExecutionRole;
  scheduledDate: string;
  completedDate?: string;
  locationOnSite: string;
  checklist: InspectionCheckitem[];
  evidencePhotoUrls: string[];
  findings: string;
  correctiveActionsRequired?: string;
  reinspectionRequired: boolean;
  outcome: InspectionOutcome;
  inspectorDeclarationConfirmed: boolean;
}

export type ChangeOrigin =
  | "customer"
  | "contractor"
  | "architect"
  | "engineer"
  | "inspector"
  | "site_condition"
  | "material_unavailability"
  | "regulatory_requirement";

export type ChangeStatus =
  | "draft"
  | "submitted"
  | "under_assessment"
  | "clarification_required"
  | "costing_required"
  | "awaiting_professional_review"
  | "awaiting_customer_approval"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "implemented";

export const CHANGE_STATUS_LABELS: Record<ChangeStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_assessment: "Under Assessment",
  clarification_required: "Clarification Required",
  costing_required: "Costing Required",
  awaiting_professional_review: "Awaiting Professional Review",
  awaiting_customer_approval: "Awaiting Customer Approval",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  implemented: "Implemented",
};

export interface ChangeRequest {
  id: string;
  changeReference: string; // e.g. CO-001
  origin: ChangeOrigin;
  title: string;
  description: string;
  reason: string;
  requestedByName: string;
  requestedByRole: ExecutionRole;
  affectedDesignElement?: string;
  affectedRoomsOrPackages: string[];
  costImpact: number; // positive = increase, negative = decrease
  scheduleImpactDays: number;
  scopeImpactSummary: string;
  safetyImpactSummary?: string;
  supportingDocIds: string[];
  professionalRecommendation?: string;
  professionalReviewerName?: string;
  customerDecisionNotes?: string;
  status: ChangeStatus;
  createdAt: string;
  approvedAt?: string;
  isEmergencyWork?: boolean;
  emergencyJustification?: string;
}

export interface ChangeOrder {
  id: string;
  changeRequestId: string;
  changeReference: string;
  title: string;
  costDelta: number;
  scheduleDeltaDays: number;
  approvedByCustomerName: string;
  approvedAt: string;
  baselineContractValueBefore: number;
  baselineContractValueAfter: number;
  revisedCompletionDate: string;
}

export type IssueType =
  | "design_clarification"
  | "site_condition"
  | "quality_concern"
  | "safety_concern"
  | "material_problem"
  | "schedule_delay"
  | "access_problem"
  | "customer_decision"
  | "contractor_question"
  | "professional_instruction"
  | "other";

export type IssuePriority = "low" | "normal" | "high" | "urgent" | "stop_work";

export const ISSUE_PRIORITY_LABELS: Record<IssuePriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
  stop_work: "STOP WORK",
};

export type IssueStatus =
  | "open"
  | "assigned"
  | "response_required"
  | "in_progress"
  | "resolved"
  | "closed"
  | "reopened";

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: "Open",
  assigned: "Assigned",
  response_required: "Response Required",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Re-opened",
};

export interface IssueRecord {
  id: string;
  issueReference: string; // e.g. ISS-01
  type: IssueType;
  priority: IssuePriority;
  title: string;
  description: string;
  raisedByName: string;
  raisedByRole: ExecutionRole;
  assignedToName: string;
  assignedToRole: ExecutionRole;
  relatedTaskId?: string;
  relatedMilestoneId?: string;
  relatedRoomOrArea?: string;
  attachmentUrls: string[];
  dueDate?: string;
  status: IssueStatus;
  resolutionSummary?: string;
  closedByName?: string;
  closedAt?: string;
  createdAt: string;
}

export type DefectSeverity = "minor_cosmetic" | "moderate" | "major_functional" | "critical_safety";

export type DefectStatus =
  | "open"
  | "accepted_by_contractor"
  | "correction_in_progress"
  | "ready_for_verification"
  | "corrected"
  | "rejected_after_verification"
  | "closed";

export interface DefectItem {
  id: string;
  defectReference: string; // e.g. SNG-01
  roomLocation: string;
  category: string;
  description: string;
  severity: DefectSeverity;
  photoUrls: string[];
  reportedByName: string;
  assignedContractorName: string;
  targetCorrectionDate: string;
  correctionEvidencePhotoUrls?: string[];
  verificationNotes?: string;
  status: DefectStatus;
  createdAt: string;
}

export interface HandoverChecklist {
  scopeCompleted: boolean;
  approvedChangesCompleted: boolean;
  requiredInspectionsPassed: boolean;
  openDefectsAddressed: boolean;
  siteCleaned: boolean;
  wasteRemoved: boolean;
  utilitiesTested: boolean;
  customerWalkthroughCompleted: boolean;
  documentsUploaded: boolean;
  warrantiesProvided: boolean;
  maintenanceInfoProvided: boolean;
}

export type HandoverStatus =
  | "not_started"
  | "snagging_in_progress"
  | "ready_for_review"
  | "accepted_clean"
  | "accepted_with_minor_items"
  | "rejected_unresolved_items"
  | "completed";

export type WarrantyIssueStatus =
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected_with_reason"
  | "repair_scheduled"
  | "repair_in_progress"
  | "ready_for_verification"
  | "resolved"
  | "closed";

export interface WarrantyRecord {
  id: string;
  title: string;
  itemOrSystem: string;
  supplierOrManufacturer: string;
  warrantyPeriodMonths: number;
  startDate: string;
  expiryDate: string;
  termsSummary: string;
  documentIds: string[];
}

export interface WarrantyIssue {
  id: string;
  warrantyRecordId?: string;
  title: string;
  description: string;
  evidencePhotoUrls: string[];
  reportedByName: string;
  reportedAt: string;
  assignedPartyName: string;
  status: WarrantyIssueStatus;
  repairDate?: string;
  resolutionNotes?: string;
}

export type ExecutionDocumentCategory =
  | "baseline_design"
  | "scope"
  | "accepted_quotation"
  | "project_setup"
  | "approvals_permits"
  | "schedule"
  | "site_diary"
  | "progress_reports"
  | "inspection_reports"
  | "change_orders"
  | "material_records"
  | "safety_records"
  | "warranties"
  | "handover_documents"
  | "other";

export type ExecutionDocumentAccess =
  | "customer_and_team"
  | "customer_only"
  | "contractor_team"
  | "assigned_professional"
  | "admin_privileged";

export interface ExecutionDocument {
  id: string;
  name: string;
  category: ExecutionDocumentCategory;
  accessLabel: ExecutionDocumentAccess;
  fileType: string;
  sizeBytes: number;
  uploadedByName: string;
  uploadedByRole: ExecutionRole;
  uploadedAt: string;
  version: string;
  relatedRecordId?: string;
  fileUrl?: string;
}

export interface ExecutionActivityEvent {
  id: string;
  executionId: string;
  timestamp: string;
  actorName: string;
  actorRole: ExecutionRole;
  type: string;
  summary: string;
  details?: string;
  relatedTab?: string;
}

export interface ExecutionCommunicationSettings {
  primaryChannel: string;
  progressReportFrequency: "daily" | "weekly" | "biweekly";
  siteMeetingFrequency: "weekly" | "biweekly" | "monthly";
  emergencyContacts: string;
  changeApprovalContacts: string;
  inspectionContacts: string;
}

export interface ExecutionProject {
  id: string;
  name: string;
  sourceType: ProjectSourceType;
  sourceProjectId?: string; // BuildProject or RenovationProject ID
  sourceQuotationId?: string;
  customerName: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  contractorName: string;
  contractorId: string;
  contractorEmail: string;
  contractorPhone: string;
  location: string;
  designVersionName: string;
  approvedScopeSummary: string;
  contractValue: number;
  originalContractValue: number;
  currency: Currency;
  startDate: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  status: ExecutionProjectStatus;
  overallProgressPercent: number; // 0..100
  latestProgressImageUrl?: string;
  nextRequiredAction: string;

  // Setup & baseline
  team: ExecutionTeamMember[];
  approvals: ApprovalRecord[];
  communication: ExecutionCommunicationSettings;
  customerSetupConfirmed: boolean;
  contractorSetupConfirmed: boolean;
  leadProfessionalSetupConfirmed: boolean;

  // Execution sub-modules
  workPackages: WorkPackage[];
  tasks: ExecutionTask[];
  milestones: ExecutionMilestonesView[];
  siteDiary: SiteDiaryEntry[];
  progressReports: ProgressReport[];
  materials: MaterialItem[];
  substitutions: MaterialSubstitution[];
  inspections: InspectionRecord[];
  changeRequests: ChangeRequest[];
  changeOrders: ChangeOrder[];
  issues: IssueRecord[];
  defects: DefectItem[];
  handoverChecklist: HandoverChecklist;
  handoverStatus: HandoverStatus;
  handoverAcceptedAt?: string;
  warranties: WarrantyRecord[];
  warrantyIssues: WarrantyIssue[];
  documents: ExecutionDocument[];
  activity: ExecutionActivityEvent[];

  createdAt: string;
  updatedAt: string;

  // Admin flags
  isPausedByAdmin?: boolean;
  adminNotes?: string;
}

// Helper re-export for milestones
export type ExecutionMilestonesView = ExecutionMilestone;
