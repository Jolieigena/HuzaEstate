import { newId, emptyAgentConversation, emptyAssessment, emptyManualDesign, emptyGenerationState, emptyUploads } from "./factory";
import { generateAllConcepts } from "./conceptGenerator";
import { calculateRenovationBudget } from "./budget";
import { ActivityEvent, KeepRemoveChangeItem, ProjectVersion, RenovationProject, SelectedRenovationArea } from "./types";

function daysAgoIso(days: number, hours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function activity(type: ActivityEvent["type"], category: ActivityEvent["category"], actor: string, timestamp: string, details?: string, link?: string): ActivityEvent {
  return { id: newId("activity"), type, category, actor, timestamp, details, link };
}

function area(areaKey: SelectedRenovationArea["areaKey"], overrides: Partial<SelectedRenovationArea> = {}): SelectedRenovationArea {
  return {
    id: newId("area"),
    areaKey,
    currentUse: "",
    approxDimensions: "",
    mainProblem: "",
    desiredOutcome: "",
    priority: "medium",
    structuralChangesExpected: false,
    notes: "",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Project 1: Gacuriro Family Home Refresh — concepts_ready
// ---------------------------------------------------------------------------

function gacuriroFamilyHomeRefresh(ownerId: string): RenovationProject {
  const created = daysAgoIso(24);
  const assessmentDone = daysAgoIso(20);
  const generated = daysAgoIso(18);

  const livingRoom = area("living_room", {
    currentUse: "Main family living space",
    approxDimensions: "6m x 5.5m",
    mainProblem: "Dated finishes and poor evening lighting.",
    desiredOutcome: "A brighter, warmer space for family gatherings.",
    priority: "high",
  });
  const kitchen = area("kitchen", {
    currentUse: "Family kitchen",
    approxDimensions: "4m x 3.5m",
    mainProblem: "Limited storage and worn cabinetry.",
    desiredOutcome: "More storage and updated cabinetry, keeping the plumbing in place.",
    priority: "essential",
  });
  const exterior = area("exterior_facade", {
    currentUse: "Front façade and entrance",
    approxDimensions: "Full frontage",
    mainProblem: "Faded exterior paint.",
    desiredOutcome: "A refreshed, warm-toned exterior finish.",
    priority: "medium",
  });
  const areas = [livingRoom, kitchen, exterior];

  const keepRemoveChange: KeepRemoveChangeItem[] = [
    { id: newId("krc"), areaId: kitchen.id, listType: "keep", item: "Plumbing locations", instruction: "Keep sink and plumbing exactly where they are.", priority: "essential", notes: "" },
    { id: newId("krc"), areaId: kitchen.id, listType: "remove", item: "Old cabinets", instruction: "Remove and replace worn cabinetry.", priority: "high", notes: "" },
    { id: newId("krc"), areaId: livingRoom.id, listType: "keep", item: "Existing windows", instruction: "Keep window positions and sizes.", priority: "high", notes: "" },
    { id: newId("krc"), areaId: livingRoom.id, listType: "change", item: "Wall colour", instruction: "Move to warmer neutral tones.", priority: "medium", notes: "" },
    { id: newId("krc"), areaId: exterior.id, listType: "change", item: "Exterior paint", instruction: "Refresh with warm contemporary tones.", priority: "medium", notes: "" },
  ];

  const assessment = emptyAssessment();
  assessment.areas = areas;
  assessment.keepRemoveChange = keepRemoveChange;
  assessment.conditions = areas.map((a) => ({
    areaId: a.id,
    conditionRating: "fair",
    wallFinish: "Painted plaster",
    floorMaterial: a.areaKey === "kitchen" ? "Ceramic tile" : "Polished screed",
    ceiling: "Painted gypsum board",
    windows: "Aluminium-framed, good condition",
    doors: "Timber, good condition",
    lighting: "Basic ceiling fixtures",
    storage: a.areaKey === "kitchen" ? "Limited cabinet storage" : "Built-in shelving",
    plumbingCondition: "Good",
    electricalCondition: "Fair",
    moistureOrWaterDamage: "None visible",
    visibleCracks: "None visible",
    ventilation: "Adequate",
    naturalLight: "Moderate",
    accessibility: "Standard",
    otherConcerns: "",
  }));
  assessment.style = {
    primaryStyle: "warm_contemporary",
    secondaryStyles: ["contemporary_african"],
    preferredColours: "Warm terracotta, soft ivory, charcoal accents",
    coloursToAvoid: "Bright primary colours",
    materialsToUse: "Fired-clay brick accents, warm oak-look flooring",
    materialsToAvoid: "High-gloss laminate",
    lightingPreference: "Warm, layered lighting",
    furniturePreference: "Mix of retained and new pieces",
    storagePreference: "More closed storage in the kitchen",
    maintenancePreference: "Low-maintenance finishes",
    localMaterialPreference: true,
    inspirationFileIds: [],
  };
  assessment.budgetTimeline = {
    currency: "RWF",
    minBudget: 12_000_000,
    targetBudget: 18_000_000,
    maxBudget: 24_000_000,
    flexibility: "some_flexibility",
    desiredStartDate: daysAgoIso(-30),
    requiredCompletionDate: daysAgoIso(-120),
    propertyRemainsOccupied: true,
    workHourRestrictions: "Weekday work only, 8am-5pm.",
    finishLevel: "standard",
    furnitureIncluded: false,
    appliancesIncluded: false,
    professionalFeesIncluded: true,
    contingencyPreference: "standard",
  };
  assessment.occupiedDuringRenovation = true;
  assessment.safety = {
    concerns: {},
    buildingManagementRestrictions: "",
    neighbourhoodRestrictions: "",
    accessConstraints: "",
    workingHourRestrictions: "Weekdays only.",
    wasteRemovalConstraints: "",
    knownPermitRequirements: "",
    otherConcerns: "",
  };
  assessment.completedSteps = ["property", "areas", "condition", "keep_remove_change", "style", "budget_timeline", "safety", "review"];
  assessment.disclaimerAccepted = true;

  const concepts = generateAllConcepts({
    areas,
    keepRemoveChange,
    primaryStyle: "warm_contemporary",
    targetBudget: 18_000_000,
    minBudget: 12_000_000,
    maxBudget: 24_000_000,
    propertyAreaSqm: 320,
    safetyFlagLabels: [],
    anyStructuralChangeExpected: false,
  }).map((c) => ({ ...c, generatedAt: generated }));

  const versions: ProjectVersion[] = concepts.map((c, i) => ({
    id: newId("version"),
    number: i + 1,
    createdAt: generated,
    createdBy: "Huza AI",
    source: "initial_ai_generation",
    changeSummary: `${c.name} concept generated from the confirmed renovation brief.`,
    conceptId: c.id,
    selected: false,
  }));

  const project: RenovationProject = {
    id: newId("renov"),
    ownerId,
    name: "Gacuriro Family Home Refresh",
    description: "Refreshing the living room, kitchen and exterior of a family home in Gacuriro, Kigali.",
    status: "concepts_ready",
    createdAt: created,
    updatedAt: generated,
    creationMode: "ai",

    property: {
      source: "owned",
      myPropertyId: "myprop-gacuriro-villa",
      name: "Gacuriro Family Villa",
      imageUrl: "/hero-house.jpg",
      propertyType: "villa",
      ownershipStatus: "owner",
      address: "Gacuriro, Gasabo District, Kigali",
      location: "Gacuriro, Kigali",
      coordinates: { lat: -1.9285, lng: 30.1004 },
      approxAreaSqm: 320,
      floors: 2,
      bedrooms: 4,
      bathrooms: 3,
      constructionYear: 2014,
      occupancy: "occupied",
      accessInfo: "Gated compound, accessible from the main road.",
      willBeOccupiedDuringRenovation: true,
    },
    assessment,
    uploads: emptyUploads(),
    brief: { confirmed: true, confirmedAt: assessmentDone, summary: "Refresh the living room, kitchen and exterior in a warm contemporary style, keeping existing plumbing locations and windows, within an 18M RWF target budget.", missingInformation: [] },

    agentConversation: {
      messages: [
        {
          id: newId("msg"),
          role: "user",
          content: "Redesign my living room and kitchen in a warm contemporary style. Keep the existing windows and plumbing positions, improve storage and natural lighting, and keep the project within 18 million RWF.",
          timestamp: assessmentDone,
        },
        {
          id: newId("msg"),
          role: "agent",
          content: "Thanks — I've organised this into a structured brief. I found living room, kitchen and exterior areas, a warm contemporary style, and a target budget of 18M RWF. I'll keep your existing windows and plumbing positions in place. Shall I confirm these and generate concepts?",
          timestamp: assessmentDone,
        },
      ],
      extractedRequirements: [
        { id: newId("req"), field: "areas", label: "Renovation areas", value: "Living room, Kitchen, Exterior / façade", status: "confirmed" },
        { id: newId("req"), field: "style", label: "Style", value: "Warm contemporary", status: "confirmed" },
        { id: newId("req"), field: "budget", label: "Target budget", value: "18,000,000 RWF", status: "confirmed" },
        { id: newId("req"), field: "keep", label: "Items to keep", value: "Existing windows, plumbing locations", status: "confirmed" },
      ],
    },

    concepts,
    selectedConceptId: null,
    targetedEdits: [],
    versions,

    manualDesign: emptyManualDesign(),

    scope: [],
    scopeGeneratedAt: null,
    timeline: null,
    budget: calculateRenovationBudget({
      totalAreaSqm: 60,
      finishLevel: "standard",
      contingencyPct: 10,
      includeFurniture: false,
      includeAppliances: false,
      includeLandscaping: false,
      includeTemporaryAccommodation: false,
      includeProfessionalFees: true,
    }),

    reviewRequests: [],
    quotationRequest: null,
    quotations: [],

    documents: [
      {
        id: newId("doc"),
        name: "Living room — before.jpg",
        category: "existing_condition_photographs",
        fileType: "jpg",
        size: 612_000,
        date: created,
        relatedAreaKey: "living_room",
        uploadedBy: "You",
        status: "active",
        previewUrl: "/hero-house.jpg",
      },
      {
        id: newId("doc"),
        name: "Balanced Transformation — concept.jpg",
        category: "generated_concepts",
        fileType: "jpg",
        size: 498_000,
        date: generated,
        uploadedBy: "Huza AI",
        status: "active",
        previewUrl: "/hero-house-final.jpg",
        generated: true,
      },
      {
        id: newId("doc"),
        name: "Indicative budget summary.pdf",
        category: "budget_summaries",
        fileType: "pdf",
        size: 198_000,
        date: daysAgoIso(15),
        uploadedBy: "Huza AI",
        status: "active",
        generated: true,
      },
    ],
    activity: [
      activity("project_created", "system", "You", created, 'Project created using "Renovate with Huza AI".'),
      activity("property_selected", "assessment", "You", created, "Selected \"Gacuriro Family Villa\" as the property being renovated."),
      activity("assessment_updated", "assessment", "You", assessmentDone, "Completed the renovation assessment."),
      activity("brief_confirmed", "assessment", "You", assessmentDone, "Confirmed the renovation brief."),
      activity("generation_started", "design", "Huza AI", generated, "Started generating three renovation concepts."),
      activity("concepts_created", "design", "Huza AI", generated, "Generated Essential Refresh, Balanced Transformation and Premium Reconfiguration concepts."),
      activity("budget_recalculated", "budget", "Huza AI", daysAgoIso(15), "Calculated an indicative budget for the selected areas."),
    ],
    generation: { status: "completed", currentStageIndex: 6, completedStageKeys: ["reviewing_property", "organising_requirements", "preserving_elements", "exploring_style_directions", "preparing_before_after", "estimating_scope_cost", "preparing_comparison"] },
  };

  return project;
}

// ---------------------------------------------------------------------------
// Project 2: Kiyovu Apartment Kitchen — assessment_in_progress
// ---------------------------------------------------------------------------

function kiyovuApartmentKitchen(ownerId: string): RenovationProject {
  const created = daysAgoIso(3);

  const kitchen = area("kitchen", {
    currentUse: "Apartment kitchen",
    approxDimensions: "3.2m x 2.8m",
    mainProblem: "Cramped layout with dated cabinetry.",
    desiredOutcome: "A more efficient layout with updated cabinetry and finishes.",
    priority: "essential",
  });

  const keepRemoveChange: KeepRemoveChangeItem[] = [
    { id: newId("krc"), areaId: kitchen.id, listType: "keep", item: "Existing windows", instruction: "Keep window position and size.", priority: "essential", notes: "" },
    { id: newId("krc"), areaId: kitchen.id, listType: "keep", item: "Plumbing locations", instruction: "Keep sink and plumbing where they are to avoid disrupting the shared apartment stack.", priority: "essential", notes: "" },
  ];

  const assessment = emptyAssessment();
  assessment.areas = [kitchen];
  assessment.keepRemoveChange = keepRemoveChange;
  assessment.budgetTimeline = {
    currency: "RWF",
    minBudget: 4_000_000,
    targetBudget: 6_000_000,
    maxBudget: 8_000_000,
    flexibility: "some_flexibility",
    desiredStartDate: "",
    requiredCompletionDate: "",
    propertyRemainsOccupied: true,
    workHourRestrictions: "",
    finishLevel: "standard",
    furnitureIncluded: false,
    appliancesIncluded: false,
    professionalFeesIncluded: true,
    contingencyPreference: "standard",
  };
  assessment.completedSteps = ["property", "areas"];

  const uploads = emptyUploads();
  uploads.photos = [
    {
      id: newId("upload"),
      name: "Kitchen — current state.jpg",
      fileType: "jpg",
      size: 734_000,
      category: "room_photo",
      relatedAreaId: kitchen.id,
      previewUrl: "/hero-house-white.jpg",
      status: "uploaded",
      uploadedAt: created,
      uploadedBy: "You",
    },
  ];

  return {
    id: newId("renov"),
    ownerId,
    name: "Kiyovu Apartment Kitchen",
    description: "Updating the kitchen in a Kiyovu apartment while keeping existing windows and plumbing locations.",
    status: "assessment_in_progress",
    createdAt: created,
    updatedAt: daysAgoIso(1),
    creationMode: "manual",

    property: {
      source: "owned",
      myPropertyId: "myprop-kiyovu-apartment",
      name: "Kiyovu Apartment",
      imageUrl: "/hero-house-final.jpg",
      propertyType: "apartment",
      ownershipStatus: "owner",
      address: "Kiyovu, Nyarugenge District, Kigali",
      location: "Kiyovu, Kigali",
      coordinates: null,
      approxAreaSqm: 145,
      floors: 1,
      bedrooms: 3,
      bathrooms: 2,
      constructionYear: 2017,
      occupancy: "occupied",
      accessInfo: "Shared building entrance with lift access.",
      willBeOccupiedDuringRenovation: true,
    },
    assessment,
    uploads,
    brief: { confirmed: false, confirmedAt: null, summary: "", missingInformation: ["Style preferences not yet set", "Timeline not yet set"] },

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
      activity("project_created", "system", "You", created, 'Project created using "Plan manually".'),
      activity("property_selected", "assessment", "You", created, "Selected \"Kiyovu Apartment\" as the property being renovated."),
      activity("photograph_uploaded", "assessment", "You", daysAgoIso(2), "Uploaded 1 file."),
      activity("assessment_updated", "assessment", "You", daysAgoIso(1), "Selected the kitchen as the renovation area."),
    ],
    generation: emptyGenerationState(),
  };
}

export function renovationSeedProjects(ownerId: string): RenovationProject[] {
  return [gacuriroFamilyHomeRefresh(ownerId), kiyovuApartmentKitchen(ownerId)];
}

// generateScope/calculateRenovationTimeline are exported by their own modules
// and intentionally unused here — seed projects start before scope generation
// to keep the two demo states (concepts_ready / assessment_in_progress)
// realistic entry points into the workflow.
