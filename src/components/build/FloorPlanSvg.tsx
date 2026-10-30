"use client";

import { ManualFloor, ManualOpening, ManualRoom, MANUAL_ROOM_TYPE_LABELS, WallSide } from "@/lib/build/types";
import { clampOpening } from "@/lib/build/openings";

const ROOM_COLORS: Record<string, string> = {
  living_room: "#dcfce7",
  dining_room: "#fef3c7",
  kitchen: "#fee2e2",
  bedroom: "#dbeafe",
  bathroom: "#e0e7ff",
  home_office: "#f3e8ff",
  laundry: "#e2e8f0",
  storage: "#e2e8f0",
  pantry: "#fef9c3",
  garage: "#e2e8f0",
  balcony: "#d1fae5",
  terrace: "#d1fae5",
  open_space: "#ecfccb",
  hallway: "#f1f5f9",
  staircase: "#fde68a",
  custom: "#f5f5f4",
};

const UNIT = 18; // px per metre

// For each wall: where it starts, the direction it runs in, and the way into the room.
function wallFrame(room: ManualRoom, wall: WallSide) {
  const x = room.x * UNIT;
  const y = room.y * UNIT;
  const w = room.w * UNIT;
  const h = room.h * UNIT;
  switch (wall) {
    case "top": return { sx: x, sy: y, dx: 1, dy: 0, nx: 0, ny: 1 };
    case "bottom": return { sx: x, sy: y + h, dx: 1, dy: 0, nx: 0, ny: -1 };
    case "left": return { sx: x, sy: y, dx: 0, dy: 1, nx: 1, ny: 0 };
    case "right": return { sx: x + w, sy: y, dx: 0, dy: 1, nx: -1, ny: 0 };
  }
}

/** A window (a double line in the wall) or a door (a gap in the wall with its swing). */
function Opening({ room, opening }: { room: ManualRoom; opening: ManualOpening }) {
  const o = clampOpening(room, opening);
  const f = wallFrame(room, o.wall);
  const x1 = f.sx + f.dx * o.offset * UNIT;
  const y1 = f.sy + f.dy * o.offset * UNIT;
  const len = o.width * UNIT;
  const x2 = x1 + f.dx * len;
  const y2 = y1 + f.dy * len;
  if (o.kind === "window") {
    return (
      <g pointerEvents="none">
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0ea5e9" strokeWidth={5} strokeLinecap="butt" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e0f2fe" strokeWidth={2} strokeLinecap="butt" />
      </g>
    );
  }
  // The leaf is hinged at the start of the opening and swings into the room.
  const lx = x1 + f.nx * len;
  const ly = y1 + f.ny * len;
  const sweep = f.dx * f.ny - f.dy * f.nx > 0 ? 1 : 0;
  return (
    <g pointerEvents="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffffff" strokeWidth={5} strokeLinecap="butt" />
      <line x1={x1} y1={y1} x2={lx} y2={ly} stroke="#92400e" strokeWidth={1.6} />
      <path d={`M ${x2} ${y2} A ${len} ${len} 0 0 ${sweep} ${lx} ${ly}`} fill="none" stroke="#92400e" strokeWidth={0.8} strokeDasharray="2 2" />
    </g>
  );
}

interface FloorPlanSvgProps {
  floor: ManualFloor;
  selectedRoomId?: string | null;
  onSelectRoom?: (room: ManualRoom) => void;
  interactive?: boolean;
  onDragRoom?: (roomId: string, x: number, y: number) => void;
  onDragEnd?: (roomId: string, x: number, y: number) => void;
  zoom?: number;
}

export default function FloorPlanSvg({ floor, selectedRoomId, onSelectRoom, interactive = false, onDragRoom, onDragEnd, zoom = 1 }: FloorPlanSvgProps) {
  if (floor.rooms.length === 0) {
    return <div className="flex items-center justify-center h-64 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">No rooms on this floor yet.</div>;
  }

  const maxX = Math.max(...floor.rooms.map((r) => r.x + r.w)) + 1;
  const maxY = Math.max(...floor.rooms.map((r) => r.y + r.h)) + 1;
  const width = maxX * UNIT;
  const height = maxY * UNIT;

  const handlePointerDown = (room: ManualRoom, e: React.PointerEvent<SVGGElement>) => {
    if (!interactive || !onDragRoom) return;
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const originX = room.x;
    const originY = room.y;
    let lastX = originX;
    let lastY = originY;

    const handleMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / (UNIT * zoom);
      const dy = (moveEvent.clientY - startY) / (UNIT * zoom);
      const snappedX = Math.max(0, Math.round((originX + dx) * 2) / 2);
      const snappedY = Math.max(0, Math.round((originY + dy) * 2) / 2);
      lastX = snappedX;
      lastY = snappedY;
      onDragRoom(room.id, snappedX, snappedY);
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      onDragEnd?.(room.id, lastX, lastY);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <div className="overflow-auto bg-slate-50 rounded-2xl border border-slate-200 p-4">
      <svg
        width={width * zoom}
        height={height * zoom}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Conceptual floor plan for ${floor.name}`}
        className="max-w-none"
      >
        {floor.rooms.map((room) => {
          const isSelected = room.id === selectedRoomId;
          return (
            <g
              key={room.id}
              onPointerDown={(e) => handlePointerDown(room, e)}
              onClick={() => onSelectRoom?.(room)}
              className={interactive ? "cursor-move" : onSelectRoom ? "cursor-pointer" : ""}
            >
              <rect
                x={room.x * UNIT}
                y={room.y * UNIT}
                width={room.w * UNIT}
                height={room.h * UNIT}
                fill={ROOM_COLORS[room.type] ?? ROOM_COLORS.custom}
                stroke={isSelected ? "#2ec440" : "#94a3b8"}
                strokeWidth={isSelected ? 2.5 : 1}
                strokeDasharray={room.type === "open_space" ? "5 3" : undefined}
                rx={4}
              />
              <text x={room.x * UNIT + 6} y={room.y * UNIT + 16} fontSize="10" fontWeight="700" fill="#334155">
                {room.name}
              </text>
              <text x={room.x * UNIT + 6} y={room.y * UNIT + room.h * UNIT - 6} fontSize="9" fill="#64748b">
                {(room.w).toFixed(1)}m × {(room.h).toFixed(1)}m
              </text>
              {(room.openings ?? []).map((opening) => (
                <Opening key={opening.id} room={room} opening={opening} />
              ))}
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-slate-400 mt-3">Conceptual layout — not a measured technical drawing.</p>
    </div>
  );
}

export function roomTypeLabel(type: string): string {
  return MANUAL_ROOM_TYPE_LABELS[type as keyof typeof MANUAL_ROOM_TYPE_LABELS] ?? type;
}
