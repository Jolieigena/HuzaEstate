export type ProfessionalProfileStatus = "draft" | "submitted" | "under_review" | "more_information_required" | "approved" | "rejected" | "suspended";
export type ProfessionalKind = "individual_professional" | "professional_firm" | "contractor_company" | "individual_specialist_contractor";
export type AvailabilityStatus = "available" | "limited" | "unavailable";
export type RequestSource = "build_review" | "renovate_review" | "renovate_quotation";

export interface ProfessionalServiceOffering {
  id: string;
  name: string;
  description: string;
  deliveryTime: string;
  deliveryMode: "remote" | "onsite" | "both";
  startingPrice?: number;
  priceAfterAssessment: boolean;
  requiredInformation: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  projectType: string;
  location: string;
  year: string;
  description: string;
  services: string;
  imageNames: string[];
  testimonial?: string;
  published: boolean;
}

export interface ProfessionalProfile {
  id: string;
  accountId: string;
  kind: ProfessionalKind;
  status: ProfessionalProfileStatus;
  displayName: string;
  legalName: string;
  businessName?: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  website?: string;
  biography: string;
  yearsExperience: number;
  languages: string[];
  primarySpecialisation: string;
  secondarySpecialisations: string[];
  registrationNumber?: string;
  licensingBody?: string;
  licenceExpiry?: string;
  services: ProfessionalServiceOffering[];
  serviceAreas: string[];
  travelRadiusKm: number;
  remoteAvailable: boolean;
  onsiteAvailable: boolean;
  travelFeeApproach: string;
  workingDays: string[];
  workingHours: string;
  consultationDuration: number;
  minimumNoticeHours: number;
  acceptingNewWork: boolean;
  maximumActiveRequests: number;
  responseTime: string;
  pricingApproaches: string[];
  availability: AvailabilityStatus;
  verificationLabel: string;
  demoVerified: boolean;
  portfolio: PortfolioItem[];
  applicationSubmittedAt?: string;
  lastUpdatedAt: string;
}

export interface StoredFile {
  id: string;
  ownerProfileId: string;
  name: string;
  mimeType: string;
  size: number;
  category: "working" | "review" | "annotation" | "estimate" | "quotation" | "certificate" | "verification" | "portfolio";
  access: "professional_private" | "customer_shared" | "review_submission" | "quotation_submission" | "verification_only";
  createdAt: string;
  submitted: boolean;
}

export interface Clarification {
  id: string;
  requestId: string;
  profileId: string;
  question: string;
  category: string;
  relatedItem?: string;
  blocksWork: boolean;
  requestedResponseDate?: string;
  createdAt: string;
  response?: string;
  respondedAt?: string;
}

export interface Message {
  id: string;
  requestId: string;
  profileId: string;
  sender: "customer" | "professional" | "system";
  text: string;
  createdAt: string;
  read: boolean;
  failed?: boolean;
}

export interface Consultation {
  id: string;
  requestId: string;
  profileId: string;
  type: string;
  startsAt: string;
  durationMinutes: number;
  timezone: string;
  method: string;
  purpose: string;
  preparation: string;
  status: "proposed" | "confirmed" | "cancelled" | "completed";
  notes?: string;
}

export interface Annotation {
  id: string;
  type: "pin" | "rectangle" | "arrow" | "text";
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  severity: "info" | "recommendation" | "important" | "critical";
  published: boolean;
}

export interface ReviewDraft {
  requestId: string;
  checklist: Record<string, boolean>;
  privateNotes: string;
  outcome?: string;
  summary?: string;
  annotations: Annotation[];
  professionalEstimate?: { low: number; expected: number; high: number; contingencyPct: number; exclusions: string[] };
  lockedVersions: { version: number; submittedAt: string; outcome: string; summary: string }[];
}

export interface QuoteLine {
  id: string;
  area: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  materialUnitCost: number;
  labourUnitCost: number;
  otherCost: number;
  taxPct: number;
  optional: boolean;
  notes: string;
}

export interface QuotationDraft {
  quotationId: string;
  lines: QuoteLine[];
  issueDate: string;
  validUntil: string;
  proposedStartDate: string;
  durationWeeks: number;
  currency: "RWF" | "USD";
  discount: number;
  contingencyPct: number;
  taxPct: number;
  inclusions: string[];
  exclusions: string[];
  customerMaterials: string[];
  contractorMaterials: string[];
  assumptions: string[];
  warranty: string;
  paymentSchedule: string[];
  terms: string;
  versions: { version: number; submittedAt: string; total: number; changes: string; validUntil: string; status: string }[];
}

export interface ActivityItem {
  id: string;
  profileId: string;
  category: "requests" | "reviews" | "quotations" | "messages" | "consultations" | "documents" | "profile" | "system";
  type: string;
  description: string;
  createdAt: string;
  href?: string;
}

export interface NotificationItem {
  id: string;
  profileId: string;
  type: string;
  title: string;
  description: string;
  href: string;
  createdAt: string;
  read: boolean;
}

export interface RequestMeta {
  requestId: string;
  source: RequestSource;
  projectId: string;
  assignedProfileId: string;
  customerName: string;
  desiredResponseDate: string;
  viewedAt?: string;
  acceptedAt?: string;
  declineReason?: string;
  internalDeclineNote?: string;
  needsProfessionalAction?: boolean;
}

export interface ProfessionalState {
  version: number;
  profiles: ProfessionalProfile[];
  requestMeta: RequestMeta[];
  clarifications: Clarification[];
  messages: Message[];
  consultations: Consultation[];
  reviewDrafts: ReviewDraft[];
  quotationDrafts: QuotationDraft[];
  files: StoredFile[];
  activity: ActivityItem[];
  notifications: NotificationItem[];
  settings: Record<string, Record<string, boolean | string>>;
  seeded: boolean;
}

export interface ProfessionalRequestView {
  id: string;
  source: RequestSource;
  projectId: string;
  projectName: string;
  projectType: "Build" | "Renovate";
  requestType: string;
  customerName: string;
  location: string;
  sharedVersion: string;
  submittedAt: string;
  desiredResponseDate: string;
  status: string;
  assignedProfileId: string;
  questions: string;
  documentIds: string[];
  safetyFlag: boolean;
  professionalActionRequired: boolean;
  quotationId?: string;
}
