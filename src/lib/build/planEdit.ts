import { ManualFloor, ManualRoom, ManualRoomType, MANUAL_ROOM_TYPE_LABELS } from "./types";
import { newId } from "./factory";

/** A sensible size, in metres, for a room of each type when it is added by hand. */
const DEFAULT_SIZE: Record<ManualRoomType, [number, number]> = {
  living_room: [5, 4],
  dining_room: [3.5, 3.5],
  kitchen: [3.5, 3],
  bedroom: [3.5, 3.5],
  bathroom: [2, 2.5],
  home_office: [3, 3],
  laundry: [2, 2],
  storage: [2, 2],
  pantry: [1.5, 2],
  garage: [3, 5.5],
  balcony: [3, 1.5],
  terrace: [4, 3],
  open_space: [4, 4],
  hallway: [1.5, 4],
  staircase: [2, 3.5],
  custom: [3, 3],
};

export const MIN_ROOM_SIZE = 1.2;
export const MAX_ROOM_SIZE = 40;

/** The rooms of a floor that overlap another room (walls that only touch do not count). */
export function overlappingRoomIds(floor: ManualFloor): Set<string> {
  const flagged = new Set<string>();
  const rooms = floor.rooms;
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i];
      const b = rooms[j];
      const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (overlapX > 0.15 && overlapY > 0.15) {
        flagged.add(a.id);
        flagged.add(b.id);
      }
    }
  }
  return flagged;
}

/** A new room, placed against the right-hand side of the plan so it overlaps nothing; the person then drags it where it belongs. */
export function newRoom(floor: ManualFloor, type: ManualRoomType): ManualRoom {
  const [w, h] = DEFAULT_SIZE[type];
  const right = floor.rooms.reduce((max, r) => Math.max(max, r.x + r.w), 0);
  const same = floor.rooms.filter((r) => r.type === type).length;
  const label = MANUAL_ROOM_TYPE_LABELS[type];
  return { id: newId("room"), type, name: same > 0 && type !== "custom" ? `${label} ${same + 1}` : label, x: right, y: 0, w, h };
}

export const clampSize = (value: number) => Math.min(MAX_ROOM_SIZE, Math.max(MIN_ROOM_SIZE, Math.round(value * 2) / 2));
