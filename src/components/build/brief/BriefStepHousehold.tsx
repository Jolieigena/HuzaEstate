"use client";

import { useId, useState } from "react";
import { HouseholdBrief, KitchenType, PrivacyLevel, RoomKey, RoomRequirement, ROOM_LABELS } from "@/lib/build/types";
import { StepErrors } from "@/lib/build/briefValidation";
import { newId } from "@/lib/build/factory";
import { Field, inputClass } from "./FormField";

const KITCHEN_OPTIONS: { key: KitchenType; label: string }[] = [
  { key: "open_plan", label: "Open-plan" },
  { key: "closed", label: "Closed / separate" },
  { key: "galley", label: "Galley" },
  { key: "island", label: "Island" },
];

const PRIVACY_OPTIONS: { key: PrivacyLevel; label: string }[] = [
  { key: "public", label: "Public" },
  { key: "semi_private", label: "Semi-private" },
  { key: "private", label: "Private" },
];

const ROOM_HELPER: Partial<Record<RoomKey, string>> = {
  bedrooms: "Every household needs at least one.",
  ensuite: "A bathroom attached directly to a bedroom.",
  home_office: "A quiet space for remote work or study.",
  staff_quarters: "A separate room or small unit for household staff.",
  courtyard: "An open-air space enclosed by the house on multiple sides.",
};

export default function BriefStepHousehold({ value, onChange, errors }: { value: HouseholdBrief; onChange: (patch: Partial<HouseholdBrief>) => void; errors: StepErrors }) {
  const [customLabel, setCustomLabel] = useState("");
  const floorsId = useId();
  const parkingId = useId();
  const customId = useId();

  const updateRoom = (key: string, patch: Partial<RoomRequirement>) => {
    onChange({ rooms: value.rooms.map((r) => (r.key === key ? { ...r, ...patch } : r)) });
  };

  const addRoom = (key: RoomKey | string, label: string, isCustom = false) => {
    onChange({ rooms: [...value.rooms, { key, label, quantity: 1, privacy: "private", isCustom }] });
  };

  const removeRoom = (key: string) => {
    onChange({ rooms: value.rooms.filter((r) => r.key !== key) });
  };

  const selectedKeys = new Set(value.rooms.map((r) => r.key));
  const availableRooms = (Object.entries(ROOM_LABELS) as [RoomKey, string][]).filter(([key]) => !selectedKeys.has(key));

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Number of floors" htmlFor={floorsId} error={errors.floors}>
          <input
            id={floorsId}
            type="number"
            min={1}
            max={6}
            value={value.floors}
            onChange={(e) => onChange({ floors: Number(e.target.value) || 1 })}
            className={inputClass(Boolean(errors.floors))}
          />
        </Field>
        <Field label="Parking spaces" htmlFor={parkingId}>
          <input id={parkingId} type="number" min={0} value={value.parkingSpaces} onChange={(e) => onChange({ parkingSpaces: Number(e.target.value) || 0 })} className={inputClass()} />
        </Field>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-700 mb-2">Kitchen type</p>
        <div className="flex flex-wrap gap-2">
          {KITCHEN_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange({ kitchenType: opt.key })}
              aria-pressed={value.kitchenType === opt.key}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                value.kitchenType === opt.key ? "bg-[#2ec440]/10 border-[#2ec440] text-[#2ec440]" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-700 mb-2">
          Rooms and spaces <span className="text-red-500">*</span>
        </p>
        {errors.bedrooms && (
          <p className="text-red-600 text-xs font-semibold mb-2" role="alert">
            {errors.bedrooms}
          </p>
        )}
        <p className="text-xs text-slate-400 mb-3">Tap a space to add it, then set how many and any preferences below. No architectural knowledge needed.</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {availableRooms.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => addRoom(key, label)}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:border-[#2ec440] hover:text-[#2ec440] transition-colors"
            >
              + {label}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2 mb-5">
          <div className="flex-grow">
            <label htmlFor={customId} className="block text-xs font-bold text-slate-500 mb-1.5">
              Add a custom space
            </label>
            <input
              id={customId}
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="e.g. Music room"
              className={inputClass()}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (!customLabel.trim()) return;
              addRoom(newId("custom"), customLabel.trim(), true);
              setCustomLabel("");
            }}
            className="bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-5 py-3 rounded-xl transition-colors whitespace-nowrap"
          >
            Add space
          </button>
        </div>

        <div className="space-y-3">
          {value.rooms.map((room) => (
            <div key={room.key} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{room.label}</p>
                  {ROOM_HELPER[room.key as RoomKey] && <p className="text-xs text-slate-400 mt-0.5">{ROOM_HELPER[room.key as RoomKey]}</p>}
                </div>
                <button type="button" onClick={() => removeRoom(room.key)} aria-label={`Remove ${room.label}`} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={room.quantity}
                    onChange={(e) => updateRoom(room.key, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Preferred size (sqm)</label>
                  <input
                    type="number"
                    min={0}
                    value={room.preferredSizeSqm ?? ""}
                    onChange={(e) => updateRoom(room.key, { preferredSizeSqm: e.target.value === "" ? undefined : Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Floor preference</label>
                  <input
                    type="text"
                    value={room.floorPreference ?? ""}
                    onChange={(e) => updateRoom(room.key, { floorPreference: e.target.value })}
                    placeholder="Any"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Privacy</label>
                  <select
                    value={room.privacy ?? "private"}
                    onChange={(e) => updateRoom(room.key, { privacy: e.target.value as PrivacyLevel })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
                  >
                    {PRIVACY_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-bold text-slate-500 mb-1">Adjacency preference (optional)</label>
                <input
                  type="text"
                  value={room.adjacency ?? ""}
                  onChange={(e) => updateRoom(room.key, { adjacency: e.target.value })}
                  placeholder="e.g. Close to the dining area"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
                />
              </div>
            </div>
          ))}
          {value.rooms.length === 0 && <p className="text-slate-400 text-sm italic">No spaces added yet — start with bedrooms above.</p>}
        </div>
      </div>
    </div>
  );
}
