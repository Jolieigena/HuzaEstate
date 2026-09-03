import {
  AgentConversation,
  BudgetTimelinePreferences,
  CreateProjectInput,
  GenerationState,
  ManualRenovationDesign,
  RenovationAssessment,
  RenovationBrief,
  RenovationProject,
  RenovationPropertyInfo,
  ProjectUploads,
  SafetyAssessment,
  StylePreferences,
} from "./types";

export function newId(prefix: string): string {
  const rand = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${rand}`;
}

export function emptyProperty(): RenovationPropertyInfo {
  return {
    source: null,
    name: "",
    imageUrl: "",
    propertyType: null,
    ownershipStatus: null,
    address: "",
    location: "",
    coordinates: null,
    approxAreaSqm: null,
    floors: null,
    bedrooms: null,
    bathrooms: null,
    constructionYear: null,
    occupancy: null,
    accessInfo: "",
    willBeOccupiedDuringRenovation: null,
  };
}

export function emptyStyle(): StylePreferences {
  return {
    primaryStyle: null,
    secondaryStyles: [],
    preferredColours: "",
    coloursToAvoid: "",
    materialsToUse: "",
    materialsToAvoid: "",
    lightingPreference: "",
    furniturePreference: "",
    storagePreference: "",
    maintenancePreference: "",
    localMaterialPreference: true,
    inspirationFileIds: [],
  };
}

export function emptyBudgetTimeline(): BudgetTimelinePreferences {
  return {
    currency: "RWF",
    minBudget: null,
    targetBudget: null,
    maxBudget: null,
    flexibility: "some_flexibility",
    desiredStartDate: "",
    requiredCompletionDate: "",
    propertyRemainsOccupied: null,
    workHourRestrictions: "",
    finishLevel: "standard",
    furnitureIncluded: false,
    appliancesIncluded: false,
    professionalFeesIncluded: true,
    contingencyPreference: "standard",
  };
}

export function emptySafety(): SafetyAssessment {
  return {
    concerns: {},
    buildingManagementRestrictions: "",
    neighbourhoodRestrictions: "",
    accessConstraints: "",
    workingHourRestrictions: "",
    wasteRemovalConstraints: "",
    knownPermitRequirements: "",
    otherConcerns: "",
  };
}

export function emptyAssessment(): RenovationAssessment {
  return {
    areas: [],
    conditions: [],
    keepRemoveChange: [],
    style: emptyStyle(),
    budgetTimeline: emptyBudgetTimeline(),
    safety: emptySafety(),
    occupiedDuringRenovation: null,
    completedSteps: [],
    disclaimerAccepted: false,
  };
}

export function emptyUploads(): ProjectUploads {
  return { photos: [], videos: [], floorPlans: [], inspiration: [] };
}

export function emptyBrief(): RenovationBrief {
  return { confirmed: false, confirmedAt: null, summary: "", missingInformation: [] };
}

export function emptyAgentConversation(): AgentConversation {
  return { messages: [], extractedRequirements: [] };
}

export function emptyManualDesign(): ManualRenovationDesign {
  return { areas: [] };
}

export function emptyGenerationState(): GenerationState {
  return { status: "idle", currentStageIndex: -1, completedStageKeys: [] };
}

export function createProject(input: CreateProjectInput, ownerId: string): RenovationProject {
  const now = new Date().toISOString();
  const id = newId("renov");
  return {
    id,
    ownerId,
    name: input.name.trim() || "Untitled Renovation Project",
    description: input.description.trim(),
    status: "draft",
    createdAt: now,
    updatedAt: now,
    creationMode: input.creationMode,

    property: emptyProperty(),
    assessment: emptyAssessment(),
    uploads: emptyUploads(),
    brief: emptyBrief(),

    agentConversation: emptyAgentConversation(),

    concepts: [],
    selectedConceptId: null,
    targetedEdits: [],
    versions: [],

    manualDesign: emptyManualDesign(),

    scope: [],
    scopeGeneratedAt: null,
    timeline: null,
    budget: null,

    reviewRequests: [],

    quotationRequest: null,
    quotations: [],

    documents: [],
    activity: [
      {
        id: newId("activity"),
        type: "project_created",
        category: "system",
        actor: "You",
        timestamp: now,
        details: `Project created using "${input.creationMode === "ai" ? "Renovate with Huza AI" : input.creationMode === "manual" ? "Plan manually" : "Start from inspiration"}".`,
      },
    ],
    generation: emptyGenerationState(),
  };
}
