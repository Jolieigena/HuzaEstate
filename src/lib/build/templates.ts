import { ManualFloor, ManualRoom, ManualRoomType } from "./types";
import { newId } from "./factory";

// Grid units below are approximately metres. Templates are simple prototype
// starting points for the manual designer, not architecturally validated
// layouts.
function room(type: ManualRoomType, name: string, x: number, y: number, w: number, h: number): ManualRoom {
  return { id: newId("room"), type, name, x, y, w, h };
}

export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  bedrooms: number;
  approxDimensions: string;
  approxAreaSqm: number;
  floors: () => ManualFloor[];
}

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: "compact-two-bedroom",
    name: "Compact two-bedroom",
    description: "An efficient single-floor layout for a small household or starter plot.",
    bedrooms: 2,
    approxDimensions: "9m × 10m",
    approxAreaSqm: 68,
    floors: () => [
      {
        id: newId("floor"),
        name: "Ground Floor",
        level: 0,
        rooms: [
          room("living_room", "Living Room", 0, 0, 5, 4),
          room("kitchen", "Kitchen", 5, 0, 4, 4),
          room("hallway", "Hallway", 0, 4, 9, 1.5),
          room("bedroom", "Bedroom 1", 0, 5.5, 4.5, 4),
          room("bedroom", "Bedroom 2", 4.5, 5.5, 4.5, 4),
          room("bathroom", "Bathroom", 0, 9.5, 3, 2.5),
        ],
      },
    ],
  },
  {
    id: "three-bedroom-bungalow",
    name: "Three-bedroom bungalow",
    description: "A single-floor family home with separate living and dining areas.",
    bedrooms: 3,
    approxDimensions: "12m × 11m",
    approxAreaSqm: 128,
    floors: () => [
      {
        id: newId("floor"),
        name: "Ground Floor",
        level: 0,
        rooms: [
          room("living_room", "Living Room", 0, 0, 6, 5),
          room("dining_room", "Dining Room", 6, 0, 6, 3),
          room("kitchen", "Kitchen", 6, 3, 6, 2),
          room("hallway", "Hallway", 0, 5, 12, 1.5),
          room("bedroom", "Bedroom 1 (Primary)", 0, 6.5, 4.5, 4.5),
          room("bathroom", "En-suite Bathroom", 4.5, 6.5, 2.5, 2.2),
          room("bedroom", "Bedroom 2", 7, 6.5, 5, 4.5),
          room("bedroom", "Bedroom 3", 0, 8.7, 4.5, 2.3),
          room("bathroom", "Family Bathroom", 4.5, 8.7, 2.5, 2.5),
        ],
      },
    ],
  },
  {
    id: "four-bedroom-two-floor",
    name: "Four-bedroom two-floor home",
    description: "A generous two-storey family home with a ground-floor home office.",
    bedrooms: 4,
    approxDimensions: "12m × 12m",
    approxAreaSqm: 260,
    floors: () => [
      {
        id: newId("floor"),
        name: "Ground Floor",
        level: 0,
        rooms: [
          room("living_room", "Living Room", 0, 0, 6, 5.5),
          room("dining_room", "Dining Room", 6, 0, 6, 3.5),
          room("kitchen", "Kitchen", 6, 3.5, 6, 3),
          room("home_office", "Home Office", 0, 5.5, 3.5, 3),
          room("bathroom", "Guest Bathroom", 3.5, 5.5, 2.5, 2),
          room("staircase", "Staircase", 6, 6.5, 2.5, 2.5),
          room("hallway", "Hallway", 0, 8.5, 12, 1.5),
        ],
      },
      {
        id: newId("floor"),
        name: "First Floor",
        level: 1,
        rooms: [
          room("bedroom", "Primary Bedroom", 0, 0, 5, 5),
          room("bathroom", "En-suite Bathroom", 5, 0, 2.5, 2.5),
          room("bedroom", "Bedroom 2", 7.5, 0, 4.5, 4.5),
          room("bedroom", "Bedroom 3", 0, 5, 4.5, 4),
          room("bedroom", "Bedroom 4", 4.5, 5, 4.5, 4),
          room("bathroom", "Family Bathroom", 9, 5, 3, 3),
          room("staircase", "Staircase", 5, 2.5, 2.5, 2.5),
        ],
      },
    ],
  },
  {
    id: "courtyard-family-home",
    name: "Courtyard family home",
    description: "Rooms wrap around a shaded central courtyard for privacy and natural ventilation.",
    bedrooms: 3,
    approxDimensions: "14m × 13m",
    approxAreaSqm: 150,
    floors: () => [
      {
        id: newId("floor"),
        name: "Ground Floor",
        level: 0,
        rooms: [
          room("living_room", "Living Room", 0, 0, 5, 5),
          room("dining_room", "Dining Room", 9, 0, 5, 4),
          room("kitchen", "Kitchen", 9, 4, 5, 3),
          room("terrace", "Courtyard", 5, 0, 4, 7),
          room("bedroom", "Bedroom 1 (Primary)", 0, 5, 5, 4),
          room("bathroom", "En-suite Bathroom", 0, 9, 2.5, 2),
          room("bedroom", "Bedroom 2", 9, 7, 5, 3.5),
          room("bedroom", "Bedroom 3", 2.5, 9, 4.5, 2),
          room("bathroom", "Family Bathroom", 9, 10.5, 3, 2),
        ],
      },
    ],
  },
  {
    id: "narrow-urban-plot",
    name: "Narrow urban plot home",
    description: "A vertical layout that stacks living, sleeping and terrace levels for a tight street-facing plot.",
    bedrooms: 3,
    approxDimensions: "7m × 14m",
    approxAreaSqm: 175,
    floors: () => [
      {
        id: newId("floor"),
        name: "Ground Floor",
        level: 0,
        rooms: [
          room("garage", "Garage", 0, 0, 3.5, 5),
          room("living_room", "Living Room", 3.5, 0, 3.5, 5),
          room("kitchen", "Kitchen", 0, 5, 3.5, 4),
          room("staircase", "Staircase", 3.5, 5, 1.5, 4),
          room("bathroom", "Guest Bathroom", 5, 5, 2, 2),
        ],
      },
      {
        id: newId("floor"),
        name: "First Floor",
        level: 1,
        rooms: [
          room("bedroom", "Bedroom 1", 0, 0, 3.5, 5),
          room("bedroom", "Bedroom 2", 3.5, 0, 3.5, 5),
          room("staircase", "Staircase", 3.5, 5, 1.5, 4),
          room("bathroom", "Bathroom", 0, 5, 3.5, 4),
        ],
      },
      {
        id: newId("floor"),
        name: "Second Floor",
        level: 2,
        rooms: [
          room("bedroom", "Primary Bedroom", 0, 0, 4, 5),
          room("bathroom", "En-suite Bathroom", 4, 0, 3, 2.5),
          room("staircase", "Staircase", 4, 2.5, 1.5, 2.5),
          room("terrace", "Rooftop Terrace", 0, 5, 7, 4),
        ],
      },
    ],
  },
];

export function getTemplate(id: string): DesignTemplate | undefined {
  return DESIGN_TEMPLATES.find((t) => t.id === id);
}
