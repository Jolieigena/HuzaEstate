"use client";

import { useId, useState } from "react";
import SidePane from "@/components/shared/SidePane";
import Select from "@/components/shared/Select";
import { ManualFloor, ManualRoom, ManualRoomType, MANUAL_ROOM_TYPE_LABELS } from "@/lib/build/types";
import { MAX_ROOM_SIZE, MIN_ROOM_SIZE, clampSize } from "@/lib/build/planEdit";

const TYPES = Object.entries(MANUAL_ROOM_TYPE_LABELS) as [ManualRoomType, string][];
const field = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm transition-colors focus:border-[#2ec440] focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20";

/** The pane beside the plan while it is being edited by hand: the chosen room's name, type and size, and a way to add or remove rooms. */
export default function PlanEditPanel({
  floors,
  selected,
  overlapping,
  onChangeRoom,
  onDeleteRoom,
  onAddRoom,
  onClose,
}: {
  floors: ManualFloor[];
  selected: ManualRoom | null;
  /** How many rooms overlap another room right now. */
  overlapping: number;
  onChangeRoom: (roomId: string, patch: Partial<ManualRoom>) => void;
  onDeleteRoom: (roomId: string) => void;
  onAddRoom: (floorId: string, type: ManualRoomType) => void;
  onClose: () => void;
}) {
  const ids = { name: useId(), type: useId(), width: useId(), length: useId(), floor: useId(), add: useId() };
  const [addType, setAddType] = useState<ManualRoomType>("bedroom");
  const [addFloor, setAddFloor] = useState("");
  const floorOfSelected = selected ? floors.find((f) => f.rooms.some((r) => r.id === selected.id))?.id : undefined;
  const targetFloor = addFloor && floors.some((f) => f.id === addFloor) ? addFloor : (floorOfSelected ?? floors[0]?.id ?? "");

  return (
    <SidePane open onClose={onClose} title="Edit plan">
      {selected ? (
        <div className="mb-6 space-y-4">
          <div>
            <label htmlFor={ids.name} className="mb-1.5 block text-sm font-bold text-slate-700">Name</label>
            <input id={ids.name} type="text" maxLength={40} value={selected.name} onChange={(e) => onChangeRoom(selected.id, { name: e.target.value })} className={field} />
          </div>
          <div>
            <label htmlFor={ids.type} className="mb-1.5 block text-sm font-bold text-slate-700">Type</label>
            <Select
              id={ids.type}
              value={selected.type}
              onChange={(e) => {
                const type = e.target.value as ManualRoomType;
                // A room still called by its old type's name takes the new one.
                const renamed = selected.name === MANUAL_ROOM_TYPE_LABELS[selected.type] ? { name: MANUAL_ROOM_TYPE_LABELS[type] } : {};
                onChangeRoom(selected.id, { type, ...renamed });
              }}
              className={field}
            >
              {TYPES.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={ids.width} className="mb-1.5 block text-sm font-bold text-slate-700">Width (m)</label>
              <input id={ids.width} type="number" step={0.5} min={MIN_ROOM_SIZE} max={MAX_ROOM_SIZE} value={selected.w} onChange={(e) => onChangeRoom(selected.id, { w: clampSize(Number(e.target.value) || MIN_ROOM_SIZE) })} className={field} />
            </div>
            <div>
              <label htmlFor={ids.length} className="mb-1.5 block text-sm font-bold text-slate-700">Length (m)</label>
              <input id={ids.length} type="number" step={0.5} min={MIN_ROOM_SIZE} max={MAX_ROOM_SIZE} value={selected.h} onChange={(e) => onChangeRoom(selected.id, { h: clampSize(Number(e.target.value) || MIN_ROOM_SIZE) })} className={field} />
            </div>
          </div>
          <button type="button" onClick={() => onDeleteRoom(selected.id)} className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50">
            Delete room
          </button>
        </div>
      ) : null}

      <div className={selected ? "border-t border-slate-100 pt-5" : ""}>
        <p className="mb-3 text-sm font-bold text-slate-700">Add a room</p>
        <div className="space-y-3">
          {floors.length > 1 && (
            <Select aria-label="Floor" value={targetFloor} onChange={(e) => setAddFloor(e.target.value)} className={field}>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          )}
          <Select aria-label="Room type" id={ids.add} value={addType} onChange={(e) => setAddType(e.target.value as ManualRoomType)} className={field}>
            {TYPES.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
          <button type="button" disabled={!targetFloor} onClick={() => onAddRoom(targetFloor, addType)} className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2ec440] disabled:opacity-50">
            Add room
          </button>
        </div>
      </div>

      {overlapping > 0 && (
        <p role="alert" className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {overlapping} room{overlapping === 1 ? "" : "s"} overlap{overlapping === 1 ? "s" : ""} another room.
        </p>
      )}
    </SidePane>
  );
}
