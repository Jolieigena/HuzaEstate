"use client";

import { useId } from "react";
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
  onResizeRoom?: (roomId: string, w: number, h: number) => void;
  /** Rooms drawn with a red outline because they overlap another room. */
  flaggedRoomIds?: Set<string>;
  zoom?: number;
}

const MARGIN = 1; // metres of white space right of and below the plan
const EDIT_MARGIN = 4; // more of it while editing, so a room can be dragged out to the edge

/** The size in pixels of a floor's drawing at zoom 1 (used to lay several floors out in one downloaded picture). */
export function floorPlanSize(floor: ManualFloor, margin: number = MARGIN): { width: number; height: number } {
  const maxX = Math.max(1, ...floor.rooms.map((r) => r.x + r.w)) + margin;
  const maxY = Math.max(1, ...floor.rooms.map((r) => r.y + r.h)) + margin;
  return { width: maxX * UNIT, height: maxY * UNIT };
}

// ---- Labels that fit their room ----------------------------------------------------------------------------------------------------

const PAD = 3;
const CHAR = 0.56; // the average width of a bold letter, as a share of the font size

/** The words split into lines of at most `maxChars` letters, or nothing when one word is longer than a line. */
function wrapWords(name: string, maxChars: number): string[] | null {
  const lines: string[] = [];
  let line = "";
  for (const word of name.split(/\s+/).filter(Boolean)) {
    if (word.length > maxChars) return null;
    if (!line) line = word;
    else if (line.length + 1 + word.length <= maxChars) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

type Label = { lines: string[]; size: number };

/** The largest size (up to 11) at which the name fits the box, wrapped onto as many lines as needed; cut short only as a last resort. */
function fitName(name: string, availW: number, availH: number): Label | null {
  for (let size = 11; size >= 5.5; size -= 0.5) {
    const maxChars = Math.floor(availW / (size * CHAR));
    if (maxChars < 2) break;
    const lines = wrapWords(name, maxChars);
    if (lines && lines.length * size * 1.15 <= availH) return { lines, size };
  }
  const size = 5.5;
  const maxChars = Math.floor(availW / (size * CHAR));
  if (maxChars < 2 || availH < size * 1.15) return null;
  return { lines: [name.length <= maxChars ? name : `${name.slice(0, maxChars - 1)}…`], size };
}

type RoomLabel = { name: Label; sideways: boolean; dims: string | null };

function labelFor(room: ManualRoom): RoomLabel | null {
  const width = room.w * UNIT;
  const height = room.h * UNIT;
  const full = `${room.w.toFixed(1)}m × ${room.h.toFixed(1)}m`;
  const short = `${room.w.toFixed(1)}×${room.h.toFixed(1)}`;
  const dimsFit = (text: string) => text.length * 8 * 0.56 <= width - PAD * 2;
  const dims = dimsFit(full) ? full : dimsFit(short) ? short : null;

  // Across the room, with the size at the foot when there is space for both.
  const withDims = dims ? fitName(room.name, width - PAD * 2, height - PAD * 2 - 11) : null;
  if (withDims && withDims.size >= 7) return { name: withDims, sideways: false, dims };
  const across = fitName(room.name, width - PAD * 2, height - PAD * 2);
  // A tall, narrow room reads better with its name turned on its side.
  if (height > width && (!across || across.size < 7.5)) {
    const sideways = fitName(room.name, height - PAD * 2, width - PAD * 2);
    if (sideways && (!across || sideways.size > across.size)) return { name: sideways, sideways: true, dims: null };
  }
  return across ? { name: across, sideways: false, dims: null } : null;
}

function RoomText({ room }: { room: ManualRoom }) {
  const label = labelFor(room);
  if (!label) return null;
  const x = room.x * UNIT;
  const y = room.y * UNIT;
  const { name, sideways, dims } = label;
  const lineHeight = name.size * 1.15;

  if (sideways) {
    const cx = x + (room.w * UNIT) / 2;
    const cy = y + (room.h * UNIT) / 2;
    return (
      <g pointerEvents="none" fill="#334155" fontWeight="700" fontSize={name.size} textAnchor="middle" transform={`rotate(-90 ${cx} ${cy})`}>
        {name.lines.map((line, i) => (
          <text key={i} x={cx} y={cy - ((name.lines.length - 1) * lineHeight) / 2 + i * lineHeight + name.size * 0.35}>
            {line}
          </text>
        ))}
      </g>
    );
  }
  return (
    <g pointerEvents="none">
      <text x={x + PAD} y={y + PAD + name.size} fontSize={name.size} fontWeight="700" fill="#334155">
        {name.lines.map((line, i) => (
          <tspan key={i} x={x + PAD} dy={i === 0 ? 0 : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
      {dims && (
        <text x={x + PAD} y={y + room.h * UNIT - PAD - 1} fontSize="8" fill="#64748b">
          {dims}
        </text>
      )}
    </g>
  );
}

/** Just the drawing of one floor, with no frame around it. */
export function FloorPlanGraphic({ floor, selectedRoomId, onSelectRoom, interactive = false, onDragRoom, onDragEnd, onResizeRoom, flaggedRoomIds, zoom = 1 }: FloorPlanSvgProps) {
  const { width, height } = floorPlanSize(floor, interactive ? EDIT_MARGIN : MARGIN);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  // How many screen pixels one metre is right now: the drawing may be stretched to its box, so it is measured, not assumed.
  const pixelsPerMetre = (svg: SVGSVGElement | null) => {
    const box = svg?.getBoundingClientRect();
    return box && box.width > 0 ? box.width / (width / UNIT) : UNIT * zoom;
  };

  const handlePointerDown = (room: ManualRoom, e: React.PointerEvent<SVGGElement>) => {
    if (!interactive) return;
    onSelectRoom?.(room);
    if (!onDragRoom || e.button > 0) return;
    const svg = e.currentTarget.ownerSVGElement;
    const scale = pixelsPerMetre(svg);
    e.currentTarget.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const originX = room.x;
    const originY = room.y;
    let lastX = originX;
    let lastY = originY;

    const handleMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      lastX = Math.max(0, Math.round((originX + dx) * 2) / 2);
      lastY = Math.max(0, Math.round((originY + dy) * 2) / 2);
      onDragRoom(room.id, lastX, lastY);
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      onDragEnd?.(room.id, lastX, lastY);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const handleResizeDown = (room: ManualRoom, e: React.PointerEvent<SVGRectElement>) => {
    if (!onResizeRoom || e.button > 0) return;
    e.stopPropagation();
    const scale = pixelsPerMetre(e.currentTarget.ownerSVGElement);
    const startX = e.clientX;
    const startY = e.clientY;
    const handleMove = (moveEvent: PointerEvent) => {
      const w = Math.min(40, Math.max(1.2, Math.round((room.w + (moveEvent.clientX - startX) / scale) * 2) / 2));
      const h = Math.min(40, Math.max(1.2, Math.round((room.h + (moveEvent.clientY - startY) / scale) * 2) / 2));
      onResizeRoom(room.id, w, h);
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <svg
      width={width * zoom}
      height={height * zoom}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Conceptual floor plan for ${floor.name}`}
      className="max-w-none"
      style={interactive ? { touchAction: "none" } : undefined}
    >
      <defs>
        {floor.rooms.map((room) => (
          <clipPath key={room.id} id={`${uid}${room.id.replace(/[^a-zA-Z0-9_-]/g, "")}`}>
            <rect x={room.x * UNIT} y={room.y * UNIT} width={room.w * UNIT} height={room.h * UNIT} rx={4} />
          </clipPath>
        ))}
      </defs>
      {floor.rooms.map((room) => {
        const isSelected = room.id === selectedRoomId;
        const flagged = flaggedRoomIds?.has(room.id);
        return (
          <g
            key={room.id}
            onPointerDown={(e) => handlePointerDown(room, e)}
            onClick={() => onSelectRoom?.(room)}
            className={interactive ? "cursor-move" : onSelectRoom ? "cursor-pointer" : ""}
          >
            <title>{room.name}</title>
            <rect
              x={room.x * UNIT}
              y={room.y * UNIT}
              width={room.w * UNIT}
              height={room.h * UNIT}
              fill={ROOM_COLORS[room.type] ?? ROOM_COLORS.custom}
              stroke={flagged ? "#ef4444" : isSelected ? "#2ec440" : "#94a3b8"}
              strokeWidth={isSelected || flagged ? 2.5 : 1}
              strokeDasharray={room.type === "open_space" ? "5 3" : undefined}
              rx={4}
            />
            {(room.openings ?? []).map((opening) => (
              <Opening key={opening.id} room={room} opening={opening} />
            ))}
            <g clipPath={`url(#${uid}${room.id.replace(/[^a-zA-Z0-9_-]/g, "")})`}>
              <RoomText room={room} />
            </g>
            {interactive && isSelected && onResizeRoom && (
              <rect
                x={(room.x + room.w) * UNIT - 7}
                y={(room.y + room.h) * UNIT - 7}
                width={11}
                height={11}
                rx={3}
                fill="#2ec440"
                stroke="#ffffff"
                strokeWidth={1.5}
                className="cursor-nwse-resize"
                onPointerDown={(e) => handleResizeDown(room, e)}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function FloorPlanSvg(props: FloorPlanSvgProps) {
  if (props.floor.rooms.length === 0) {
    return <div className="flex items-center justify-center h-64 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">No rooms on this floor yet.</div>;
  }
  return (
    <div className="overflow-auto bg-slate-50 rounded-2xl border border-slate-200 p-4">
      <FloorPlanGraphic {...props} />
      <p className="text-xs text-slate-400 mt-3">Conceptual layout — not a measured technical drawing.</p>
    </div>
  );
}

export function roomTypeLabel(type: string): string {
  return MANUAL_ROOM_TYPE_LABELS[type as keyof typeof MANUAL_ROOM_TYPE_LABELS] ?? type;
}
