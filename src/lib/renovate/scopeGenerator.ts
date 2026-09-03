import { newId } from "./factory";
import {
  KeepRemoveChangeItem,
  RenovationAreaKey,
  RENOVATION_AREA_LABELS,
  SafetyAssessment,
  ScopeItem,
  ScopeWorkCategory,
  SelectedRenovationArea,
} from "./types";

/** Canonical work order — also used to assign indicative sequence numbers, since it already respects the stated dependencies (demolition before electrical, plumbing before wall finishes, ceiling before painting, inspection before closing walls). */
const CATEGORY_ORDER: ScopeWorkCategory[] = [
  "demolition",
  "preparation",
  "structural",
  "roofing",
  "plumbing",
  "electrical",
  "walls",
  "ceiling",
  "flooring",
  "doors_windows",
  "cabinetry",
  "fixtures",
  "painting",
  "furniture",
  "exterior",
  "landscaping",
  "cleaning_handover",
];

interface TaskTemplate {
  category: ScopeWorkCategory;
  task: string;
  description: string;
  unit: string;
  professionalRequired?: boolean;
  dependency?: string;
}

const AREA_TASK_TEMPLATES: Partial<Record<RenovationAreaKey, TaskTemplate[]>> = {
  kitchen: [
    { category: "demolition", task: "Remove existing cabinetry and worktop", description: "Strip out cabinetry, worktop and any fixtures marked for removal.", unit: "room" },
    { category: "plumbing", task: "Reposition or reconnect kitchen plumbing", description: "Adjust supply and drain lines for the new layout, keeping existing positions where marked to keep.", unit: "room", professionalRequired: true, dependency: "Demolition must be complete first." },
    { category: "electrical", task: "Update kitchen electrical circuits", description: "Add or relocate sockets and lighting circuits for new appliances and fixtures.", unit: "room", professionalRequired: true, dependency: "Demolition before electrical work." },
    { category: "walls", task: "Prepare and finish kitchen walls", description: "Patch, skim and finish walls ready for tiling or paint.", unit: "sqm", dependency: "Plumbing and electrical rough-in before wall finishes." },
    { category: "flooring", task: "Install kitchen flooring", description: "Lay the selected flooring material across the kitchen footprint.", unit: "sqm" },
    { category: "cabinetry", task: "Install new cabinetry and worktop", description: "Fit new or refreshed cabinetry and worktop per the selected concept.", unit: "room" },
    { category: "fixtures", task: "Install sink, tap and appliances", description: "Fit sink, tap and connect appliances to be kept or replaced.", unit: "room" },
    { category: "painting", task: "Paint kitchen walls and ceiling", description: "Apply finish coats in the selected colours.", unit: "sqm", dependency: "Ceiling work before painting." },
  ],
  bathroom: [
    { category: "demolition", task: "Remove existing fittings and tiling", description: "Strip out bathtub, tiling or fixtures marked for removal.", unit: "room" },
    { category: "plumbing", task: "Reposition or reconnect bathroom plumbing", description: "Adjust supply and drain lines, keeping existing positions where marked to keep.", unit: "room", professionalRequired: true, dependency: "Demolition must be complete first." },
    { category: "electrical", task: "Update bathroom electrical and ventilation", description: "Add or relocate lighting and extractor fan circuits.", unit: "room", professionalRequired: true, dependency: "Demolition before electrical work." },
    { category: "walls", task: "Waterproof and prepare walls", description: "Waterproof membrane and preparation ahead of tiling.", unit: "sqm", dependency: "Plumbing before wall finishes." },
    { category: "flooring", task: "Install waterproof bathroom flooring", description: "Lay waterproof flooring or tile with appropriate falls to drain.", unit: "sqm" },
    { category: "fixtures", task: "Install sanitaryware and fittings", description: "Fit toilet, basin, shower or bath and associated fittings.", unit: "room" },
    { category: "painting", task: "Paint non-tiled surfaces", description: "Apply moisture-resistant paint to remaining surfaces.", unit: "sqm" },
  ],
  living_room: [
    { category: "preparation", task: "Protect and prepare the room", description: "Cover floors and furniture, remove items marked for removal.", unit: "room" },
    { category: "electrical", task: "Update lighting circuits", description: "Add or relocate lighting points per the selected concept.", unit: "room", professionalRequired: true },
    { category: "walls", task: "Prepare and finish walls", description: "Patch and finish walls ready for paint or wall covering.", unit: "sqm" },
    { category: "ceiling", task: "Ceiling treatment", description: "Repair or refresh ceiling finish before painting.", unit: "sqm", dependency: "Ceiling work before painting." },
    { category: "flooring", task: "Install or refresh flooring", description: "Lay or refinish the selected flooring material.", unit: "sqm" },
    { category: "painting", task: "Paint walls and trim", description: "Apply finish coats in the selected colours.", unit: "sqm" },
    { category: "furniture", task: "Place furniture and soft furnishings", description: "Arrange retained and new furniture per the layout.", unit: "room" },
  ],
  dining_room: [
    { category: "preparation", task: "Protect and prepare the room", description: "Cover floors and furniture, remove items marked for removal.", unit: "room" },
    { category: "walls", task: "Prepare and finish walls", description: "Patch and finish walls ready for paint.", unit: "sqm" },
    { category: "flooring", task: "Install or refresh flooring", description: "Lay or refinish the selected flooring material.", unit: "sqm" },
    { category: "painting", task: "Paint walls and trim", description: "Apply finish coats in the selected colours.", unit: "sqm" },
    { category: "furniture", task: "Place furniture", description: "Arrange retained and new dining furniture.", unit: "room" },
  ],
  bedroom: [
    { category: "preparation", task: "Protect and prepare the room", description: "Cover floors and furniture, remove items marked for removal.", unit: "room" },
    { category: "walls", task: "Prepare and finish walls", description: "Patch and finish walls ready for paint.", unit: "sqm" },
    { category: "flooring", task: "Install or refresh flooring", description: "Lay or refinish the selected flooring material.", unit: "sqm" },
    { category: "painting", task: "Paint walls and trim", description: "Apply finish coats in the selected colours.", unit: "sqm" },
    { category: "fixtures", task: "Update lighting fixtures", description: "Fit new light fixtures where selected.", unit: "room" },
  ],
  home_office: [
    { category: "electrical", task: "Add data and power points", description: "Add sockets and data points for a home-office setup.", unit: "room", professionalRequired: true },
    { category: "walls", task: "Prepare and finish walls", description: "Patch and finish walls ready for paint.", unit: "sqm" },
    { category: "painting", task: "Paint walls and trim", description: "Apply finish coats in the selected colours.", unit: "sqm" },
    { category: "furniture", task: "Install desk and storage", description: "Fit or place desk, shelving and storage.", unit: "room" },
  ],
  hallway: [
    { category: "walls", task: "Prepare and finish hallway walls", description: "Patch and finish walls ready for paint.", unit: "sqm" },
    { category: "flooring", task: "Install or refresh hallway flooring", description: "Lay durable flooring suited to circulation areas.", unit: "sqm" },
    { category: "painting", task: "Paint walls and trim", description: "Apply finish coats in the selected colours.", unit: "sqm" },
  ],
  exterior_facade: [
    { category: "preparation", task: "Clean and prepare exterior surfaces", description: "Pressure wash and prepare surfaces ahead of finishing.", unit: "sqm" },
    { category: "exterior", task: "Apply exterior finish", description: "Apply the selected exterior finish or cladding.", unit: "sqm" },
    { category: "painting", task: "Paint exterior surfaces", description: "Apply exterior-grade paint in the selected colours.", unit: "sqm" },
  ],
  roofing: [
    { category: "roofing", task: "Inspect existing roof structure", description: "Professional inspection required before any roofing work proceeds.", unit: "roof", professionalRequired: true, dependency: "Inspection before closing walls or ceiling below." },
    { category: "roofing", task: "Repair or replace roofing material", description: "Repair or replace roofing sheets/tiles per the selected concept.", unit: "sqm", professionalRequired: true },
  ],
  balcony: [
    { category: "structural", task: "Inspect balcony structure", description: "Professional inspection recommended before finishing works.", unit: "balcony", professionalRequired: true },
    { category: "flooring", task: "Install balcony flooring", description: "Lay weather-resistant flooring.", unit: "sqm" },
    { category: "fixtures", task: "Install balustrade and fixtures", description: "Fit balustrade and outdoor fixtures.", unit: "balcony" },
  ],
  terrace: [
    { category: "flooring", task: "Install terrace flooring", description: "Lay weather-resistant terrace flooring.", unit: "sqm" },
    { category: "exterior", task: "Add shading or pergola", description: "Install shading structure where selected.", unit: "terrace" },
  ],
  garden: [
    { category: "landscaping", task: "Prepare garden beds and paths", description: "Clear, grade and prepare garden areas.", unit: "sqm" },
    { category: "landscaping", task: "Planting and irrigation", description: "Install planting and irrigation per the selected concept.", unit: "sqm" },
  ],
  landscaping: [
    { category: "landscaping", task: "Hardscaping and paths", description: "Install paths, walls or paved areas.", unit: "sqm" },
    { category: "landscaping", task: "Planting and irrigation", description: "Install planting and irrigation per the selected concept.", unit: "sqm" },
  ],
  garage: [
    { category: "preparation", task: "Clear and prepare garage", description: "Clear existing storage and prepare surfaces.", unit: "room" },
    { category: "electrical", task: "Update garage electrical", description: "Add or update lighting and power circuits.", unit: "room", professionalRequired: true },
    { category: "flooring", task: "Refresh garage flooring", description: "Apply or repair floor coating.", unit: "sqm" },
  ],
  extension: [
    { category: "structural", task: "Structural design and inspection", description: "Professional structural design and inspection required before any extension work.", unit: "extension", professionalRequired: true, dependency: "Requires professional inspection and, in most cases, a permit before work begins." },
    { category: "roofing", task: "Extend roof structure", description: "Extend or connect roofing to the new structure.", unit: "extension", professionalRequired: true },
    { category: "electrical", task: "Extend electrical circuits", description: "Extend circuits into the new area.", unit: "extension", professionalRequired: true },
    { category: "plumbing", task: "Extend plumbing where needed", description: "Extend supply/drain lines into the new area if required.", unit: "extension", professionalRequired: true },
    { category: "walls", task: "Build and finish walls", description: "Construct and finish walls for the new area.", unit: "sqm" },
    { category: "flooring", task: "Install flooring", description: "Lay flooring in the new area.", unit: "sqm" },
    { category: "painting", task: "Paint the new area", description: "Apply finish coats throughout the extension.", unit: "sqm" },
  ],
  additional_floor: [
    { category: "structural", task: "Structural design and inspection", description: "Professional structural design and inspection required before adding a floor.", unit: "floor", professionalRequired: true, dependency: "Requires professional inspection and permit before work begins." },
    { category: "roofing", task: "Rebuild roof over new floor", description: "Remove and rebuild roofing above the new floor.", unit: "floor", professionalRequired: true },
    { category: "electrical", task: "Run electrical circuits to new floor", description: "Extend circuits to the new floor.", unit: "floor", professionalRequired: true },
    { category: "plumbing", task: "Extend plumbing to new floor", description: "Extend supply/drain lines if the new floor includes wet areas.", unit: "floor", professionalRequired: true },
    { category: "walls", task: "Build and finish walls", description: "Construct and finish walls on the new floor.", unit: "sqm" },
    { category: "flooring", task: "Install flooring", description: "Lay flooring throughout the new floor.", unit: "sqm" },
    { category: "painting", task: "Paint the new floor", description: "Apply finish coats throughout the new floor.", unit: "sqm" },
  ],
  full_property: [
    { category: "demolition", task: "Full-property strip-out", description: "Remove finishes and fixtures marked for removal across the property.", unit: "property" },
    { category: "plumbing", task: "Whole-property plumbing review", description: "Review and update plumbing across the property.", unit: "property", professionalRequired: true },
    { category: "electrical", task: "Whole-property electrical review", description: "Review and update electrical circuits across the property.", unit: "property", professionalRequired: true },
    { category: "walls", task: "Walls and ceiling finishes", description: "Prepare and finish walls and ceilings throughout.", unit: "sqm" },
    { category: "flooring", task: "Flooring throughout", description: "Install or refresh flooring throughout the property.", unit: "sqm" },
    { category: "painting", task: "Paint throughout", description: "Apply finish coats throughout the property.", unit: "sqm" },
    { category: "cleaning_handover", task: "Final clean and handover", description: "Deep clean and prepare the property for handover.", unit: "property" },
  ],
  accessibility_improvement: [
    { category: "doors_windows", task: "Widen doorways", description: "Widen doorways where required for accessibility.", unit: "door" },
    { category: "fixtures", task: "Install accessible fixtures", description: "Install handrails, accessible sanitaryware and fittings.", unit: "room" },
    { category: "flooring", task: "Install slip-resistant flooring", description: "Replace flooring with a slip-resistant material.", unit: "sqm" },
  ],
  energy_efficiency: [
    { category: "doors_windows", task: "Upgrade windows and seals", description: "Improve window seals or glazing for efficiency.", unit: "window" },
    { category: "electrical", task: "Install energy-efficient lighting", description: "Replace lighting with energy-efficient fixtures.", unit: "room", professionalRequired: true },
    { category: "roofing", task: "Add roof insulation", description: "Add or improve roof insulation where accessible.", unit: "roof" },
  ],
};

function defaultTemplateFor(): TaskTemplate[] {
  return [
    { category: "preparation", task: "Prepare the area", description: "Protect surfaces and clear items marked for removal.", unit: "room" },
    { category: "walls", task: "Prepare and finish walls", description: "Patch and finish walls ready for paint.", unit: "sqm" },
    { category: "flooring", task: "Install or refresh flooring", description: "Lay or refinish the selected flooring material.", unit: "sqm" },
    { category: "painting", task: "Paint walls and trim", description: "Apply finish coats in the selected colours.", unit: "sqm" },
  ];
}

function safetyRequiresReview(safety: SafetyAssessment): boolean {
  return Object.values(safety.concerns).some((v) => v === "yes" || v === "unknown");
}

export function generateScope(areas: SelectedRenovationArea[], keepRemoveChange: KeepRemoveChangeItem[], safety: SafetyAssessment): ScopeItem[] {
  const forceReview = safetyRequiresReview(safety);
  const items: ScopeItem[] = [];

  for (const area of areas) {
    const templates = AREA_TASK_TEMPLATES[area.areaKey] ?? defaultTemplateFor();
    const areaLabel = area.customLabel || RENOVATION_AREA_LABELS[area.areaKey];
    const removedItems = keepRemoveChange.filter((k) => k.areaId === area.id && k.listType === "remove");

    for (const t of templates) {
      items.push({
        id: newId("scope"),
        areaKey: area.areaKey,
        category: t.category,
        task: `${areaLabel}: ${t.task}`,
        description: t.description,
        priority: area.priority,
        sequence: 0, // assigned below
        dependency: t.dependency ?? "",
        quantity: null,
        unit: t.unit,
        responsibility: t.professionalRequired ? "Licensed professional" : "Contractor",
        professionalRequired: Boolean(t.professionalRequired) || forceReview || area.structuralChangesExpected === true || area.structuralChangesExpected === "unknown",
        status: "planned",
        notes: "",
      });
    }

    for (const removed of removedItems) {
      items.push({
        id: newId("scope"),
        areaKey: area.areaKey,
        category: "demolition",
        task: `${areaLabel}: Remove ${removed.item}`,
        description: removed.instruction || `Remove and dispose of ${removed.item.toLowerCase()}.`,
        priority: removed.priority,
        sequence: 0,
        dependency: "",
        quantity: null,
        unit: "item",
        responsibility: "Contractor",
        professionalRequired: false,
        status: "planned",
        notes: removed.notes,
      });
    }
  }

  return items
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category))
    .map((item, i) => ({ ...item, sequence: i + 1 }));
}
