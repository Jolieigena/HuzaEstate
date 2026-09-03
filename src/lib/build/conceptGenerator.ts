import { newId } from "./factory";
import { calculateBudget } from "./budget";
import { Concept, ConceptDirection, DesignBrief, ManualFloor, ManualRoom, ManualRoomType } from "./types";

const DIRECTION_META: Record<ConceptDirection, { name: string; rationale: string; advantages: string[]; compromises: string[]; areaFactor: number; sustainability: number; efficiency: number; costFactor: number; widthM: number; parkingDelta: number }> = {
  efficient: {
    name: "Efficient",
    rationale: "Prioritises a compact footprint and lower construction cost while still meeting your core room requirements.",
    advantages: ["Lowest estimated construction cost", "Smaller footprint leaves more open plot", "Shorter construction duration"],
    compromises: ["Bedrooms and living areas are more modest in size", "Less room for optional extras"],
    areaFactor: 0.85,
    sustainability: 62,
    efficiency: 91,
    costFactor: 0.85,
    widthM: 8,
    parkingDelta: 0,
  },
  balanced: {
    name: "Balanced",
    rationale: "Balances comfortable room sizes with a moderate budget, keeping flexible circulation and good natural light.",
    advantages: ["Comfortable room sizes without a large cost increase", "Good natural light across living areas", "Realistic build timeline"],
    compromises: ["Slightly larger footprint than the efficient direction", "Some spaces are shared rather than dedicated"],
    areaFactor: 1,
    sustainability: 74,
    efficiency: 78,
    costFactor: 1,
    widthM: 10.5,
    parkingDelta: 0,
  },
  spacious: {
    name: "Spacious",
    rationale: "Maximises room sizes, outdoor connection and future flexibility, for households prioritising space over cost.",
    advantages: ["Largest bedrooms and living spaces", "Strongest indoor-outdoor connection", "Most room for future expansion"],
    compromises: ["Highest estimated construction cost", "Larger footprint uses more of the available plot"],
    areaFactor: 1.22,
    sustainability: 80,
    efficiency: 60,
    costFactor: 1.24,
    widthM: 13,
    parkingDelta: 1,
  },
};

const PLACEHOLDER_IMAGES = {
  white: "/hero-house-white.jpg",
  final: "/hero-house-final.jpg",
  spacious: "/hero-house-spacious.jpg",
  ai: "/hero-house-ai.jpg",
  hero: "/hero-house.jpg",
  heroPng: "/hero-house.png",
};

interface RoomSpec {
  type: ManualRoomType;
  name: string;
  areaSqm: number;
  ground: boolean;
}

const ROOM_KEY_MAP: Record<string, { type: ManualRoomType; area: number; ground: boolean }> = {
  bedrooms: { type: "bedroom", area: 14, ground: false },
  bathrooms: { type: "bathroom", area: 5, ground: false },
  ensuite: { type: "bathroom", area: 4, ground: false },
  living_rooms: { type: "living_room", area: 26, ground: true },
  dining_spaces: { type: "dining_room", area: 14, ground: true },
  guest_room: { type: "bedroom", area: 12, ground: false },
  home_office: { type: "home_office", area: 10, ground: true },
  staff_quarters: { type: "bedroom", area: 9, ground: false },
  laundry: { type: "laundry", area: 6, ground: true },
  pantry: { type: "pantry", area: 5, ground: true },
  storage: { type: "storage", area: 5, ground: true },
  balcony: { type: "balcony", area: 6, ground: false },
  terrace: { type: "terrace", area: 10, ground: true },
  courtyard: { type: "terrace", area: 14, ground: true },
  play_area: { type: "custom", area: 10, ground: true },
  prayer_room: { type: "custom", area: 6, ground: false },
  gym: { type: "custom", area: 12, ground: true },
  entertainment_room: { type: "custom", area: 16, ground: true },
};

function expandRoomSpecs(brief: DesignBrief): RoomSpec[] {
  const specs: RoomSpec[] = [{ type: "kitchen", name: "Kitchen", areaSqm: 14, ground: true }];
  for (const room of brief.household.rooms) {
    if (room.key === "garden") continue; // outdoor space, not part of the floor footprint
    const mapped = ROOM_KEY_MAP[room.key] ?? { type: "custom" as ManualRoomType, area: room.preferredSizeSqm ?? 10, ground: false };
    for (let i = 0; i < Math.max(1, room.quantity); i++) {
      specs.push({
        type: mapped.type,
        name: room.quantity > 1 ? `${room.label} ${i + 1}` : room.label,
        areaSqm: room.preferredSizeSqm ?? mapped.area,
        ground: mapped.ground,
      });
    }
  }
  return specs;
}

function packRooms(specs: { type: ManualRoomType; name: string; areaSqm: number }[], maxWidthM: number): ManualRoom[] {
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  const placed: ManualRoom[] = [];
  for (const spec of specs) {
    const w = Math.max(2.2, Math.round(Math.sqrt(spec.areaSqm * 1.3) * 10) / 10);
    const h = Math.max(2.2, Math.round((spec.areaSqm / w) * 10) / 10);
    if (x + w > maxWidthM && x > 0) {
      x = 0;
      y += rowHeight;
      rowHeight = 0;
    }
    placed.push({ id: newId("room"), type: spec.type, name: spec.name, x, y, w, h });
    x += w;
    rowHeight = Math.max(rowHeight, h);
  }
  return placed;
}

function buildFloorsForDirection(brief: DesignBrief, direction: ConceptDirection): ManualFloor[] {
  const meta = DIRECTION_META[direction];
  const floorCount = Math.max(1, brief.household.floors);
  const allSpecs = expandRoomSpecs(brief).map((s) => ({ ...s, areaSqm: Math.round(s.areaSqm * meta.areaFactor * 10) / 10 }));

  const groundSpecs = allSpecs.filter((s) => s.ground || floorCount === 1);
  const upperSpecs = allSpecs.filter((s) => !s.ground && floorCount > 1);

  const floors: ManualFloor[] = [];
  for (let level = 0; level < floorCount; level++) {
    const specsForFloor: RoomSpec[] = level === 0 ? [...groundSpecs] : [];
    if (level > 0) {
      const perFloor = Math.ceil(upperSpecs.length / (floorCount - 1));
      specsForFloor.push(...upperSpecs.slice((level - 1) * perFloor, level * perFloor));
    }
    if (floorCount > 1) {
      specsForFloor.push({ type: "staircase", name: "Staircase", areaSqm: 6, ground: true });
    }
    floors.push({
      id: newId("floor"),
      name: level === 0 ? "Ground Floor" : level === 1 ? "First Floor" : `Floor ${level + 1}`,
      level,
      rooms: packRooms(specsForFloor, meta.widthM),
    });
  }
  return floors;
}

function totalFloorArea(floors: ManualFloor[]): number {
  return Math.round(floors.reduce((sum, f) => sum + f.rooms.reduce((s, r) => s + r.w * r.h, 0), 0));
}

export function generateConcept(brief: DesignBrief, direction: ConceptDirection): Concept {
  const meta = DIRECTION_META[direction];
  const floors = buildFloorsForDirection(brief, direction);
  const floorAreaSqm = Math.max(30, totalFloorArea(floors));
  const bedrooms = floors.reduce((sum, f) => sum + f.rooms.filter((r) => r.type === "bedroom").length, 0);
  const bathrooms = floors.reduce((sum, f) => sum + f.rooms.filter((r) => r.type === "bathroom").length, 0);
  const parking = Math.max(1, (brief.household.parkingSpaces || 1) + meta.parkingDelta);

  const budgetEstimate = calculateBudget({
    totalAreaSqm: floorAreaSqm,
    finishLevel: brief.budget.finishLevel,
    contingencyPct: 10,
    includeLandscaping: brief.budget.landscapingIncluded,
    includeFurniture: brief.budget.furnitureIncluded,
    includeProfessionalFees: brief.budget.professionalFeesIncluded,
  });

  const generatedAt = new Date().toISOString();

  return {
    id: newId("concept"),
    direction,
    name: meta.name,
    rationale: meta.rationale,
    previewImage: direction === "efficient" ? PLACEHOLDER_IMAGES.white : direction === "balanced" ? PLACEHOLDER_IMAGES.final : PLACEHOLDER_IMAGES.spacious,
    metrics: {
      floorAreaSqm,
      floors: floors.length,
      bedrooms,
      bathrooms,
      parking,
      budgetLowRwf: Math.round(budgetEstimate.low * meta.costFactor),
      budgetHighRwf: Math.round(budgetEstimate.high * meta.costFactor),
      sustainabilityScore: meta.sustainability,
      efficiencyScore: meta.efficiency,
    },
    advantages: meta.advantages,
    compromises: meta.compromises,
    generatedAt,
    version: 1,
    floors,
    exteriorViews: {
      front: PLACEHOLDER_IMAGES.hero,
      rear: PLACEHOLDER_IMAGES.final,
      left: PLACEHOLDER_IMAGES.white,
      right: PLACEHOLDER_IMAGES.spacious,
      day: PLACEHOLDER_IMAGES.ai,
      evening: PLACEHOLDER_IMAGES.heroPng,
    },
    interiorDirections: [
      { room: "Living Room", image: PLACEHOLDER_IMAGES.final, note: "Open-plan living oriented toward the plot's most open side." },
      { room: "Kitchen", image: PLACEHOLDER_IMAGES.white, note: "Kitchen positioned close to the dining area for easy service." },
      { room: "Primary Bedroom", image: PLACEHOLDER_IMAGES.spacious, note: "Primary bedroom set apart from shared living spaces for privacy." },
      { room: "Bathroom", image: PLACEHOLDER_IMAGES.ai, note: "Bright, ventilated bathroom with simple, durable finishes." },
    ],
    decisions: {
      grouping: floors.length > 1 ? "Bedrooms are grouped upstairs, away from shared living spaces on the ground floor." : "Private and shared spaces are grouped on opposite sides of the plan for a clearer separation.",
      privacy: "Bedrooms are positioned away from entertainment and guest areas for better acoustic privacy.",
      naturalLight: "Living and dining areas face the plot's most open side to maximise daylight through the day.",
      plotResponse: brief.plot.areaSqm ? `The footprint targets roughly ${Math.round((floorAreaSqm / floors.length / brief.plot.areaSqm) * 100)}% plot coverage per floor, leaving room for parking and outdoor space.` : "The footprint assumes a typical residential plot until your exact plot size is confirmed.",
      budgetResponse: `This direction targets the ${meta.name.toLowerCase()} end of your budget range by adjusting room sizes rather than removing required rooms.`,
      futureExpansion: "The structural grid on the ground floor leaves room for a rear extension if more space is needed later.",
    },
    risks: {
      missingSiteInfo: brief.plot.areaSqm ? [] : ["Plot area was not provided — this concept assumes a typical residential plot size."],
      planningAssumptions: ["Assumes standard residential setback requirements for the stated location."],
      structuralAssumptions: ["Assumes a conventional block-and-slab structural system."],
      budgetAssumptions: ["Material costs assume standard, locally available finishes at the selected finish level."],
      needsProfessionalValidation: ["Structural design", "Final electrical and plumbing layout", "Permit drawings"],
    },
  };
}

export function generateAllConcepts(brief: DesignBrief): Concept[] {
  return (["efficient", "balanced", "spacious"] as ConceptDirection[]).map((d) => generateConcept(brief, d));
}
