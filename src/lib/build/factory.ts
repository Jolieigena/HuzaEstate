import {
  AccessibilityBrief,
  AgentConversation,
  BudgetBrief,
  BuildProject,
  CreateProjectInput,
  DesignBrief,
  GenerationState,
  HouseholdBrief,
  ManualDesign,
  PlotInfo,
  PreferenceItem,
  ProjectBasics,
  StyleBrief,
  SustainabilityBrief,
} from "./types";

export function newId(prefix: string): string {
  const rand = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${rand}`;
}

export const SUSTAINABILITY_OPTIONS: { key: string; label: string }[] = [
  { key: "natural_ventilation", label: "Natural ventilation" },
  { key: "max_daylight", label: "Maximum daylight" },
  { key: "solar_readiness", label: "Solar readiness" },
  { key: "solar_energy", label: "Solar energy" },
  { key: "rainwater_harvesting", label: "Rainwater harvesting" },
  { key: "low_flow_fixtures", label: "Low-flow fixtures" },
  { key: "energy_efficient_lighting", label: "Energy-efficient lighting" },
  { key: "shading_heat_reduction", label: "Shading and heat reduction" },
  { key: "local_materials", label: "Locally available materials" },
  { key: "low_maintenance_landscaping", label: "Low-maintenance landscaping" },
  { key: "waste_management_space", label: "Waste-management space" },
  { key: "future_expansion", label: "Future expansion" },
];

export const ACCESSIBILITY_OPTIONS: { key: string; label: string }[] = [
  { key: "step_free_entrance", label: "Step-free entrance" },
  { key: "wider_doors", label: "Wider doors" },
  { key: "accessible_bathroom", label: "Accessible bathroom" },
  { key: "ground_floor_bedroom", label: "Ground-floor bedroom" },
  { key: "wheelchair_circulation", label: "Wheelchair circulation" },
  { key: "reduced_slip_flooring", label: "Reduced-slip flooring" },
  { key: "handrails", label: "Handrails" },
  { key: "accessible_parking", label: "Accessible parking" },
  { key: "elder_friendly_design", label: "Elder-friendly design" },
  { key: "child_safety", label: "Child-safety considerations" },
];

function emptyPreferenceItems(options: { key: string; label: string }[]): PreferenceItem[] {
  return options.map((o) => ({ key: o.key, label: o.label, priority: null }));
}

export function emptyBasics(): ProjectBasics {
  return {
    countryValue: "Rwanda",
    provinceOrCity: "",
    district: "",
    neighbourhood: "",
    propertyUse: null,
    occupants: null,
    constructionStartPeriod: "",
  };
}

export function emptyPlot(): PlotInfo {
  return {
    address: "",
    coordinates: null,
    shape: "unknown",
    widthM: null,
    lengthM: null,
    areaSqm: null,
    orientation: "",
    slope: "unknown",
    accessRoad: "",
    existingStructures: "",
    utilityAccess: [],
    notes: "",
    files: [],
  };
}

export function emptyHousehold(): HouseholdBrief {
  return {
    floors: 1,
    kitchenType: "open_plan",
    parkingSpaces: 1,
    rooms: [],
  };
}

export function emptyStyle(): StyleBrief {
  return {
    primaryStyle: null,
    secondaryStyles: [],
    roofStyle: "",
    exteriorColours: "",
    interiorColours: "",
    windowStyle: "",
    naturalLightPriority: "medium",
    privacyPriority: "medium",
    layoutPreference: "mixed",
    indoorOutdoorConnection: "medium",
    preferredMaterials: "",
    materialsToAvoid: "",
    inspirationImageIds: [],
    inspirationFiles: [],
  };
}

export function emptyBudget(): BudgetBrief {
  return {
    currency: "RWF",
    minBudget: null,
    targetBudget: null,
    maxBudget: null,
    flexibility: "some_flexibility",
    finishLevel: "standard",
    expectedDesignCompletion: "",
    expectedConstructionStart: "",
    preferredConstructionDuration: "",
    professionalFeesIncluded: true,
    furnitureIncluded: false,
    landscapingIncluded: false,
  };
}

export function emptySustainability(): SustainabilityBrief {
  return { items: emptyPreferenceItems(SUSTAINABILITY_OPTIONS) };
}

export function emptyAccessibility(): AccessibilityBrief {
  return { items: emptyPreferenceItems(ACCESSIBILITY_OPTIONS) };
}

export function emptyBrief(): DesignBrief {
  return {
    basics: emptyBasics(),
    plot: emptyPlot(),
    household: emptyHousehold(),
    style: emptyStyle(),
    budget: emptyBudget(),
    sustainability: emptySustainability(),
    accessibility: emptyAccessibility(),
    completedSteps: [],
    disclaimerAccepted: false,
  };
}

export function emptyAgentConversation(): AgentConversation {
  return { messages: [], extractedRequirements: [] };
}

export function emptyManualDesign(): ManualDesign {
  return { floors: [] };
}

export function emptyGenerationState(): GenerationState {
  return { status: "idle", currentStageIndex: -1, completedStageKeys: [] };
}

export function createProject(input: CreateProjectInput, ownerId: string): BuildProject {
  const now = new Date().toISOString();
  const id = newId("project");
  return {
    id,
    ownerId,
    name: input.name.trim() || "Untitled Build Project",
    description: input.description.trim(),
    createdAt: now,
    updatedAt: now,
    status: "draft",
    creationMode: input.creationMode,
    templateId: input.templateId,
    country: "Rwanda",
    brief: emptyBrief(),
    agentConversation: emptyAgentConversation(),
    manualDesign: emptyManualDesign(),
    concepts: [],
    selectedConceptId: null,
    versions: [],
    budget: null,
    reviewRequests: [],
    documents: [],
    activity: [
      {
        id: newId("activity"),
        type: "project_created",
        category: "system",
        actor: "You",
        timestamp: now,
        details: `Project created using "${input.creationMode === "ai" ? "Design with Huza AI" : input.creationMode === "manual" ? "Design manually" : "Start from a template"}".`,
      },
    ],
    generation: emptyGenerationState(),
  };
}
