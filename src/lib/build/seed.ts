import { newId, emptyBrief, emptyAgentConversation, emptyManualDesign, emptyGenerationState } from "./factory";
import { calculateBudget } from "./budget";
import {
  ActivityEvent,
  BuildProject,
  Concept,
  ConceptDirection,
  ManualFloor,
  ProfessionalReviewRequest,
  ProjectDocument,
  ProjectVersion,
} from "./types";

const PLACEHOLDER_IMAGES = {
  white: "/hero-house-white.jpg",
  final: "/hero-house-final.jpg",
  spacious: "/hero-house-spacious.jpg",
  ai: "/hero-house-ai.jpg",
  hero: "/hero-house.jpg",
  heroPng: "/hero-house.png",
};

function room(type: ManualFloor["rooms"][number]["type"], name: string, x: number, y: number, w: number, h: number) {
  return { id: newId("room"), type, name, x, y, w, h };
}

function buildKigaliConceptFloors(direction: ConceptDirection): ManualFloor[] {
  const scale = direction === "efficient" ? 0.85 : direction === "spacious" ? 1.2 : 1;
  const w1 = 6 * scale;
  const w2 = 6 * scale;
  return [
    {
      id: newId("floor"),
      name: "Ground Floor",
      level: 0,
      rooms: [
        room("living_room", "Living Room", 0, 0, w1, 5.5),
        room("dining_room", "Dining Room", w1, 0, w2, 3.5),
        room("kitchen", "Kitchen", w1, 3.5, w2, 3),
        room("home_office", direction === "spacious" ? "Home Office" : "Storage", 0, 5.5, 3.5 * scale, 3),
        room("bathroom", "Guest Bathroom", 3.5 * scale, 5.5, 2.5, 2),
        room("staircase", "Staircase", w1, 6.5, 2.5, 2.5),
      ],
    },
    {
      id: newId("floor"),
      name: "First Floor",
      level: 1,
      rooms: [
        room("bedroom", "Primary Bedroom", 0, 0, 5 * scale, 5),
        room("bathroom", "En-suite Bathroom", 5 * scale, 0, 2.5, 2.5),
        room("bedroom", "Bedroom 2", 7.5 * scale, 0, 4.5 * scale, 4.5),
        room("bedroom", "Bedroom 3", 0, 5, 4.5 * scale, 4),
        room("bedroom", "Bedroom 4", 4.5 * scale, 5, 4.5 * scale, 4),
        room("bathroom", "Family Bathroom", 9 * scale, 5, 3, 3),
        room("staircase", "Staircase", 5 * scale, 2.5, 2.5, 2.5),
      ],
    },
  ];
}

const DIRECTION_META: Record<ConceptDirection, { name: string; rationale: string; advantages: string[]; compromises: string[]; areaFactor: number; sustainability: number; efficiency: number; costFactor: number }> = {
  efficient: {
    name: "Efficient",
    rationale: "Prioritises a compact footprint and lower construction cost while still meeting your core room requirements.",
    advantages: ["Lowest estimated construction cost", "Smaller footprint leaves more open plot", "Shorter construction duration"],
    compromises: ["Bedrooms and living areas are more modest in size", "Limited room for a dedicated home office"],
    areaFactor: 0.85,
    sustainability: 62,
    efficiency: 91,
    costFactor: 0.85,
  },
  balanced: {
    name: "Balanced",
    rationale: "Balances comfortable room sizes with a moderate budget, keeping a flexible home office and generous circulation.",
    advantages: ["Comfortable room sizes without a large cost increase", "Includes a flexible home office", "Good natural light across living areas"],
    compromises: ["Slightly larger footprint than the efficient direction", "Garden space is moderate, not maximised"],
    areaFactor: 1,
    sustainability: 74,
    efficiency: 78,
    costFactor: 1,
  },
  spacious: {
    name: "Spacious",
    rationale: "Maximises room sizes, outdoor connection and future flexibility, for households prioritising space over cost.",
    advantages: ["Largest bedrooms and living spaces", "Strongest indoor-outdoor connection", "Most room for future expansion"],
    compromises: ["Highest estimated construction cost", "Larger footprint uses more of the available plot"],
    areaFactor: 1.2,
    sustainability: 80,
    efficiency: 60,
    costFactor: 1.22,
  },
};

function buildConcept(direction: ConceptDirection, baseAreaSqm: number, version: number, generatedAt: string): Concept {
  const meta = DIRECTION_META[direction];
  const floorAreaSqm = Math.round(baseAreaSqm * meta.areaFactor);
  const budgetTarget = floorAreaSqm * 500_000 * meta.costFactor;
  return {
    id: newId("concept"),
    direction,
    name: meta.name,
    rationale: meta.rationale,
    previewImage: direction === "efficient" ? PLACEHOLDER_IMAGES.white : direction === "balanced" ? PLACEHOLDER_IMAGES.final : PLACEHOLDER_IMAGES.spacious,
    metrics: {
      floorAreaSqm,
      floors: 2,
      bedrooms: 4,
      bathrooms: direction === "efficient" ? 3 : direction === "balanced" ? 4 : 5,
      parking: direction === "spacious" ? 3 : 2,
      budgetLowRwf: Math.round(budgetTarget * 0.88),
      budgetHighRwf: Math.round(budgetTarget * 1.18),
      sustainabilityScore: meta.sustainability,
      efficiencyScore: meta.efficiency,
    },
    advantages: meta.advantages,
    compromises: meta.compromises,
    generatedAt,
    version,
    floors: buildKigaliConceptFloors(direction),
    exteriorViews: {
      front: PLACEHOLDER_IMAGES.hero,
      rear: PLACEHOLDER_IMAGES.final,
      left: PLACEHOLDER_IMAGES.white,
      right: PLACEHOLDER_IMAGES.spacious,
      day: PLACEHOLDER_IMAGES.ai,
      evening: PLACEHOLDER_IMAGES.heroPng,
    },
    interiorDirections: [
      { room: "Living Room", image: PLACEHOLDER_IMAGES.final, note: "Open-plan living with large windows facing the garden." },
      { room: "Kitchen", image: PLACEHOLDER_IMAGES.white, note: "Island-style kitchen open to the dining area." },
      { room: "Primary Bedroom", image: PLACEHOLDER_IMAGES.spacious, note: "Primary bedroom with en-suite bathroom and dressing space." },
      { room: "Bathroom", image: PLACEHOLDER_IMAGES.ai, note: "Bright, ventilated bathroom with natural stone-look finishes." },
    ],
    decisions: {
      grouping: "Bedrooms are grouped on the first floor away from shared living spaces on the ground floor to separate rest and entertaining.",
      privacy: "The primary bedroom is positioned away from the entertainment and guest areas for better acoustic privacy.",
      naturalLight: "Living and dining areas face the plot's most open side to maximise daylight through the day.",
      plotResponse: "The footprint is set back from the road boundary to leave room for parking and a small front garden.",
      budgetResponse: `This direction targets the ${meta.name.toLowerCase()} end of your budget range by adjusting room sizes rather than removing required rooms.`,
      futureExpansion: "The structural grid on the ground floor leaves room for a rear extension if more space is needed later.",
    },
    risks: {
      missingSiteInfo: ["Soil test results were not provided and are assumed to be standard for the area."],
      planningAssumptions: ["Assumes standard residential setback requirements for Kigali."],
      structuralAssumptions: ["Assumes a conventional block-and-slab structural system."],
      budgetAssumptions: ["Material costs assume standard, locally available finishes at the selected finish level."],
      needsProfessionalValidation: ["Structural design", "Final electrical and plumbing layout", "Permit drawings"],
    },
  };
}

function conceptVersion(concept: Concept, number: number, createdAt: string): ProjectVersion {
  return {
    id: newId("version"),
    number,
    createdAt,
    createdBy: "Huza AI",
    source: "ai_generation",
    changeSummary: `${concept.name} concept generated from the confirmed design brief.`,
    conceptId: concept.id,
    selected: false,
  };
}

function activity(type: ActivityEvent["type"], category: ActivityEvent["category"], actor: string, timestamp: string, details?: string, link?: string): ActivityEvent {
  return { id: newId("activity"), type, category, actor, timestamp, details, link };
}

function daysAgoIso(days: number, hours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function buildKigaliFamilyHome(ownerId: string): BuildProject {
  const created = daysAgoIso(21);
  const briefConfirmed = daysAgoIso(19);
  const generated = daysAgoIso(18);

  const efficient = buildConcept("efficient", 210, 1, generated);
  const balanced = buildConcept("balanced", 210, 1, generated);
  const spacious = buildConcept("spacious", 210, 1, generated);

  const brief = emptyBrief();
  brief.basics = {
    countryValue: "Rwanda",
    provinceOrCity: "Kigali",
    district: "Gasabo",
    neighbourhood: "Gacuriro",
    propertyUse: "primary_residence",
    occupants: 5,
    constructionStartPeriod: "Within 12 months",
  };
  brief.plot = {
    address: "Gacuriro, Gasabo District, Kigali",
    coordinates: { lat: -1.9285, lng: 30.1004 },
    shape: "rectangular",
    widthM: 18,
    lengthM: 25,
    areaSqm: 450,
    orientation: "North-facing frontage",
    slope: "gentle",
    accessRoad: "Paved access road with street lighting",
    existingStructures: "None — vacant plot",
    utilityAccess: ["Grid electricity nearby", "Piped water nearby"],
    notes: "Neighbouring plots are already developed with two-storey homes.",
    files: [],
  };
  brief.household = {
    floors: 2,
    kitchenType: "open_plan",
    parkingSpaces: 2,
    rooms: [
      { key: "bedrooms", label: "Bedrooms", quantity: 4, privacy: "private" },
      { key: "bathrooms", label: "Bathrooms", quantity: 4, privacy: "private" },
      { key: "living_rooms", label: "Living rooms", quantity: 1, privacy: "semi_private" },
      { key: "dining_spaces", label: "Dining spaces", quantity: 1, privacy: "semi_private" },
      { key: "home_office", label: "Home office", quantity: 1, privacy: "private", notes: "Needs a quiet spot away from the living room." },
      { key: "guest_room", label: "Guest room", quantity: 1, privacy: "private" },
    ],
  };
  brief.style = {
    ...brief.style,
    primaryStyle: "contemporary",
    secondaryStyles: ["contemporary_african"],
    roofStyle: "Low-pitch contemporary roof",
    exteriorColours: "Warm neutrals with dark timber accents",
    interiorColours: "Light neutrals with natural wood tones",
    windowStyle: "Large format aluminium-framed windows",
    naturalLightPriority: "high",
    privacyPriority: "medium",
    layoutPreference: "open_plan",
    indoorOutdoorConnection: "high",
    preferredMaterials: "Fired clay brick, natural stone, timber accents",
    materialsToAvoid: "Reflective glass facades",
  };
  brief.budget = {
    currency: "RWF",
    minBudget: 120_000_000,
    targetBudget: 150_000_000,
    maxBudget: 180_000_000,
    flexibility: "some_flexibility",
    finishLevel: "standard",
    expectedDesignCompletion: "In 2 months",
    expectedConstructionStart: "In 6 months",
    preferredConstructionDuration: "10-12 months",
    professionalFeesIncluded: true,
    furnitureIncluded: false,
    landscapingIncluded: true,
  };
  brief.sustainability.items = brief.sustainability.items.map((i) =>
    ["natural_ventilation", "max_daylight", "solar_readiness", "rainwater_harvesting"].includes(i.key) ? { ...i, priority: "preferred" as const } : i
  );
  brief.accessibility.items = brief.accessibility.items.map((i) => (i.key === "step_free_entrance" ? { ...i, priority: "preferred" as const } : i));
  brief.completedSteps = ["basics", "plot", "household", "style", "budget", "sustainability", "review"];
  brief.disclaimerAccepted = true;

  const documents: ProjectDocument[] = [
    {
      id: newId("doc"),
      name: "Gacuriro plot survey.pdf",
      category: "plot_document",
      fileType: "pdf",
      size: 842_000,
      date: created,
      uploadedBy: "You",
      status: "active",
      attachedTo: [{ kind: "brief", label: "Plot information" }],
    },
    {
      id: newId("doc"),
      name: "Efficient concept — exterior.jpg",
      category: "concept_image",
      fileType: "jpg",
      size: 512_000,
      date: generated,
      relatedVersion: "Version 1",
      uploadedBy: "Huza AI",
      status: "active",
      previewUrl: PLACEHOLDER_IMAGES.white,
      generated: true,
      attachedTo: [{ kind: "concept", label: "Efficient concept" }],
    },
    {
      id: newId("doc"),
      name: "Balanced concept — exterior.jpg",
      category: "concept_image",
      fileType: "jpg",
      size: 498_000,
      date: generated,
      relatedVersion: "Version 1",
      uploadedBy: "Huza AI",
      status: "active",
      previewUrl: PLACEHOLDER_IMAGES.final,
      generated: true,
      attachedTo: [{ kind: "concept", label: "Balanced concept" }],
    },
    {
      id: newId("doc"),
      name: "Indicative budget summary.pdf",
      category: "budget_summary",
      fileType: "pdf",
      size: 220_000,
      date: daysAgoIso(15),
      uploadedBy: "Huza AI",
      status: "active",
      generated: true,
      attachedTo: [{ kind: "brief", label: "Budget estimate" }],
    },
  ];

  const reviewRequests: ProfessionalReviewRequest[] = [
    {
      id: newId("review"),
      type: "architectural",
      professional: {
        id: "pro-1",
        name: "Aline Uwase",
        profession: "Registered Architect",
        location: "Kigali, Rwanda",
        verified: true,
        rating: 4.8,
        completedReviews: 63,
        estimatedResponseTime: "2-3 business days",
      },
      versionId: "v1",
      attachedDocumentIds: [documents[1].id, documents[2].id],
      notes: "Please check whether the first-floor bedroom layout works well for a family with two teenagers.",
      status: "changes_requested",
      submittedAt: daysAgoIso(10),
      estimatedResponseTime: "2-3 business days",
      feedback: [
        {
          id: newId("feedback"),
          authorName: "Aline Uwase",
          authorProfession: "Registered Architect",
          createdAt: daysAgoIso(8),
          comment: "Overall the balanced concept works well for your plot orientation. A few adjustments would improve it before moving forward.",
          severity: "info",
          addressed: false,
        },
        {
          id: newId("feedback"),
          authorName: "Aline Uwase",
          authorProfession: "Registered Architect",
          createdAt: daysAgoIso(8),
          comment: "Bedroom 3 and Bedroom 4 share a very narrow circulation gap — recommend widening the first-floor hallway by at least 0.3m.",
          severity: "issue",
          relatedFloor: "First Floor",
          addressed: false,
        },
        {
          id: newId("feedback"),
          authorName: "Aline Uwase",
          authorProfession: "Registered Architect",
          createdAt: daysAgoIso(8),
          comment: "Consider moving the home office further from the living room for better acoustic separation during calls.",
          severity: "recommendation",
          relatedFloor: "Ground Floor",
          addressed: false,
        },
      ],
    },
  ];

  const versions: ProjectVersion[] = [
    conceptVersion(efficient, 1, generated),
    { ...conceptVersion(balanced, 2, generated), selected: false },
    conceptVersion(spacious, 3, generated),
  ];

  const project: BuildProject = {
    id: newId("project"),
    ownerId,
    name: "Kigali Family Home",
    description: "A four-bedroom contemporary family home on a 450 sqm plot in Gacuriro.",
    createdAt: created,
    updatedAt: daysAgoIso(8),
    status: "concepts_ready",
    creationMode: "ai",
    country: "Rwanda",
    brief,
    agentConversation: {
      messages: [
        {
          id: newId("msg"),
          role: "user",
          content: "Design a contemporary two-floor family home for a 450 sqm plot in Gacuriro, Kigali. Four bedrooms, a home office, and a target budget of 150 million RWF.",
          timestamp: briefConfirmed,
        },
        {
          id: newId("msg"),
          role: "agent",
          content: "Thanks — I've organised this into a structured brief. I found four bedrooms, a home office, two floors, and a target budget of 150M RWF. Your plot is 450 sqm with a north-facing frontage, which is great for natural light. Shall I confirm these and generate concepts?",
          timestamp: briefConfirmed,
        },
      ],
      extractedRequirements: [
        { id: newId("req"), field: "bedrooms", label: "Bedrooms", value: "4", status: "confirmed" },
        { id: newId("req"), field: "floors", label: "Floors", value: "2", status: "confirmed" },
        { id: newId("req"), field: "style", label: "Style", value: "Contemporary", status: "confirmed" },
        { id: newId("req"), field: "budget", label: "Target budget", value: "150,000,000 RWF", status: "confirmed" },
        { id: newId("req"), field: "home_office", label: "Home office", value: "Required, away from living room", status: "confirmed" },
      ],
    },
    manualDesign: emptyManualDesign(),
    concepts: [efficient, balanced, spacious],
    selectedConceptId: null,
    versions,
    budget: calculateBudget({
      totalAreaSqm: balanced.metrics.floorAreaSqm,
      finishLevel: "standard",
      contingencyPct: 10,
      includeLandscaping: true,
      includeFurniture: false,
      includeProfessionalFees: true,
    }),
    reviewRequests,
    documents,
    activity: [
      activity("project_created", "system", "You", created, 'Project created using "Design with Huza AI".'),
      activity("ai_conversation_updated", "design", "You", briefConfirmed, "Sent a design prompt to Huza AI."),
      activity("brief_updated", "design", "You", briefConfirmed, "Confirmed the structured design brief."),
      activity("concept_generation_started", "design", "Huza AI", generated, "Started generating three concept directions."),
      activity("concepts_generated", "design", "Huza AI", generated, "Generated Efficient, Balanced and Spacious concepts.", `/studio/build/${""}/concepts`),
      activity("budget_recalculated", "budget", "Huza AI", daysAgoIso(15), "Calculated an indicative budget based on the Balanced concept."),
      activity("review_requested", "professional_review", "You", daysAgoIso(10), "Requested an architectural review of the Balanced concept."),
      activity("professional_commented", "professional_review", "Aline Uwase", daysAgoIso(8), "Left 3 comments on the Balanced concept."),
    ],
    generation: { status: "completed", currentStageIndex: 5, completedStageKeys: ["reviewing_plot", "organising_requirements", "exploring_layouts", "preparing_exteriors", "estimating_areas", "preparing_results"] },
  };

  // fix self-referential links now that the id exists
  project.activity = project.activity.map((e) => (e.link === "/studio/build//concepts" ? { ...e, link: `/studio/build/${project.id}/concepts` } : e));

  return project;
}

function buildCompactStarterHome(ownerId: string): BuildProject {
  const created = daysAgoIso(4);
  const brief = emptyBrief();
  brief.basics = {
    countryValue: "Rwanda",
    provinceOrCity: "Kigali",
    district: "Kicukiro",
    neighbourhood: "Kanombe",
    propertyUse: "primary_residence",
    occupants: 3,
    constructionStartPeriod: "Within 18 months",
  };
  brief.plot = {
    address: "Kanombe, Kicukiro District, Kigali",
    coordinates: { lat: -1.9646, lng: 30.1394 },
    shape: "square",
    widthM: 15,
    lengthM: 16,
    areaSqm: 240,
    orientation: "",
    slope: "unknown",
    accessRoad: "",
    existingStructures: "",
    utilityAccess: [],
    notes: "",
    files: [],
  };
  brief.household = {
    floors: 1,
    kitchenType: "closed",
    parkingSpaces: 1,
    rooms: [
      { key: "bedrooms", label: "Bedrooms", quantity: 3, privacy: "private" },
      { key: "bathrooms", label: "Bathrooms", quantity: 2, privacy: "private" },
      { key: "living_rooms", label: "Living rooms", quantity: 1, privacy: "semi_private" },
    ],
  };
  brief.style = { ...brief.style, primaryStyle: "affordable_modern" };
  brief.budget = { ...brief.budget, minBudget: 45_000_000, targetBudget: 60_000_000, maxBudget: 75_000_000, finishLevel: "essential" };
  brief.completedSteps = ["basics", "plot", "household"];

  return {
    id: newId("project"),
    ownerId,
    name: "Compact Starter Home",
    description: "An affordable three-bedroom single-floor home for a young family in Kanombe.",
    createdAt: created,
    updatedAt: daysAgoIso(1),
    status: "brief_in_progress",
    creationMode: "manual",
    country: "Rwanda",
    brief,
    agentConversation: emptyAgentConversation(),
    manualDesign: emptyManualDesign(),
    concepts: [],
    selectedConceptId: null,
    versions: [],
    budget: null,
    reviewRequests: [],
    documents: [],
    activity: [
      activity("project_created", "system", "You", created, 'Project created using "Design manually".'),
      activity("brief_updated", "design", "You", daysAgoIso(2), "Completed project basics and plot information."),
      activity("brief_updated", "design", "You", daysAgoIso(1), "Completed household and room requirements."),
    ],
    generation: emptyGenerationState(),
  };
}

export function buildSeedProjects(ownerId: string): BuildProject[] {
  return [buildKigaliFamilyHome(ownerId), buildCompactStarterHome(ownerId)];
}
