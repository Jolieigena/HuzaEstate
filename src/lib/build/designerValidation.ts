import { ManualDesign, ManualRoom } from "./types";

export interface DesignerWarning {
  id: string;
  message: string;
}

function roomsOverlap(a: ManualRoom, b: ManualRoom): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function validateManualDesign(design: ManualDesign, plotAreaSqm: number | null): DesignerWarning[] {
  const warnings: DesignerWarning[] = [];

  for (const floor of design.floors) {
    for (let i = 0; i < floor.rooms.length; i++) {
      for (let j = i + 1; j < floor.rooms.length; j++) {
        if (roomsOverlap(floor.rooms[i], floor.rooms[j])) {
          warnings.push({ id: `overlap-${floor.id}-${i}-${j}`, message: `"${floor.rooms[i].name}" and "${floor.rooms[j].name}" overlap on ${floor.name}.` });
        }
      }
    }
    for (const room of floor.rooms) {
      if (room.w * room.h < 3) {
        warnings.push({ id: `tiny-${room.id}`, message: `"${room.name}" on ${floor.name} is very small (${(room.w * room.h).toFixed(1)} sqm).` });
      }
    }
    const hasCirculation = floor.rooms.some((r) => r.type === "hallway" || r.type === "staircase");
    if (floor.rooms.length >= 4 && !hasCirculation) {
      warnings.push({ id: `circulation-${floor.id}`, message: `${floor.name} has several rooms but no hallway or staircase for circulation.` });
    }
  }

  if (design.floors.length > 1) {
    const hasStaircase = design.floors.some((f) => f.rooms.some((r) => r.type === "staircase"));
    if (!hasStaircase) {
      warnings.push({ id: "missing-staircase", message: "This design has more than one floor but no staircase has been added." });
    }
  }

  if (plotAreaSqm) {
    const totalFootprint = design.floors[0]?.rooms.reduce((sum, r) => sum + r.w * r.h, 0) ?? 0;
    if (totalFootprint > plotAreaSqm * 0.75) {
      warnings.push({ id: "footprint-exceeds-plot", message: "The ground floor footprint may be larger than comfortably fits this plot." });
    }
  }

  return warnings;
}
