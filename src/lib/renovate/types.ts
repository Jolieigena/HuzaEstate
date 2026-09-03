// Typed data model for the HuzaEstate Renovate module.
// This is a frontend prototype: everything here is persisted to localStorage
// (see storage.ts) rather than a real backend. Interfaces are kept close to
// what a real API would return so the mock services can be swapped later.

export type RenovationProjectStatus =
  | "draft"
  | "property_setup"
  | "assessment_in_progress"
  | "ready_to_generate"
  | "generating"
  | "concepts_ready"
  | "refinement_in_progress"
  | "scope_ready"
  | "awaiting_professional_review"
  | "awaiting_quotations"
  | "quotation_received"
  | "ready_for_execution"
  | "archived";

export const RENOVATION_STATUS_LABELS: Record<RenovationProjectStatus, string> = {
  draft: "Draft",
  property_setup: "Property setup",
  assessment_in_progress: "Assessment in progress",
  ready_to_generate: "Ready to generate",
  generating: "Generating",
  concepts_ready: "Concepts ready",
  refinement_in_progress: "Refinement in progress",
  scope_ready: "Scope ready",
  awaiting_professional_review: "Awaiting professional review",
  awaiting_quotations: "Awaiting quotations",
  quotation_received: "Quotation received",
  ready_for_execution: "Ready for execution",
  archived: "Archived",
};

export type RenovationCreationMode = "ai" | "manual" | "inspiration";

export const CREATION_MODE_LABELS: Record<RenovationCreationMode, string> = {
  ai: "Renovate with Huza AI",
  manual: "Plan manually",
  inspiration: "Start from inspiration",
};

export type Currency = "RWF" | "USD";

// ---------------------------------------------------------------------------
// Property
// ---------------------------------------------------------------------------

export type PropertyType =
  | "detached_house"
  | "semi_detached_house"
  | "townhouse"
  | "apartment"
  | "villa"
  | "commercial_unit"
  | "mixed_use"
  | "other";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  detached_house: "Detached house",
  semi_detached_house: "Semi-detached house",
  townhouse: "Townhouse",
  apartment: "Apartment",
  villa: "Villa",
  commercial_unit: "Commercial unit",
  mixed_use: "Mixed-use property",
  other: "Other",
};

export type OwnershipStatus = "owner" | "authorised_representative" | "renting_with_permission" | "unconfirmed";

export const OWNERSHIP_STATUS_LABELS: Record<OwnershipStatus, string> = {
  owner: "I own this property",
  authorised_representative: "I am an authorised representative",
  renting_with_permission: "I am renting and have permission",
  unconfirmed: "Ownership or permission not yet confirmed",
};

export type OccupancyStatus = "occupied" | "vacant" | "partially_occupied";

export const OCCUPANCY_STATUS_LABELS: Record<OccupancyStatus, string> = {
  occupied: "Occupied",
  vacant: "Vacant",
  partially_occupied: "Partially occupied",
};

export type PropertySource = "owned" | "registered" | "inspiration_only" | null;

export interface PropertyCoordinates {
  lat: number;
  lng: number;
}

export interface RenovationPropertyInfo {
  source: PropertySource;
  /** Reference to a MyProperty record when source === "owned". */
  myPropertyId?: string;
  /** Reference to a public listing used only as visual inspiration. */
  inspirationListingId?: string;

  name: string;
  imageUrl: string;
  propertyType: PropertyType | null;
  ownershipStatus: OwnershipStatus | null;
  address: string;
  location: string;
  coordinates: PropertyCoordinates | null;
  approxAreaSqm: number | null;
  floors: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  constructionYear: number | null;
  occupancy: OccupancyStatus | null;
  accessInfo: string;
  willBeOccupiedDuringRenovation: boolean | null;
}

// ---------------------------------------------------------------------------
// Renovation areas
// ---------------------------------------------------------------------------

export type RenovationAreaKey =
  | "kitchen"
  | "bathroom"
  | "living_room"
  | "dining_room"
  | "bedroom"
  | "home_office"
  | "hallway"
  | "exterior_facade"
  | "roofing"
  | "balcony"
  | "terrace"
  | "garden"
  | "landscaping"
  | "garage"
  | "extension"
  | "additional_floor"
  | "full_property"
  | "accessibility_improvement"
  | "energy_efficiency"
  | "custom";

export const RENOVATION_AREA_LABELS: Record<RenovationAreaKey, string> = {
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  living_room: "Living room",
  dining_room: "Dining room",
  bedroom: "Bedroom",
  home_office: "Home office",
  hallway: "Hallway",
  exterior_facade: "Exterior / façade",
  roofing: "Roofing",
  balcony: "Balcony",
  terrace: "Terrace",
  garden: "Garden",
  landscaping: "Landscaping",
  garage: "Garage",
  extension: "Extension",
  additional_floor: "Additional floor",
  full_property: "Full property",
  accessibility_improvement: "Accessibility improvement",
  energy_efficiency: "Energy-efficiency upgrade",
  custom: "Custom area",
};

/** Area keys that inherently imply a higher likelihood of structural/safety review. */
export const HIGH_RISK_AREA_KEYS: RenovationAreaKey[] = ["extension", "additional_floor", "roofing", "full_property"];

export type PriorityLevel = "essential" | "high" | "medium" | "optional";

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  essential: "Essential",
  high: "High",
  medium: "Medium",
  optional: "Optional",
};

export interface SelectedRenovationArea {
  id: string;
  areaKey: RenovationAreaKey;
  customLabel?: string;
  currentUse: string;
  approxDimensions: string;
  mainProblem: string;
  desiredOutcome: string;
  priority: PriorityLevel;
  structuralChangesExpected: boolean | "unknown";
  notes: string;
}

// ---------------------------------------------------------------------------
// Existing condition
// ---------------------------------------------------------------------------

export type ConditionRating = "good" | "fair" | "poor" | "requires_inspection" | "unknown";

export const CONDITION_RATING_LABELS: Record<ConditionRating, string> = {
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  requires_inspection: "Requires inspection",
  unknown: "Unknown",
};

export interface ExistingConditionEntry {
  areaId: string;
  conditionRating: ConditionRating;
  wallFinish: string;
  floorMaterial: string;
  ceiling: string;
  windows: string;
  doors: string;
  lighting: string;
  storage: string;
  plumbingCondition: string;
  electricalCondition: string;
  moistureOrWaterDamage: string;
  visibleCracks: string;
  ventilation: string;
  naturalLight: string;
  accessibility: string;
  otherConcerns: string;
}

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------

export type UploadCategory =
  | "room_photo"
  | "exterior_photo"
  | "walkthrough_video"
  | "floor_plan"
  | "sketch"
  | "inspection_report"
  | "measurement_document";

export const UPLOAD_CATEGORY_LABELS: Record<UploadCategory, string> = {
  room_photo: "Room photograph",
  exterior_photo: "Exterior photograph",
  walkthrough_video: "Walkthrough video",
  floor_plan: "Existing floor plan",
  sketch: "Hand-drawn sketch",
  inspection_report: "Inspection report",
  measurement_document: "Measurement document",
};

export type FileUploadStatus = "uploaded" | "uploading" | "failed";

export interface UploadedFile {
  id: string;
  name: string;
  fileType: string; // jpg, jpeg, png, webp, mp4, mov, pdf
  size: number; // bytes
  category: UploadCategory;
  relatedAreaId?: string;
  /** Object URL (session-scoped) or data URL used as a safe local preview only. */
  previewUrl?: string;
  status: FileUploadStatus;
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
}

export interface ProjectUploads {
  photos: UploadedFile[];
  videos: UploadedFile[];
  floorPlans: UploadedFile[];
  inspiration: UploadedFile[];
}

// ---------------------------------------------------------------------------
// Keep, remove, change
// ---------------------------------------------------------------------------

export type KeepRemoveChangeListType = "keep" | "remove" | "change";

export interface KeepRemoveChangeItem {
  id: string;
  areaId: string;
  listType: KeepRemoveChangeListType;
  item: string;
  instruction: string;
  priority: PriorityLevel;
  notes: string;
  referenceImageId?: string;
}

// ---------------------------------------------------------------------------
// Style and inspiration
// ---------------------------------------------------------------------------

export type RenovationStyle =
  | "warm_contemporary"
  | "modern"
  | "contemporary_african"
  | "minimalist"
  | "scandinavian"
  | "industrial"
  | "luxury"
  | "traditional"
  | "rustic"
  | "tropical"
  | "affordable_modern"
  | "custom";

export const RENOVATION_STYLE_LABELS: Record<RenovationStyle, string> = {
  warm_contemporary: "Warm contemporary",
  modern: "Modern",
  contemporary_african: "Contemporary African",
  minimalist: "Minimalist",
  scandinavian: "Scandinavian",
  industrial: "Industrial",
  luxury: "Luxury",
  traditional: "Traditional",
  rustic: "Rustic",
  tropical: "Tropical",
  affordable_modern: "Affordable modern",
  custom: "Custom",
};

export interface StylePreferences {
  primaryStyle: RenovationStyle | null;
  secondaryStyles: RenovationStyle[];
  preferredColours: string;
  coloursToAvoid: string;
  materialsToUse: string;
  materialsToAvoid: string;
  lightingPreference: string;
  furniturePreference: string;
  storagePreference: string;
  maintenancePreference: string;
  localMaterialPreference: boolean;
  inspirationFileIds: string[];
}

// ---------------------------------------------------------------------------
// Budget and timeline
// ---------------------------------------------------------------------------

export type FinishLevel = "essential" | "standard" | "premium" | "luxury";

export const FINISH_LEVEL_LABELS: Record<FinishLevel, string> = {
  essential: "Essential",
  standard: "Standard",
  premium: "Premium",
  luxury: "Luxury",
};

export type BudgetFlexibility = "fixed" | "some_flexibility" | "flexible";

export interface BudgetTimelinePreferences {
  currency: Currency;
  minBudget: number | null;
  targetBudget: number | null;
  maxBudget: number | null;
  flexibility: BudgetFlexibility;
  desiredStartDate: string;
  requiredCompletionDate: string;
  propertyRemainsOccupied: boolean | null;
  workHourRestrictions: string;
  finishLevel: FinishLevel;
  furnitureIncluded: boolean;
  appliancesIncluded: boolean;
  professionalFeesIncluded: boolean;
  contingencyPreference: "standard" | "higher" | "minimal";
}

// ---------------------------------------------------------------------------
// Safety and constraints
// ---------------------------------------------------------------------------

export type SafetyConcernKey =
  | "structural_walls"
  | "foundations"
  | "roof_structure"
  | "additional_floor"
  | "electrical_rewiring"
  | "major_plumbing"
  | "gas"
  | "asbestos_hazardous_material"
  | "moisture_damage"
  | "fire_damage"
  | "unstable_surfaces"
  | "building_extension"
  | "shared_apartment_infrastructure"
  | "permit_controlled_work";

export const SAFETY_CONCERN_LABELS: Record<SafetyConcernKey, string> = {
  structural_walls: "Structural walls",
  foundations: "Foundations",
  roof_structure: "Roof structure",
  additional_floor: "Additional floor",
  electrical_rewiring: "Electrical rewiring",
  major_plumbing: "Major plumbing",
  gas: "Gas",
  asbestos_hazardous_material: "Asbestos or hazardous material",
  moisture_damage: "Moisture damage",
  fire_damage: "Fire damage",
  unstable_surfaces: "Unstable surfaces",
  building_extension: "Building extension",
  shared_apartment_infrastructure: "Shared apartment infrastructure",
  permit_controlled_work: "Permit-controlled work",
};

export type SafetyAnswer = "yes" | "no" | "unknown";

export interface SafetyAssessment {
  concerns: Partial<Record<SafetyConcernKey, SafetyAnswer>>;
  buildingManagementRestrictions: string;
  neighbourhoodRestrictions: string;
  accessConstraints: string;
  workingHourRestrictions: string;
  wasteRemovalConstraints: string;
  knownPermitRequirements: string;
  otherConcerns: string;
}

// ---------------------------------------------------------------------------
// Assessment (the 8-step wizard)
// ---------------------------------------------------------------------------

export const ASSESSMENT_STEP_KEYS = [
  "property",
  "areas",
  "condition",
  "keep_remove_change",
  "style",
  "budget_timeline",
  "safety",
  "review",
] as const;
export type AssessmentStepKey = (typeof ASSESSMENT_STEP_KEYS)[number];

export const ASSESSMENT_STEP_LABELS: Record<AssessmentStepKey, string> = {
  property: "Property",
  areas: "Renovation areas",
  condition: "Existing condition",
  keep_remove_change: "Keep, remove and change",
  style: "Style and inspiration",
  budget_timeline: "Budget and timeline",
  safety: "Safety and constraints",
  review: "Review brief",
};

export interface RenovationAssessment {
  areas: SelectedRenovationArea[];
  conditions: ExistingConditionEntry[];
  keepRemoveChange: KeepRemoveChangeItem[];
  style: StylePreferences;
  budgetTimeline: BudgetTimelinePreferences;
  safety: SafetyAssessment;
  occupiedDuringRenovation: boolean | null;
  completedSteps: AssessmentStepKey[];
  disclaimerAccepted: boolean;
}

/** A lightweight, human-readable rollup of the assessment used to seed AI + concept generation. */
export interface RenovationBrief {
  confirmed: boolean;
  confirmedAt: string | null;
  summary: string;
  missingInformation: string[];
}

// ---------------------------------------------------------------------------
// Huza AI agent
// ---------------------------------------------------------------------------

export type RequirementFieldStatus = "confirmed" | "suggested" | "missing" | "conflicting" | "requires_professional_review";

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
  kind: "photo" | "floor_plan" | "inspiration";
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

export interface ExistingSpaceAnalysis {
  fileId: string;
  roomTypeDetected: string;
  visibleFinishes: string[];
  lightingCondition: string;
  visibleStorage: string;
  potentialConcerns: string[];
  uncertainObservations: string[];
}

// ---------------------------------------------------------------------------
// Concepts
// ---------------------------------------------------------------------------

export type ConceptDirection = "essential_refresh" | "balanced_transformation" | "premium_reconfiguration";

export const CONCEPT_DIRECTION_LABELS: Record<ConceptDirection, string> = {
  essential_refresh: "Essential Refresh",
  balanced_transformation: "Balanced Transformation",
  premium_reconfiguration: "Premium Reconfiguration",
};

export type DisruptionLevel = "low" | "medium" | "high";

export const DISRUPTION_LEVEL_LABELS: Record<DisruptionLevel, string> = {
  low: "Low disruption",
  medium: "Medium disruption",
  high: "High disruption",
};

export interface ConceptAreaView {
  areaKey: RenovationAreaKey;
  label: string;
  beforeImage: string;
  afterImage: string;
}

export interface RenovationConcept {
  id: string;
  direction: ConceptDirection;
  name: string;
  rationale: string;
  version: number;
  generatedAt: string;
  areasIncluded: RenovationAreaKey[];
  itemsPreserved: string[];
  beforeImage: string;
  afterImage: string;
  areaViews: ConceptAreaView[];
  estimatedCostLowRwf: number;
  estimatedCostHighRwf: number;
  estimatedDurationWeeks: number;
  disruptionLevel: DisruptionLevel;
  sustainabilityScore: number; // 0-100, reflects material reuse
  mainAdvantages: string[];
  mainCompromises: string[];
  safetyFlags: string[];
  whatRemains: string[];
  whatChanges: string[];
  whatIsRemoved: string[];
  suggestedMaterials: string[];
  suggestedColours: string[];
  lightingDirection: string;
  storageStrategy: string;
  furnitureDirection: string;
  sustainabilityConsiderations: string;
  assumptions: string[];
  risks: string[];
  professionalReviewRequired: boolean;
}

export interface TargetedEdit {
  id: string;
  conceptId: string;
  areaKey: RenovationAreaKey;
  selectionDescription: string;
  requestedChange: string;
  elementsToPreserve: string[];
  possibleCostEffect: string;
  possibleScopeEffect: string;
  resultingVersionId: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Manual planner
// ---------------------------------------------------------------------------

export const MATERIAL_CATEGORIES = [
  "wall_paint",
  "wall_covering",
  "flooring",
  "tiles",
  "wood",
  "stone",
  "roofing",
  "cabinetry",
  "countertop",
  "fixtures",
  "lighting",
  "doors",
  "windows",
  "exterior_finish",
  "landscaping",
] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  wall_paint: "Wall paint",
  wall_covering: "Wall covering",
  flooring: "Flooring",
  tiles: "Tiles",
  wood: "Wood",
  stone: "Stone",
  roofing: "Roofing",
  cabinetry: "Cabinetry",
  countertop: "Countertop",
  fixtures: "Fixtures",
  lighting: "Lighting",
  doors: "Doors",
  windows: "Windows",
  exterior_finish: "Exterior finish",
  landscaping: "Landscaping",
};

export interface MoodBoardItem {
  id: string;
  label: string;
  imageUrl: string;
  category: MaterialCategory | "furniture" | "reference";
  order: number;
}

export interface ManualDesignArea {
  id: string;
  areaKey: RenovationAreaKey;
  label: string;
  currentImageFileId?: string;
  wallFinish: string;
  floorMaterial: string;
  ceilingTreatment: string;
  lightingDirection: string;
  cabinetFinish: string;
  fixtureStyle: string;
  notes: string;
  keepItems: string[];
  removeItems: string[];
  replaceItems: string[];
  moodBoard: MoodBoardItem[];
}

export interface ManualRenovationDesign {
  areas: ManualDesignArea[];
}

// ---------------------------------------------------------------------------
// Versions
// ---------------------------------------------------------------------------

export type VersionSource = "initial_ai_generation" | "targeted_ai_edit" | "full_ai_refinement" | "manual_change" | "inspiration_template" | "professional_revision";

export const VERSION_SOURCE_LABELS: Record<VersionSource, string> = {
  initial_ai_generation: "Initial AI generation",
  targeted_ai_edit: "Targeted AI edit",
  full_ai_refinement: "Full AI refinement",
  manual_change: "Manual change",
  inspiration_template: "Inspiration template",
  professional_revision: "Professional revision",
};

export interface ProjectVersion {
  id: string;
  number: number;
  createdAt: string;
  createdBy: string;
  source: VersionSource;
  changeSummary: string;
  relatedAreaKey?: RenovationAreaKey;
  conceptId?: string;
  manualDesign?: ManualRenovationDesign;
  selected: boolean;
  professionalReviewStatus?: "not_required" | "pending" | "reviewed";
}

// ---------------------------------------------------------------------------
// Scope of work
// ---------------------------------------------------------------------------

export type ScopeWorkCategory =
  | "demolition"
  | "preparation"
  | "structural"
  | "roofing"
  | "plumbing"
  | "electrical"
  | "walls"
  | "ceiling"
  | "flooring"
  | "doors_windows"
  | "cabinetry"
  | "fixtures"
  | "painting"
  | "furniture"
  | "exterior"
  | "landscaping"
  | "cleaning_handover";

export const SCOPE_WORK_CATEGORY_LABELS: Record<ScopeWorkCategory, string> = {
  demolition: "Demolition",
  preparation: "Preparation",
  structural: "Structural",
  roofing: "Roofing",
  plumbing: "Plumbing",
  electrical: "Electrical",
  walls: "Walls",
  ceiling: "Ceiling",
  flooring: "Flooring",
  doors_windows: "Doors and windows",
  cabinetry: "Cabinetry",
  fixtures: "Fixtures",
  painting: "Painting",
  furniture: "Furniture",
  exterior: "Exterior",
  landscaping: "Landscaping",
  cleaning_handover: "Cleaning and handover",
};

export type ScopeItemStatus = "planned" | "excluded" | "professional_review_required" | "completed";

export const SCOPE_ITEM_STATUS_LABELS: Record<ScopeItemStatus, string> = {
  planned: "Planned",
  excluded: "Excluded",
  professional_review_required: "Professional review required",
  completed: "Completed",
};

export interface ScopeItem {
  id: string;
  areaKey: RenovationAreaKey;
  category: ScopeWorkCategory;
  task: string;
  description: string;
  priority: PriorityLevel;
  sequence: number;
  dependency: string;
  quantity: number | null;
  unit: string;
  responsibility: string;
  professionalRequired: boolean;
  status: ScopeItemStatus;
  notes: string;
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export type TimelinePhaseKey =
  | "assessment_design"
  | "professional_review"
  | "approvals"
  | "procurement"
  | "site_preparation"
  | "demolition"
  | "structural_services"
  | "finishes"
  | "fixtures_furniture"
  | "inspection_handover";

export const TIMELINE_PHASE_LABELS: Record<TimelinePhaseKey, string> = {
  assessment_design: "Assessment and design",
  professional_review: "Professional review",
  approvals: "Approvals where required",
  procurement: "Procurement",
  site_preparation: "Site preparation",
  demolition: "Demolition",
  structural_services: "Structural and services work",
  finishes: "Finishes",
  fixtures_furniture: "Fixtures and furniture",
  inspection_handover: "Inspection and handover",
};

export interface TimelinePhase {
  key: TimelinePhaseKey;
  label: string;
  estimatedDurationWeeks: number;
  dependency: string;
  canRunInParallelWith: TimelinePhaseKey[];
  expectedDisruption: DisruptionLevel;
}

export interface RenovationTimelineEstimate {
  phases: TimelinePhase[];
  currentPhaseKey: TimelinePhaseKey | null;
  totalDurationWeeks: number;
  occupancyWarning: boolean;
  desiredStartDate: string;
  lastCalculated: string;
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

export type BudgetCategoryKey =
  | "design_professional_fees"
  | "assessment_inspection"
  | "demolition"
  | "waste_removal"
  | "structural"
  | "roofing"
  | "electrical"
  | "plumbing"
  | "walls_ceiling"
  | "flooring"
  | "kitchen"
  | "bathrooms"
  | "windows_doors"
  | "fixtures"
  | "lighting"
  | "furniture"
  | "exterior_work"
  | "landscaping"
  | "temporary_accommodation"
  | "contingency";

export const BUDGET_CATEGORY_LABELS: Record<BudgetCategoryKey, string> = {
  design_professional_fees: "Design and professional fees",
  assessment_inspection: "Assessment and inspection",
  demolition: "Demolition",
  waste_removal: "Waste removal",
  structural: "Structural work",
  roofing: "Roofing",
  electrical: "Electrical",
  plumbing: "Plumbing",
  walls_ceiling: "Walls and ceiling",
  flooring: "Flooring",
  kitchen: "Kitchen",
  bathrooms: "Bathrooms",
  windows_doors: "Windows and doors",
  fixtures: "Fixtures",
  lighting: "Lighting",
  furniture: "Furniture",
  exterior_work: "Exterior work",
  landscaping: "Landscaping",
  temporary_accommodation: "Temporary accommodation",
  contingency: "Contingency",
};

export interface BudgetCategoryAmount {
  key: BudgetCategoryKey;
  label: string;
  amount: number;
}

export type EstimateType = "ai_indicative" | "professional_estimate" | "contractor_quotation";

export const ESTIMATE_TYPE_LABELS: Record<EstimateType, string> = {
  ai_indicative: "AI indicative estimate",
  professional_estimate: "Professional estimate",
  contractor_quotation: "Contractor quotation",
};

export interface RenovationBudgetEstimate {
  low: number;
  target: number;
  high: number;
  currency: Currency;
  finishLevel: FinishLevel;
  contingencyPct: number;
  includeFurniture: boolean;
  includeAppliances: boolean;
  includeLandscaping: boolean;
  includeTemporaryAccommodation: boolean;
  includeProfessionalFees: boolean;
  categories: BudgetCategoryAmount[];
  materialsEstimate: number;
  labourEstimate: number;
  professionalFeesEstimate: number;
  contingencyAmount: number;
  estimateType: EstimateType;
  lastCalculated: string;
}

// ---------------------------------------------------------------------------
// Professional review
// ---------------------------------------------------------------------------

export type ReviewType =
  | "interior_design"
  | "architectural_review"
  | "structural_inspection"
  | "electrical_inspection"
  | "plumbing_inspection"
  | "roofing_inspection"
  | "quantity_surveying"
  | "accessibility_review"
  | "sustainability_review"
  | "permit_readiness_review";

export const REVIEW_TYPE_LABELS: Record<ReviewType, string> = {
  interior_design: "Interior design review",
  architectural_review: "Architectural review",
  structural_inspection: "Structural inspection",
  electrical_inspection: "Electrical inspection",
  plumbing_inspection: "Plumbing inspection",
  roofing_inspection: "Roofing inspection",
  quantity_surveying: "Quantity surveying",
  accessibility_review: "Accessibility review",
  sustainability_review: "Sustainability review",
  permit_readiness_review: "Permit-readiness review",
};

export type ReviewStatus = "draft" | "submitted" | "viewed" | "clarification_requested" | "accepted" | "inspection_required" | "in_review" | "changes_requested" | "resubmitted" | "completed" | "declined" | "cancelled";

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  viewed: "Viewed",
  clarification_requested: "Clarification requested",
  accepted: "Accepted",
  inspection_required: "Inspection required",
  in_review: "In review",
  changes_requested: "Changes requested",
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
  completedProjects: number;
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
  areaKey?: RenovationAreaKey;
  severity: FeedbackSeverity;
  recommendation: string;
  relatedImageId?: string;
  relatedScopeItemId?: string;
  inspectionRequired: boolean;
  response?: string;
  addressed: boolean;
  title?: string;
  category?: string;
  customerActionRequired?: boolean;
}

export interface ProfessionalReviewRequest {
  id: string;
  type: ReviewType;
  areasRequiringReview: RenovationAreaKey[];
  projectVersionId: string | null;
  documentIds: string[];
  questions: string;
  professional: DemoProfessional | null;
  status: ReviewStatus;
  submittedAt: string;
  estimatedResponseTime: string;
  feedback: ProfessionalFeedback[];
  expectedResponseDate?: string;
  outcome?: string;
  customerVisibleSummary?: string;
}

// ---------------------------------------------------------------------------
// Contractor quotations
// ---------------------------------------------------------------------------

export interface DemoContractor {
  id: string;
  companyName: string;
  location: string;
  services: string[];
  verified: boolean;
  rating: number;
  completedProjects: number;
  estimatedResponseTime: string;
  avatar?: string;
}

export interface QuotationRequest {
  id: string;
  scopeItemIds: string[];
  includedAreaKeys: RenovationAreaKey[];
  documentIds: string[];
  preferredStartPeriod: string;
  propertyOccupied: boolean | null;
  contractorIds: string[];
  notes: string;
  requestedAt: string;
}

export type QuotationStatus = "draft" | "requested" | "viewed" | "clarification_requested" | "preparing_quotation" | "submitted" | "revised" | "accepted" | "declined" | "expired" | "withdrawn";

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: "Draft",
  requested: "Requested",
  viewed: "Viewed",
  clarification_requested: "Clarification requested",
  preparing_quotation: "Preparing quotation",
  submitted: "Submitted",
  revised: "Revised",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  withdrawn: "Withdrawn",
};

export interface QuotationLineItem {
  label: string;
  amount: number;
}

export interface ContractorQuotation {
  id: string;
  contractor: DemoContractor;
  status: QuotationStatus;
  quotationDate: string;
  validUntil: string;
  includedScope: string[];
  excludedScope: string[];
  materials: QuotationLineItem[];
  labour: number;
  professionalFees: number;
  taxes: number;
  contingency: number;
  total: number;
  proposedDurationWeeks: number;
  paymentSchedule: string;
  warrantyInfo: string;
  assumptions: string[];
  attachmentDocumentIds: string[];
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export type DocumentCategory =
  | "property_documents"
  | "existing_condition_photographs"
  | "walkthrough_videos"
  | "floor_plans_sketches"
  | "inspiration"
  | "renovation_briefs"
  | "generated_concepts"
  | "scope_of_work"
  | "budget_summaries"
  | "professional_reviews"
  | "contractor_quotations"
  | "exports"
  | "other";

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  property_documents: "Property documents",
  existing_condition_photographs: "Existing-condition photographs",
  walkthrough_videos: "Walkthrough videos",
  floor_plans_sketches: "Floor plans and sketches",
  inspiration: "Inspiration",
  renovation_briefs: "Renovation briefs",
  generated_concepts: "Generated concepts",
  scope_of_work: "Scope of work",
  budget_summaries: "Budget summaries",
  professional_reviews: "Professional reviews",
  contractor_quotations: "Contractor quotations",
  exports: "Exports",
  other: "Other",
};

export type ProjectDocumentStatus = "active" | "archived";

export interface ProjectDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  fileType: string;
  size: number;
  date: string;
  relatedAreaKey?: RenovationAreaKey;
  relatedConceptVersion?: string;
  uploadedBy: string;
  status: ProjectDocumentStatus;
  previewUrl?: string;
  generated?: boolean;
}

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

export type ActivityCategory = "assessment" | "design" | "scope" | "budget" | "professionals" | "quotations" | "documents" | "system";

export type ActivityEventType =
  | "project_created"
  | "property_selected"
  | "assessment_updated"
  | "photograph_uploaded"
  | "brief_confirmed"
  | "ai_conversation_updated"
  | "generation_started"
  | "concepts_created"
  | "concept_selected"
  | "targeted_edit_generated"
  | "version_created"
  | "scope_updated"
  | "budget_recalculated"
  | "review_requested"
  | "professional_responded"
  | "quotations_requested"
  | "quotation_received"
  | "quotation_accepted"
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

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export type GenerationStageKey =
  | "reviewing_property"
  | "organising_requirements"
  | "preserving_elements"
  | "exploring_style_directions"
  | "preparing_before_after"
  | "estimating_scope_cost"
  | "preparing_comparison";

export const GENERATION_STAGES: { key: GenerationStageKey; label: string; helper: string }[] = [
  { key: "reviewing_property", label: "Reviewing existing property information", helper: "Checking property details, condition and uploaded references." },
  { key: "organising_requirements", label: "Organising renovation requirements", helper: "Grouping the areas and changes you asked for." },
  { key: "preserving_elements", label: "Preserving selected elements", helper: "Making sure items you want to keep stay in place." },
  { key: "exploring_style_directions", label: "Exploring style directions", helper: "Matching your preferred style across each area." },
  { key: "preparing_before_after", label: "Preparing before-and-after concepts", helper: "Building visual directions for the areas you selected." },
  { key: "estimating_scope_cost", label: "Estimating scope and cost", helper: "Putting together an indicative scope and budget range." },
  { key: "preparing_comparison", label: "Preparing comparison results", helper: "Finalising your three renovation concepts for review." },
];

export type GenerationStatus = "idle" | "in_progress" | "completed" | "failed" | "cancelled";

export interface GenerationState {
  status: GenerationStatus;
  currentStageIndex: number;
  startedAt?: string;
  completedStageKeys: GenerationStageKey[];
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export interface RenovationProject {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  status: RenovationProjectStatus;
  createdAt: string;
  updatedAt: string;
  creationMode: RenovationCreationMode;

  property: RenovationPropertyInfo;
  assessment: RenovationAssessment;
  uploads: ProjectUploads;
  brief: RenovationBrief;

  agentConversation: AgentConversation;

  concepts: RenovationConcept[];
  selectedConceptId: string | null;
  targetedEdits: TargetedEdit[];
  versions: ProjectVersion[];

  manualDesign: ManualRenovationDesign;

  scope: ScopeItem[];
  scopeGeneratedAt: string | null;
  timeline: RenovationTimelineEstimate | null;
  budget: RenovationBudgetEstimate | null;

  reviewRequests: ProfessionalReviewRequest[];

  quotationRequest: QuotationRequest | null;
  quotations: ContractorQuotation[];

  documents: ProjectDocument[];
  activity: ActivityEvent[];
  generation: GenerationState;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  creationMode: RenovationCreationMode;
}
