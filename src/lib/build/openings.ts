import { ManualOpening, ManualRoom, OpeningKind, WallSide } from "./types";
import { newId } from "./factory";

export const WALL_LABELS: Record<WallSide, string> = { top: "Top wall", right: "Right wall", bottom: "Bottom wall", left: "Left wall" };
export const WALLS: WallSide[] = ["top", "right", "bottom", "left"];
export const OPENING_LABELS: Record<OpeningKind, string> = { door: "Door", window: "Window" };

const DEFAULT_WIDTH: Record<OpeningKind, number> = { door: 0.9, window: 1.2 };
// Where a new one goes first: doors on the bottom wall, windows on the top, then the other walls.
const WALL_ORDER: Record<OpeningKind, WallSide[]> = { door: ["bottom", "right", "left", "top"], window: ["top", "left", "right", "bottom"] };

/** Length in metres of one wall of a room. */
export function wallLength(room: Pick<ManualRoom, "w" | "h">, wall: WallSide): number {
  return wall === "top" || wall === "bottom" ? room.w : room.h;
}

/** Keeps an opening inside its wall (a wall can be made shorter after the opening was placed). */
export function clampOpening(room: Pick<ManualRoom, "w" | "h">, opening: ManualOpening): ManualOpening {
  const length = wallLength(room, opening.wall);
  const width = Math.max(0.4, Math.min(opening.width, length));
  const offset = Math.max(0, Math.min(opening.offset, length - width));
  return { ...opening, width, offset };
}

function overlaps(a: ManualOpening, b: ManualOpening): boolean {
  return a.wall === b.wall && a.offset < b.offset + b.width && a.offset + a.width > b.offset;
}

/** A new door or window for a room, centred on the first wall that has room for it. */
export function newOpening(room: ManualRoom, kind: OpeningKind): ManualOpening {
  const existing = room.openings ?? [];
  const make = (wall: WallSide): ManualOpening => {
    const width = Math.min(DEFAULT_WIDTH[kind], wallLength(room, wall));
    return { id: newId("opening"), kind, wall, width, offset: Math.max(0, (wallLength(room, wall) - width) / 2) };
  };
  for (const wall of WALL_ORDER[kind]) {
    const candidate = make(wall);
    if (!existing.some((o) => overlaps(o, candidate))) return candidate;
  }
  return make(WALL_ORDER[kind][0]);
}
