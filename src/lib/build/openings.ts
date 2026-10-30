import { ManualFloor, ManualOpening, ManualRoom, OpeningKind, WallSide } from "./types";
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

// ---------------------------------------------------------------------------------------------------------------------------------
// Doors and windows for plans the program makes (concepts and templates). A wall that other rooms stand against is an inside wall;
// the rest face outside. Rooms people live in get windows on the outside walls, and every room gets one door, onto a hallway,
// staircase or living room next to it when there is one.

const EDGE_TOLERANCE = 0.3;
const HABITABLE = new Set(["living_room", "dining_room", "kitchen", "bedroom", "home_office"]);
const SMALL_WET = new Set(["bathroom", "laundry"]);
const NO_DOOR = new Set(["staircase", "balcony", "terrace", "open_space"]);
// Rooms that choose their door first are the private ones, so they open onto the shared rooms and not the other way round.
const DOOR_ORDER = ["bedroom", "bathroom", "home_office", "kitchen", "dining_room", "laundry", "pantry", "storage", "garage", "living_room", "hallway"];
const DOOR_TARGET_SCORE: Record<string, number> = { hallway: 4, staircase: 3, living_room: 3, dining_room: 2, kitchen: 1 };
const PRIVATE = new Set(["bedroom", "bathroom", "home_office"]);

// How good a neighbour is to open onto. A bedroom or bathroom should not open into the kitchen or another bedroom unless nothing else is next to it.
function doorScore(room: ManualRoom, target: ManualRoom): number {
  const base = DOOR_TARGET_SCORE[target.type] ?? 0;
  if (!PRIVATE.has(room.type)) return base;
  if (target.type === "kitchen") return -2;
  if (target.type === "bedroom") return -1;
  return base;
}

type Neighbour = { room: ManualRoom; wall: WallSide; lo: number; hi: number };

function neighboursOf(room: ManualRoom, rooms: ManualRoom[]): Neighbour[] {
  const found: Neighbour[] = [];
  for (const other of rooms) {
    if (other.id === room.id) continue;
    const xLo = Math.max(room.x, other.x);
    const xHi = Math.min(room.x + room.w, other.x + other.w);
    const yLo = Math.max(room.y, other.y);
    const yHi = Math.min(room.y + room.h, other.y + other.h);
    if (xHi - xLo > 0.4) {
      if (Math.abs(room.y - (other.y + other.h)) < EDGE_TOLERANCE) found.push({ room: other, wall: "top", lo: xLo, hi: xHi });
      if (Math.abs(room.y + room.h - other.y) < EDGE_TOLERANCE) found.push({ room: other, wall: "bottom", lo: xLo, hi: xHi });
    }
    if (yHi - yLo > 0.4) {
      if (Math.abs(room.x - (other.x + other.w)) < EDGE_TOLERANCE) found.push({ room: other, wall: "left", lo: yLo, hi: yHi });
      if (Math.abs(room.x + room.w - other.x) < EDGE_TOLERANCE) found.push({ room: other, wall: "right", lo: yLo, hi: yHi });
    }
  }
  return found;
}

function wallStart(room: ManualRoom, wall: WallSide): number {
  return wall === "top" || wall === "bottom" ? room.x : room.y;
}

function sharedLength(neighbours: Neighbour[], wall: WallSide): number {
  return neighbours.filter((n) => n.wall === wall).reduce((sum, n) => sum + (n.hi - n.lo), 0);
}

function exteriorWalls(room: ManualRoom, neighbours: Neighbour[]): WallSide[] {
  return WALLS.filter((wall) => sharedLength(neighbours, wall) < wallLength(room, wall) * 0.3).sort((a, b) => wallLength(room, b) - wallLength(room, a));
}

function opening(kind: OpeningKind, wall: WallSide, offset: number, width: number): ManualOpening {
  return { id: newId("opening"), kind, wall, offset: Math.max(0, Math.round(offset * 10) / 10), width };
}

function centred(room: ManualRoom, wall: WallSide, width: number): number {
  return (wallLength(room, wall) - width) / 2;
}

/** Gives every room of the given floors a door, and the rooms people live in windows. Rooms that already have openings are left as they are. */
export function addDefaultOpenings(floors: ManualFloor[]): ManualFloor[] {
  return floors.map((floor) => {
    const rooms = floor.rooms.map((room) => ({ ...room, openings: [...(room.openings ?? [])] }));
    const linked = new Set<string>(); // rooms that already have a door shared with a neighbour
    const hasEntrance = floor.level === 0 && rooms.some((r) => r.type === "living_room");
    let entranceMade = false;

    // Rooms that sit next to a hallway, staircase or living room choose first, so they get that door before a neighbour takes it.
    const bestScore = new Map(rooms.map((room) => [room.id, Math.max(-9, ...neighboursOf(room, rooms).map((n) => doorScore(room, n.room)))]));
    const order = [...rooms].sort((a, b) => {
      if (bestScore.get(b.id)! !== bestScore.get(a.id)!) return bestScore.get(b.id)! - bestScore.get(a.id)!;
      const ia = DOOR_ORDER.indexOf(a.type);
      const ib = DOOR_ORDER.indexOf(b.type);
      return (ia === -1 ? DOOR_ORDER.length : ia) - (ib === -1 ? DOOR_ORDER.length : ib);
    });

    for (const room of order) {
      if (room.openings!.length > 0) continue;
      const neighbours = neighboursOf(room, rooms);
      const outside = exteriorWalls(room, neighbours);

      // Windows
      if (HABITABLE.has(room.type) || SMALL_WET.has(room.type)) {
        const small = SMALL_WET.has(room.type);
        const walls = outside.slice(0, small ? 1 : 2);
        for (const wall of walls) {
          const length = wallLength(room, wall);
          const width = small ? 0.6 : length >= 5 && room.type === "living_room" ? 1.8 : Math.min(1.2, length - 0.6);
          if (width >= 0.5) room.openings!.push(opening("window", wall, centred(room, wall, width), width));
        }
      }

      // Door
      if (NO_DOOR.has(room.type)) continue;
      if (room.type === "garage") {
        const wall = outside.includes("bottom") ? "bottom" : outside[0];
        if (wall) room.openings!.push(opening("door", wall, centred(room, wall, Math.min(2.4, wallLength(room, wall))), Math.min(2.4, wallLength(room, wall))));
        continue;
      }
      if (!linked.has(room.id)) {
        const candidates = neighbours
          .filter((n) => !NO_DOOR.has(n.room.type) || n.room.type === "staircase")
          .sort((a, b) => doorScore(room, b.room) - doorScore(room, a.room) || b.hi - b.lo - (a.hi - a.lo));
        const best = candidates[0];
        if (best && best.hi - best.lo >= 0.9) {
          const width = Math.min(0.9, best.hi - best.lo);
          const mid = (best.lo + best.hi) / 2;
          room.openings!.push(opening("door", best.wall, mid - width / 2 - wallStart(room, best.wall), width));
          linked.add(room.id);
          linked.add(best.room.id);
        } else if (outside.length > 0 && room.type !== "living_room") {
          const wall = outside.includes("bottom") ? "bottom" : outside[outside.length - 1];
          room.openings!.push(opening("door", wall, centred(room, wall, 0.9), 0.9));
        }
      }
      // The way into the house: the first living room on the ground floor opens to the outside.
      if (hasEntrance && !entranceMade && room.type === "living_room") {
        const wall = outside.includes("bottom") ? "bottom" : outside[0];
        if (wall) {
          const taken = room.openings!.some((o) => o.wall === wall);
          const width = Math.min(1.1, wallLength(room, wall));
          room.openings!.push(opening("door", wall, taken ? Math.max(0, wallLength(room, wall) - width - 0.4) : centred(room, wall, width), width));
          entranceMade = true;
        }
      }
    }
    return { ...floor, rooms: rooms.map((r) => (r.openings && r.openings.length ? r : { ...r, openings: undefined })).map(({ openings, ...rest }) => (openings && openings.length ? { ...rest, openings } : rest)) };
  });
}
