import { newId } from "./factory";
import { calculateRenovationBudget } from "./budget";
import {
  ConceptAreaView,
  ConceptDirection,
  DisruptionLevel,
  KeepRemoveChangeItem,
  RENOVATION_AREA_LABELS,
  RenovationAreaKey,
  RenovationConcept,
  RENOVATION_STYLE_LABELS,
  RenovationStyle,
  SelectedRenovationArea,
} from "./types";

const PLACEHOLDER_IMAGES = {
  white: "/hero-house-white.jpg",
  final: "/hero-house-final.jpg",
  spacious: "/hero-house-spacious.jpg",
  ai: "/hero-house-ai.jpg",
  hero: "/hero-house.jpg",
  heroPng: "/hero-house.png",
};

const DIRECTION_META: Record<
  ConceptDirection,
  {
    name: string;
    rationale: string;
    costFactor: number;
    durationFactor: number;
    disruption: DisruptionLevel;
    sustainability: number;
    advantages: string[];
    compromises: string[];
    afterImage: string;
    retainRatio: number; // portion of "keep" items honoured
  }
> = {
  essential_refresh: {
    name: "Essential Refresh",
    rationale: "Focuses on cosmetic improvements — paint, finishes and fixtures — while retaining as much of the existing layout and materials as possible, for the lowest cost and shortest timeline.",
    costFactor: 0.62,
    durationFactor: 0.6,
    disruption: "low",
    sustainability: 82,
    advantages: ["Lowest estimated cost", "Shortest timeline", "Least disruption to daily life", "Retains the most existing materials"],
    compromises: ["Limited layout or fixture changes", "Some existing wear may remain visible", "Smaller visual transformation"],
    afterImage: PLACEHOLDER_IMAGES.white,
    retainRatio: 1,
  },
  balanced_transformation: {
    name: "Balanced Transformation",
    rationale: "Combines moderate layout and fixture changes with a noticeable visual transformation, balancing cost against improved function and finish quality.",
    costFactor: 1,
    durationFactor: 1,
    disruption: "medium",
    sustainability: 68,
    advantages: ["Meaningful visual and functional improvement", "Balanced cost-to-impact ratio", "Realistic mid-range timeline"],
    compromises: ["Some items you'd prefer to keep may still need replacement", "Moderate disruption during the works"],
    afterImage: PLACEHOLDER_IMAGES.final,
    retainRatio: 0.7,
  },
  premium_reconfiguration: {
    name: "Premium Reconfiguration",
    rationale: "Pursues higher-quality finishes and more extensive changes, including possible layout reconfiguration, for the greatest transformation and the most customisation.",
    costFactor: 1.55,
    durationFactor: 1.5,
    disruption: "high",
    sustainability: 54,
    advantages: ["Greatest overall transformation", "Highest-quality finishes and materials", "Most scope for customisation"],
    compromises: ["Highest estimated cost", "Longest timeline", "Greater disruption, including possible temporary relocation"],
    afterImage: PLACEHOLDER_IMAGES.spacious,
    retainRatio: 0.35,
  },
};

const STYLE_MATERIALS: Partial<Record<RenovationStyle, { materials: string[]; colours: string[] }>> = {
  warm_contemporary: { materials: ["Warm oak-look flooring", "Matte fired-clay brick accents", "Brushed brass fixtures"], colours: ["Warm terracotta", "Soft ivory", "Charcoal"] },
  modern: { materials: ["Polished concrete", "Matte-lacquer cabinetry", "Chrome fixtures"], colours: ["Cool white", "Graphite", "Slate grey"] },
  contemporary_african: { materials: ["Local hardwood", "Natural stone", "Woven textile accents"], colours: ["Ochre", "Deep green", "Sand"] },
  minimalist: { materials: ["Light oak", "Plain plaster walls", "Matte white cabinetry"], colours: ["White", "Light grey", "Natural wood tone"] },
  scandinavian: { materials: ["Pale wood flooring", "Simple painted cabinetry", "Wool textiles"], colours: ["Off-white", "Pale grey", "Muted blue"] },
  industrial: { materials: ["Exposed block or brick", "Black-framed steel", "Polished concrete"], colours: ["Charcoal", "Rust", "Raw concrete grey"] },
  luxury: { materials: ["Natural marble-look stone", "Custom joinery", "Brushed gold fixtures"], colours: ["Deep emerald", "Warm cream", "Black accents"] },
  traditional: { materials: ["Timber panelling", "Fired clay tile", "Wrought-iron fixtures"], colours: ["Deep brown", "Cream", "Burgundy accents"] },
  rustic: { materials: ["Reclaimed timber", "Natural stone", "Handmade tile"], colours: ["Earth brown", "Warm cream", "Moss green"] },
  tropical: { materials: ["Rattan and cane accents", "Light timber", "Natural fibre textiles"], colours: ["Soft green", "Sand", "White"] },
  affordable_modern: { materials: ["Laminate flooring", "Painted MDF cabinetry", "Standard ceramic tile"], colours: ["White", "Light grey", "Soft blue accent"] },
};

function keepItemsForArea(keepRemoveChange: KeepRemoveChangeItem[], areaId: string): string[] {
  return keepRemoveChange.filter((k) => k.areaId === areaId && k.listType === "keep").map((k) => k.item);
}
function removeItemsForArea(keepRemoveChange: KeepRemoveChangeItem[], areaId: string): string[] {
  return keepRemoveChange.filter((k) => k.areaId === areaId && k.listType === "remove").map((k) => k.item);
}
function changeItemsForArea(keepRemoveChange: KeepRemoveChangeItem[], areaId: string): string[] {
  return keepRemoveChange.filter((k) => k.areaId === areaId && k.listType === "change").map((k) => k.item);
}

export interface ConceptGenerationInput {
  areas: SelectedRenovationArea[];
  keepRemoveChange: KeepRemoveChangeItem[];
  primaryStyle: RenovationStyle | null;
  targetBudget: number | null;
  minBudget: number | null;
  maxBudget: number | null;
  propertyAreaSqm: number | null;
  safetyFlagLabels: string[];
  anyStructuralChangeExpected: boolean;
}

function areaViewsFor(areas: SelectedRenovationArea[], afterImage: string): ConceptAreaView[] {
  return areas.map((a) => ({
    areaKey: a.areaKey,
    label: a.customLabel || RENOVATION_AREA_LABELS[a.areaKey],
    beforeImage: PLACEHOLDER_IMAGES.hero,
    afterImage,
  }));
}

export function generateConcept(direction: ConceptDirection, input: ConceptGenerationInput): RenovationConcept {
  const meta = DIRECTION_META[direction];
  const generatedAt = new Date().toISOString();
  const areaKeys: RenovationAreaKey[] = input.areas.length ? input.areas.map((a) => a.areaKey) : ["living_room"];

  const allKeep = input.areas.flatMap((a) => keepItemsForArea(input.keepRemoveChange, a.id));
  const allRemove = input.areas.flatMap((a) => removeItemsForArea(input.keepRemoveChange, a.id));
  const allChange = input.areas.flatMap((a) => changeItemsForArea(input.keepRemoveChange, a.id));
  const itemsPreserved = meta.retainRatio >= 1 ? allKeep : allKeep.slice(0, Math.ceil(allKeep.length * meta.retainRatio));

  const renovatedAreaSqm = Math.max(20, input.areas.reduce((sum, a) => sum + (parseFloat(a.approxDimensions) || 15), 0)) || (input.propertyAreaSqm ?? 40) * 0.3;

  const baseBudget = calculateRenovationBudget({
    totalAreaSqm: renovatedAreaSqm,
    finishLevel: direction === "essential_refresh" ? "essential" : direction === "balanced_transformation" ? "standard" : "premium",
    contingencyPct: 10,
    includeFurniture: direction !== "essential_refresh",
    includeAppliances: direction === "premium_reconfiguration",
    includeLandscaping: areaKeys.includes("garden") || areaKeys.includes("landscaping"),
    includeTemporaryAccommodation: false,
    includeProfessionalFees: true,
  });

  const styleInfo = input.primaryStyle ? STYLE_MATERIALS[input.primaryStyle] : undefined;
  const styleLabel = input.primaryStyle ? RENOVATION_STYLE_LABELS[input.primaryStyle] : "your preferred style";

  const professionalReviewRequired = input.anyStructuralChangeExpected || input.safetyFlagLabels.length > 0 || direction === "premium_reconfiguration";

  return {
    id: newId("concept"),
    direction,
    name: meta.name,
    rationale: meta.rationale,
    version: 1,
    generatedAt,
    areasIncluded: areaKeys,
    itemsPreserved,
    beforeImage: PLACEHOLDER_IMAGES.hero,
    afterImage: meta.afterImage,
    areaViews: areaViewsFor(input.areas, meta.afterImage),
    estimatedCostLowRwf: Math.round(baseBudget.low * meta.costFactor),
    estimatedCostHighRwf: Math.round(baseBudget.high * meta.costFactor),
    estimatedDurationWeeks: Math.max(1, Math.round(6 * meta.durationFactor)),
    disruptionLevel: meta.disruption,
    sustainabilityScore: meta.sustainability,
    mainAdvantages: meta.advantages,
    mainCompromises: meta.compromises,
    safetyFlags: input.safetyFlagLabels,
    whatRemains: itemsPreserved.length ? itemsPreserved : ["Existing structural layout"],
    whatChanges: allChange.length ? allChange : [`Finishes updated to match ${styleLabel}`],
    whatIsRemoved: direction === "essential_refresh" ? allRemove.slice(0, Math.ceil(allRemove.length * 0.4)) : allRemove,
    suggestedMaterials: styleInfo?.materials ?? ["Locally available finishes matched to your budget"],
    suggestedColours: styleInfo?.colours ?? ["Neutral tones to be confirmed"],
    lightingDirection: direction === "premium_reconfiguration" ? "Layered lighting with statement fixtures and dimmable ambient lighting." : "Warm, energy-efficient lighting to brighten existing dark corners.",
    storageStrategy: direction === "essential_refresh" ? "Existing storage is retained; minor reorganisation only." : "Additional built-in storage is introduced where circulation allows.",
    furnitureDirection: direction === "essential_refresh" ? "Existing furniture is retained; only key pieces are refreshed." : `Furniture direction follows ${styleLabel} with a mix of retained and new pieces.`,
    sustainabilityConsiderations: itemsPreserved.length ? `Reuses ${itemsPreserved.length} existing element${itemsPreserved.length === 1 ? "" : "s"}, reducing material waste.` : "Limited reuse of existing materials in this direction.",
    assumptions: [
      "Assumes standard structural conditions until a professional inspection confirms otherwise.",
      "Material costs assume standard, locally available finishes at the selected finish level.",
      input.propertyAreaSqm ? `Assumes the renovated area is roughly ${Math.round(renovatedAreaSqm)} sqm within your ${input.propertyAreaSqm} sqm property.` : "Renovated area is estimated from the areas you selected.",
    ],
    risks: input.safetyFlagLabels.length ? [`Flagged for professional review: ${input.safetyFlagLabels.join(", ")}.`] : ["No safety concerns were flagged during the assessment."],
    professionalReviewRequired,
  };
}

export function generateAllConcepts(input: ConceptGenerationInput): RenovationConcept[] {
  return (["essential_refresh", "balanced_transformation", "premium_reconfiguration"] as ConceptDirection[]).map((d) => generateConcept(d, input));
}
