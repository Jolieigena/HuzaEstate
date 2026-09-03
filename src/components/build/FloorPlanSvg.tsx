"use client";

import { ManualFloor, ManualRoom, MANUAL_ROOM_TYPE_LABELS } from "@/lib/build/types";

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
  hallway: "#f1f5f9",
  staircase: "#fde68a",
  custom: "#f5f5f4",
};

const UNIT = 18; // px per metre

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
                rx={4}
              />
              <text x={room.x * UNIT + 6} y={room.y * UNIT + 16} fontSize="10" fontWeight="700" fill="#334155">
                {room.name}
              </text>
              <text x={room.x * UNIT + 6} y={room.y * UNIT + room.h * UNIT - 6} fontSize="9" fill="#64748b">
                {(room.w).toFixed(1)}m × {(room.h).toFixed(1)}m
              </text>
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
