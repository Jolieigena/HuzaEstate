export type AdminRole =
  | "super_admin"
  | "operations_admin"
  | "verification_officer"
  | "listing_moderator"
  | "support_dispute_officer"
  | "content_manager"
  | "auditor"
  | "platform_analyst";

export type Permission =
  | "users.view" | "users.manage" | "users.suspend"
  | "roles.view" | "roles.assign"
  | "professionals.view" | "professionals.verify" | "professionals.suspend"
  | "listings.view" | "listings.moderate"
  | "projects.view_metadata" | "projects.view_private"
  | "reviews.view" | "quotations.view"
  | "support.manage" | "disputes.manage"
  | "content.manage"
  | "ai.view_usage" | "ai.manage_configuration"
  | "reports.view" | "reports.export"
  | "audit.view" | "audit.export"
  | "settings.manage" | "feature_flags.manage"
  | "finance.view" | "finance.configure" | "finance.refunds_review" | "finance.reconciliation" | "finance.export" | "finance.disputes" | "finance.privileged_access";

export interface AdminRoleAssignment {
  accountId: string;
  role: AdminRole;
  assignedAt: string;
  assignedBy: string;
  reason?: string;
  expiresAt?: string;
}

export type AccountDirectoryType = "customer" | "seller_manager" | "professional" | "contractor" | "administrator";
export type AccountStatus = "active" | "pending" | "restricted" | "suspended" | "closed";

export type AccountRestrictionKind =
  | "cannot_publish_listings" | "cannot_submit_professional_application" | "cannot_accept_professional_work"
  | "cannot_submit_quotations" | "cannot_create_ai_generations" | "cannot_upload_documents" | "read_only";

export interface AccountRestriction {
  id: string;
  kind: AccountRestrictionKind;
  reason: string;
  effectiveDate: string;
  expiryDate?: string;
  internalNote?: string;
  customerVisibleExplanation: string;
  createdBy: string;
  createdAt: string;
  active: boolean;
}

export interface AdminNote {
  id: string;
  authorAccountId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface AccountStatusChange {
  id: string;
  from: AccountStatus;
  to: AccountStatus;
  reason: string;
  actorAccountId: string;
  at: string;
}

export interface AdminUserRecord {
  accountId: string;
  name: string;
  email: string;
  phone?: string;
  accountType: AccountDirectoryType;
  status: AccountStatus;
  verification: "unverified" | "pending" | "demo_verified";
  registeredAt: string;
  lastActivityAt: string;
  synthetic: boolean;
  restrictions: AccountRestriction[];
  notes: AdminNote[];
  statusHistory: AccountStatusChange[];
}

export type VerificationAction =
  | "submitted" | "assigned" | "reassigned" | "info_requested" | "info_received"
  | "document_reviewed" | "approved" | "rejected" | "suspended" | "restored" | "note_added";

export type DocumentReviewDecision =
  | "not_reviewed" | "appears_valid" | "more_information_required" | "expired" | "illegible" | "mismatch" | "requires_external_confirmation";

export interface VerificationHistoryEntry {
  id: string;
  profileId: string;
  action: VerificationAction;
  actorAccountId: string;
  actorName: string;
  detail: string;
  at: string;
  documentLabel?: string;
  documentDecision?: DocumentReviewDecision;
}

export type ListingModerationStatus = "published" | "awaiting_moderation" | "changes_requested" | "rejected" | "unpublished" | "reported" | "archived";

export interface ListingModerationHistoryEntry {
  status: ListingModerationStatus;
  at: string;
  actorAccountId: string;
  reason?: string;
}

export interface ListingModerationRecord {
  propertyId: string;
  status: ListingModerationStatus;
  reason?: string;
  customerVisibleExplanation?: string;
  reportCount: number;
  assignedModerator?: string;
  updatedAt: string;
  updatedBy?: string;
  history: ListingModerationHistoryEntry[];
}

export type PrivilegedAccessReason = "customer_support" | "active_dispute" | "safety_investigation" | "abuse_investigation" | "legal_regulatory" | "technical_recovery";

export interface PrivilegedAccessLogEntry {
  id: string;
  module: "build" | "renovate";
  projectId: string;
  actorAccountId: string;
  actorName: string;
  reason: PrivilegedAccessReason;
  caseReference: string;
  at: string;
}

export interface ProjectAdminFlag {
  projectId: string;
  aiGenerationRestricted: boolean;
  restrictedReason?: string;
  restrictedBy?: string;
  restrictedAt?: string;
}

export type SupportCategory = "account_access" | "property_listing" | "build_project" | "renovation_project" | "professional_review" | "contractor_quotation" | "file_document" | "ai_generation" | "technical_issue" | "privacy_request" | "other";
export type SupportPriority = "low" | "normal" | "high" | "urgent";
export type SupportStatus = "new" | "assigned" | "waiting_customer" | "waiting_professional" | "in_progress" | "escalated" | "resolved" | "closed" | "reopened";

export interface SupportMessage {
  id: string;
  caseId: string;
  authorAccountId?: string;
  authorName: string;
  visibility: "customer" | "internal";
  text: string;
  createdAt: string;
}

export interface SupportStatusChange {
  status: SupportStatus;
  at: string;
  actorAccountId: string;
  note?: string;
}

export interface SupportCase {
  id: string;
  reference: string;
  requesterAccountId: string;
  requesterName: string;
  category: SupportCategory;
  priority: SupportPriority;
  status: SupportStatus;
  subject: string;
  description: string;
  relatedAccountId?: string;
  relatedProjectId?: string;
  relatedListingId?: string;
  relatedRequestId?: string;
  relatedQuotationId?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolution?: string;
  messages: SupportMessage[];
  statusHistory: SupportStatusChange[];
}

export type DisputeCategory = "review_quality" | "missed_deadline" | "contractor_quotation" | "misrepresented_scope" | "confidentiality" | "professional_conduct" | "listing_accuracy" | "account_access" | "document_ownership" | "other";
export type DisputeStatus = "submitted" | "screening" | "information_required" | "under_review" | "response_requested" | "resolution_proposed" | "resolved" | "closed" | "appealed";

export interface DisputeEvidenceItem {
  id: string;
  label: string;
  submittedByAccountId: string;
  submittedByName: string;
  submittedAt: string;
  note?: string;
}

export interface DisputeStatusChange {
  status: DisputeStatus;
  at: string;
  actorAccountId: string;
  note?: string;
}

export interface Dispute {
  id: string;
  reference: string;
  complainantAccountId: string;
  complainantName: string;
  respondentAccountId?: string;
  respondentName?: string;
  category: DisputeCategory;
  status: DisputeStatus;
  description: string;
  desiredResolution: string;
  relatedProjectId?: string;
  relatedQuotationId?: string;
  relatedRequestId?: string;
  urgency: "normal" | "high";
  safetyConcern: boolean;
  evidence: DisputeEvidenceItem[];
  internalNotes: AdminNote[];
  respondentResponse?: string;
  proposedResolution?: string;
  finalOutcome?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: DisputeStatusChange[];
}

export type AiErrorCategory = "invalid_input" | "unsupported_file" | "storage_failure" | "generation_timeout" | "provider_unavailable" | "safety_restriction" | "usage_limit" | "unknown";

export interface AiGenerationRecord {
  id: string;
  accountId: string;
  projectId: string;
  module: "build" | "renovate";
  generationType: string;
  status: "succeeded" | "failed" | "cancelled";
  createdAt: string;
  durationMs: number;
  modelIndicator: string;
  errorCategory?: AiErrorCategory;
  safetyFlag: boolean;
  usageUnits: number;
  linkedSupportCaseId?: string;
  resolved?: boolean;
  operationalNote?: string;
  promptSummary: string;
}

export interface AiFeatureFlags {
  aiEnabled: boolean;
  buildGenerationEnabled: boolean;
  renovateGenerationEnabled: boolean;
  targetedEditingEnabled: boolean;
  maxGenerationCount: number;
  maxUploadCount: number;
  maxUploadSizeMb: number;
  dailyLimit: number;
  maintenanceMessage: string;
  safetyDisclaimer: string;
  conceptWatermark: boolean;
  mockServiceIndicator: string;
}

export type ContentArea = "build_faq" | "renovate_faq" | "build_process" | "renovate_process" | "demo_video" | "build_example" | "renovate_example" | "professional_portal_info" | "public_disclaimer" | "announcement";
export type ContentStatus = "draft" | "scheduled" | "published" | "archived";

export interface ContentVersion {
  version: number;
  content: string;
  savedAt: string;
  savedBy: string;
}

export interface ContentItem {
  id: string;
  area: ContentArea;
  title: string;
  slug: string;
  content: string;
  status: ContentStatus;
  order: number;
  publishAt?: string;
  expiryAt?: string;
  updatedAt: string;
  updatedBy: string;
  versions: ContentVersion[];
}

export interface AuditLogEntry {
  id: string;
  at: string;
  actorAccountId: string;
  actorName: string;
  actorRole: AdminRole | "system";
  action: string;
  resourceType: string;
  resourceId: string;
  previousValueSummary?: string;
  newValueSummary?: string;
  reason?: string;
  relatedCase?: string;
  result: "success" | "blocked";
}

export interface PlatformSettings {
  general: { platformName: string; supportContact: string; defaultCountry: string; defaultCurrency: string; defaultTimezone: string; maintenanceNotice: string };
  listings: { allowedPropertyTypes: string[]; imageLimit: number; reviewRequired: boolean; listingExpiryDays: number; reportThreshold: number };
  build: { availableStyles: string[]; generationLimit: number; conceptDisclaimer: string; professionalReviewReminderDays: number };
  renovate: { categories: string[]; uploadLimit: number; generationLimit: number; safetyDisclaimer: string; quotationPrerequisite: string };
  professionals: { requiredDocuments: string[]; credentialExpiryWarningDays: number; maximumActiveRequests: number };
  quotations: { defaultValidityDays: number; allowedCurrencies: string[]; requiredInclusionFields: string[]; requiredExclusionFields: string[] };
  files: { supportedTypes: string[]; maxFileSizeMb: number; retentionLabel: string };
  notifications: { reminderTimingHours: number; escalationTimingHours: number };
  privacy: { retentionLabel: string; accessReasons: PrivilegedAccessReason[]; exportRule: string };
  demoMode: boolean;
  featureFlags: Record<string, boolean>;
}

export interface AdminNotificationItem {
  id: string;
  recipientAccountId?: string;
  type: string;
  title: string;
  description: string;
  href: string;
  createdAt: string;
  read: boolean;
}

export interface AdminState {
  version: number;
  seeded: boolean;
  roleAssignments: AdminRoleAssignment[];
  users: Record<string, AdminUserRecord>;
  listingModeration: Record<string, ListingModerationRecord>;
  verificationHistory: VerificationHistoryEntry[];
  applicationAssignments: Record<string, string>;
  projectFlags: Record<string, ProjectAdminFlag>;
  privilegedAccessLog: PrivilegedAccessLogEntry[];
  supportCases: SupportCase[];
  disputes: Dispute[];
  aiGenerations: AiGenerationRecord[];
  aiFeatureFlags: AiFeatureFlags;
  contentItems: ContentItem[];
  auditLog: AuditLogEntry[];
  settings: PlatformSettings;
  notifications: AdminNotificationItem[];
}
