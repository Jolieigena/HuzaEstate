// Typed data model for the HuzaEstate Build module.
// This is a frontend prototype: everything here is persisted to localStorage
// (see storage.ts) rather than a real backend. Interfaces are kept close to
// what a real API would return so the mock services can be swapped later.

export type BuildProjectStatus =
  | "draft"
  | "brief_in_progress"
  | "ready_to_generate"
  | "generating"
  | "concepts_ready"
  | "refinement_in_progress"
  | "awaiting_professional_review"
  | "professionally_reviewed"
  | "archived";

export const PROJECT_STATUS_LABELS: Record<BuildProjectStatus, string> = {
  draft: "Draft",
  brief_in_progress: "Brief in progress",
  ready_to_generate: "Ready to generate",
  generating: "Generating",
  concepts_ready: "Concepts ready",
  refinement_in_progress: "Refinement in progress",
  awaiting_professional_review: "Awaiting professional review",
  professionally_reviewed: "Professionally reviewed",
  archived: "Archived",
};

export type CreationMode = "ai" | "manual" | "template";

export const CREATION_MODE_LABELS: Record<CreationMode, string> = {
  ai: "Design with Huza AI",
  manual: "Design manually",
  template: "Started from a template",
};

export type Currency = "RWF" | "USD";

export type PropertyUse = "primary_residence" | "rental_property" | "holiday_home" | "mixed_residential";

export const PROPERTY_USE_LABELS: Record<PropertyUse, string> = {
  primary_residence: "Primary residence",
  rental_property: "Rental property",
  holiday_home: "Holiday home",
  mixed_residential: "Mixed residential use",
};

export type PlotShape = "rectangular" | "square" | "irregular" | "unknown";
export type PlotSlope = "flat" | "gentle" | "moderate" | "steep" | "unknown";

export type FileCategory =
  | "plot_document"
  | "inspiration"
  | "design_brief"
  | "concept_image"
  | "floor_plan_concept"
  | "budget_summary"
  | "professional_review"
  | "export"
  | "other";

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  plot_document: "Plot documents",
  inspiration: "Inspiration",
  design_brief: "Design briefs",
  concept_image: "Concept images",
  floor_plan_concept: "Floor-plan concepts",
  budget_summary: "Budget summaries",
  professional_review: "Professional reviews",
  export: "Exports",
  other: "Other",
};

export type FileUploadStatus = "uploaded" | "uploading" | "failed";

export interface UploadedFile {
  id: string;
  name: string;
  fileType: string; // pdf, png, jpg, jpeg, webp
  size: number; // bytes
  category: FileCategory;
  /** Object URL (session-scoped) or data URL used as a safe local preview only. */
  previewUrl?: string;
  status: FileUploadStatus;
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
  relatedVersion?: string;
}

export interface PlotCoordinates {
  lat: number;
  lng: number;
}

export interface PlotInfo {
  address: string;
  coordinates: PlotCoordinates | null;
  shape: PlotShape;
  widthM: number | null;
  lengthM: number | null;
  areaSqm: number | null;
  orientation: string;
  slope: PlotSlope;
  accessRoad: string;
  existingStructures: string;
  utilityAccess: string[];
  notes: string;
  files: UploadedFile[];
}

export type RoomKey =
  | "bedrooms"
  | "bathrooms"
  | "ensuite"
  | "living_rooms"
  | "dining_spaces"
  | "guest_room"
  | "home_office"
  | "staff_quarters"
  | "laundry"
  | "pantry"
  | "storage"
  | "balcony"
  | "terrace"
  | "garden"
  | "courtyard"
  | "play_area"
  | "prayer_room"
  | "gym"
  | "entertainment_room";

export const ROOM_LABELS: Record<RoomKey, string> = {
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  ensuite: "En-suite rooms",
  living_rooms: "Living rooms",
  dining_spaces: "Dining spaces",
  guest_room: "Guest room",
  home_office: "Home office",
  staff_quarters: "Staff quarters",
  laundry: "Laundry",
  pantry: "Pantry",
  storage: "Storage",
  balcony: "Balcony",
  terrace: "Terrace",
  garden: "Garden",
  courtyard: "Courtyard",
  play_area: "Children's play area",
  prayer_room: "Prayer / meditation room",
  gym: "Gym",
  entertainment_room: "Entertainment room",
};

export type KitchenType = "open_plan" | "closed" | "galley" | "island";
export type PrivacyLevel = "public" | "semi_private" | "private";

export interface RoomRequirement {
  key: RoomKey | string;
  label: string;
  quantity: number;
  preferredSizeSqm?: number;
  floorPreference?: string;
  privacy?: PrivacyLevel;
  notes?: string;
  adjacency?: string;
  isCustom?: boolean;
}

export interface HouseholdBrief {
  floors: number;
  kitchenType: KitchenType;
  parkingSpaces: number;
  rooms: RoomRequirement[];
}

export type HomeStyle =
  | "contemporary"
  | "modern_tropical"
  | "contemporary_african"
  | "minimalist"
  | "traditional"
  | "mediterranean"
  | "industrial"
  | "luxury_modern"
  | "affordable_modern"
  | "custom";

export const HOME_STYLE_LABELS: Record<HomeStyle, string> = {
  contemporary: "Contemporary",
  modern_tropical: "Modern tropical",
  contemporary_african: "Contemporary African",
  minimalist: "Minimalist",
  traditional: "Traditional",
  mediterranean: "Mediterranean",
  industrial: "Industrial",
  luxury_modern: "Luxury modern",
  affordable_modern: "Affordable modern",
  custom: "Custom",
};

export interface StyleBrief {
  primaryStyle: HomeStyle | null;
  secondaryStyles: HomeStyle[];
  roofStyle: string;
  exteriorColours: string;
  interiorColours: string;
  windowStyle: string;
  naturalLightPriority: PrivacyLevel | "high" | "medium" | "low";
  privacyPriority: "high" | "medium" | "low";
  layoutPreference: "open_plan" | "separated" | "mixed";
  indoorOutdoorConnection: "high" | "medium" | "low";
  preferredMaterials: string;
  materialsToAvoid: string;
  inspirationImageIds: string[];
  inspirationFiles: UploadedFile[];
}

export type FinishLevel = "essential" | "standard" | "premium" | "luxury";

export const FINISH_LEVEL_LABELS: Record<FinishLevel, string> = {
  essential: "Essential",
  standard: "Standard",
  premium: "Premium",
  luxury: "Luxury",
};

export interface BudgetBrief {
  currency: Currency;
  minBudget: number | null;
  targetBudget: number | null;
  maxBudget: number | null;
  flexibility: "fixed" | "some_flexibility" | "flexible";
  finishLevel: FinishLevel;
  expectedDesignCompletion: string;
  expectedConstructionStart: string;
  preferredConstructionDuration: string;
  professionalFeesIncluded: boolean;
  furnitureIncluded: boolean;
  landscapingIncluded: boolean;
}

export type PriorityLevel = "required" | "preferred" | "optional";

export interface PreferenceItem {
  key: string;
  label: string;
  priority: PriorityLevel | null;
}

export interface SustainabilityBrief {
  items: PreferenceItem[];
}

export interface AccessibilityBrief {
  items: PreferenceItem[];
}

export interface ProjectBasics {
  countryValue: string;
  provinceOrCity: string;
  district: string;
  neighbourhood: string;
  propertyUse: PropertyUse | null;
  occupants: number | null;
  constructionStartPeriod: string;
}

export const BRIEF_STEP_KEYS = [
  "basics",
  "plot",
  "household",
  "style",
  "budget",
  "sustainability",
  "review",
] as const;
export type BriefStepKey = (typeof BRIEF_STEP_KEYS)[number];

export interface DesignBrief {
  basics: ProjectBasics;
  plot: PlotInfo;
  household: HouseholdBrief;
  style: StyleBrief;
  budget: BudgetBrief;
  sustainability: SustainabilityBrief;
  accessibility: AccessibilityBrief;
  completedSteps: BriefStepKey[];
  disclaimerAccepted: boolean;
}

export type RequirementFieldStatus = "confirmed" | "suggested" | "missing" | "conflicting";

export interface ExtractedRequirement {
  id: string;
  field: string;
  label: string;
  value: string;
  status: RequirementFieldStatus;
}

export interface AgentAttachment {
  id: string;
  name: string;
  kind: "image" | "plot_plan" | "sketch";
  previewUrl?: string;
}

export interface AgentMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
  attachments?: AgentAttachment[];
  extracted?: ExtractedRequirement[];
  failed?: boolean;
}

export interface AgentConversation {
  messages: AgentMessage[];
  extractedRequirements: ExtractedRequirement[];
}

export type ManualRoomType =
  | "living_room"
  | "dining_room"
  | "kitchen"
  | "bedroom"
  | "bathroom"
  | "home_office"
  | "laundry"
  | "storage"
  | "pantry"
  | "garage"
  | "balcony"
  | "terrace"
  | "hallway"
  | "staircase"
  | "custom";

export const MANUAL_ROOM_TYPE_LABELS: Record<ManualRoomType, string> = {
  living_room: "Living room",
  dining_room: "Dining room",
  kitchen: "Kitchen",
  bedroom: "Bedroom",
  bathroom: "Bathroom",
  home_office: "Home office",
  laundry: "Laundry",
  storage: "Storage",
  pantry: "Pantry",
  garage: "Garage",
  balcony: "Balcony",
  terrace: "Terrace",
  hallway: "Hallway",
  staircase: "Staircase",
  custom: "Custom room",
};

export interface ManualRoom {
  id: string;
  type: ManualRoomType;
  name: string;
  x: number; // grid units
  y: number;
  w: number;
  h: number;
  notes?: string;
}

export interface ManualFloor {
  id: string;
  name: string;
  level: number;
  rooms: ManualRoom[];
}

export interface ManualDesign {
  floors: ManualFloor[];
  templateId?: string;
}

export interface ConceptMetrics {
  floorAreaSqm: number;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  budgetLowRwf: number;
  budgetHighRwf: number;
  sustainabilityScore: number; // 0-100
  efficiencyScore: number; // 0-100
}

export type ConceptDirection = "efficient" | "balanced" | "spacious";

export const CONCEPT_DIRECTION_LABELS: Record<ConceptDirection, string> = {
  efficient: "Efficient",
  balanced: "Balanced",
  spacious: "Spacious",
};

export interface ExteriorViews {
  front: string;
  rear: string;
  left: string;
  right: string;
  day: string;
  evening: string;
}

export interface InteriorDirection {
  room: string;
  image: string;
  note: string;
}

export interface DesignDecisions {
  grouping: string;
  privacy: string;
  naturalLight: string;
  plotResponse: string;
  budgetResponse: string;
  futureExpansion: string;
}

export interface ConceptRisks {
  missingSiteInfo: string[];
  planningAssumptions: string[];
  structuralAssumptions: string[];
  budgetAssumptions: string[];
  needsProfessionalValidation: string[];
}

export interface Concept {
  id: string;
  direction: ConceptDirection;
  name: string;
  rationale: string;
  previewImage: string;
  metrics: ConceptMetrics;
  advantages: string[];
  compromises: string[];
  generatedAt: string;
  version: number;
  floors: ManualFloor[];
  exteriorViews: ExteriorViews;
  interiorDirections: InteriorDirection[];
  decisions: DesignDecisions;
  risks: ConceptRisks;
}

export type VersionSource = "ai_generation" | "ai_refinement" | "manual_edit" | "template" | "professional_revision";

export const VERSION_SOURCE_LABELS: Record<VersionSource, string> = {
  ai_generation: "AI generation",
  ai_refinement: "AI refinement",
  manual_edit: "Manual edit",
  template: "Template",
  professional_revision: "Professional revision",
};

export interface ProjectVersion {
  id: string;
  number: number;
  createdAt: string;
  createdBy: string;
  source: VersionSource;
  changeSummary: string;
  conceptId?: string;
  manualDesign?: ManualDesign;
  selected: boolean;
}

export interface BudgetCategoryAmount {
  key: string;
  label: string;
  amount: number;
}

export interface BudgetEstimate {
  low: number;
  target: number;
  high: number;
  costPerSqm: number;
  totalAreaSqm: number;
  finishLevel: FinishLevel;
  locationAssumption: string;
  contingencyPct: number;
  includeLandscaping: boolean;
  includeFurniture: boolean;
  includeProfessionalFees: boolean;
  categories: BudgetCategoryAmount[];
  lastCalculated: string;
  estimateType: "ai_indicative" | "professional_estimate" | "contractor_quotation";
}

export type ReviewType =
  | "architectural"
  | "structural"
  | "quantity_surveying"
  | "electrical"
  | "plumbing_mechanical"
  | "sustainability"
  | "accessibility"
  | "permit_readiness";

export const REVIEW_TYPE_LABELS: Record<ReviewType, string> = {
  architectural: "Architectural review",
  structural: "Structural review",
  quantity_surveying: "Quantity surveying",
  electrical: "Electrical review",
  plumbing_mechanical: "Plumbing and mechanical review",
  sustainability: "Sustainability review",
  accessibility: "Accessibility review",
  permit_readiness: "Permit-readiness review",
};

export type ReviewStatus = "draft" | "submitted" | "viewed" | "clarification_requested" | "accepted" | "in_review" | "changes_requested" | "resubmitted" | "completed" | "declined" | "cancelled";

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  viewed: "Viewed",
  clarification_requested: "Clarification Requested",
  accepted: "Accepted",
  in_review: "In Review",
  changes_requested: "Changes Requested",
  resubmitted: "Resubmitted",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
};

export interface DemoProfessional {
  id: string;
  name: string;
  profession: string;
  location: string;
  verified: boolean;
  rating: number;
  completedReviews: number;
  estimatedResponseTime: string;
  avatar?: string;
}

export type FeedbackSeverity = "info" | "recommendation" | "issue" | "critical";

export interface ProfessionalFeedback {
  id: string;
  authorName: string;
  authorProfession: string;
  createdAt: string;
  comment: string;
  severity: FeedbackSeverity;
  relatedFloor?: string;
  relatedDocumentId?: string;
  addressed: boolean;
  reply?: string;
  title?: string;
  category?: string;
  recommendation?: string;
  customerActionRequired?: boolean;
}

export interface ProfessionalReviewRequest {
  id: string;
  type: ReviewType;
  professional: DemoProfessional | null;
  versionId: string | null;
  attachedDocumentIds: string[];
  notes: string;
  status: ReviewStatus;
  submittedAt: string;
  estimatedResponseTime: string;
  feedback: ProfessionalFeedback[];
  expectedResponseDate?: string;
  outcome?: string;
  customerVisibleSummary?: string;
}

export type ProjectDocumentStatus = "active" | "archived";

export interface ProjectDocument {
  id: string;
  name: string;
  category: FileCategory;
  fileType: string;
  size: number;
  date: string;
  relatedVersion?: string;
  uploadedBy: string;
  status: ProjectDocumentStatus;
  previewUrl?: string;
  generated?: boolean;
  attachedTo?: { kind: "brief" | "concept" | "review"; label: string }[];
}

export type ActivityCategory = "design" | "budget" | "documents" | "professional_review" | "system";

export type ActivityEventType =
  | "project_created"
  | "brief_updated"
  | "file_uploaded"
  | "ai_conversation_updated"
  | "concept_generation_started"
  | "concepts_generated"
  | "concept_selected"
  | "refinement_requested"
  | "version_created"
  | "budget_recalculated"
  | "review_requested"
  | "professional_commented"
  | "document_downloaded"
  | "project_renamed"
  | "project_archived"
  | "project_duplicated"
  | "generation_failed"
  | "generation_cancelled";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  category: ActivityCategory;
  actor: string;
  timestamp: string;
  relatedItem?: string;
  details?: string;
  link?: string;
}

export type GenerationStageKey =
  | "reviewing_plot"
  | "organising_requirements"
  | "exploring_layouts"
  | "preparing_exteriors"
  | "estimating_areas"
  | "preparing_results";

export const GENERATION_STAGES: { key: GenerationStageKey; label: string; helper: string }[] = [
  { key: "reviewing_plot", label: "Reviewing plot information", helper: "Checking your plot size, shape and orientation." },
  { key: "organising_requirements", label: "Organising space requirements", helper: "Grouping the rooms and spaces you asked for." },
  { key: "exploring_layouts", label: "Exploring layout directions", helper: "Trying efficient, balanced and spacious layouts." },
  { key: "preparing_exteriors", label: "Preparing exterior concepts", helper: "Matching exterior directions to your preferred style." },
  { key: "estimating_areas", label: "Estimating floor areas", helper: "Calculating approximate floor areas for each direction." },
  { key: "preparing_results", label: "Preparing comparison results", helper: "Putting together your three concepts for review." },
];

export type GenerationStatus = "idle" | "in_progress" | "completed" | "failed" | "cancelled";

export interface GenerationState {
  status: GenerationStatus;
  currentStageIndex: number;
  startedAt?: string;
  completedStageKeys: GenerationStageKey[];
}

export interface BuildProject {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: BuildProjectStatus;
  creationMode: CreationMode;
  templateId?: string;

  country: string;

  brief: DesignBrief;

  agentConversation: AgentConversation;
  manualDesign: ManualDesign;

  concepts: Concept[];
  selectedConceptId: string | null;

  versions: ProjectVersion[];

  budget: BudgetEstimate | null;

  reviewRequests: ProfessionalReviewRequest[];

  documents: ProjectDocument[];

  activity: ActivityEvent[];

  generation: GenerationState;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  creationMode: CreationMode;
  templateId?: string;
}
