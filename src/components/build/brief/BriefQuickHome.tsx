"use client";

import { useId } from "react";
import { HouseholdBrief, PlotInfo, ProjectBasics, ROOM_LABELS, RoomKey } from "@/lib/build/types";
import { StepErrors } from "@/lib/build/briefValidation";
import { Field, Toggle, inputClass } from "./FormField";

function Choices({ options, selected, onPick }: { options: number[]; selected: number; onPick: (value: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((n) => (
        <Toggle key={n} pressed={selected === n} onClick={() => onPick(n)}>
          {n}
        </Toggle>
      ))}
    </div>
  );
}

/** The spaces that can be ticked on the short path; bedrooms and bathrooms have their own rows. */
export const QUICK_EXTRA_ROOMS: RoomKey[] = ["living_rooms", "dining_spaces", "home_office", "guest_room", "laundry", "storage", "staff_quarters", "balcony", "terrace", "garden"];

/** The short path's first screen: where the home is, the plot, and its size in floors, bedrooms, bathrooms, spaces and parking. */
export default function BriefQuickHome({
  basics,
  household,
  plot,
  onChangeBasics,
  onChangeHousehold,
  onChangePlot,
  errors,
}: {
  basics: ProjectBasics;
  household: HouseholdBrief;
  plot: PlotInfo;
  onChangeBasics: (patch: Partial<ProjectBasics>) => void;
  onChangeHousehold: (patch: Partial<HouseholdBrief>) => void;
  onChangePlot: (patch: Partial<PlotInfo>) => void;
  errors: StepErrors;
}) {
  const ids = { country: useId(), city: useId(), plot: useId(), notes: useId() };
  const quantityOf = (key: RoomKey) => household.rooms.find((r) => r.key === key)?.quantity ?? 0;

  const toggleRoom = (key: RoomKey) => {
    const exists = household.rooms.some((r) => r.key === key);
    onChangeHousehold({ rooms: exists ? household.rooms.filter((r) => r.key !== key) : [...household.rooms, { key, label: ROOM_LABELS[key], quantity: 1, privacy: "private", isCustom: false }] });
  };

  const setQuantity = (key: RoomKey, quantity: number) => {
    const exists = household.rooms.some((r) => r.key === key);
    onChangeHousehold({
      rooms: exists
        ? household.rooms.map((r) => (r.key === key ? { ...r, quantity } : r))
        : [...household.rooms, { key, label: ROOM_LABELS[key], quantity, privacy: "private", isCustom: false }],
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Country" htmlFor={ids.country} required error={errors.countryValue}>
          <input id={ids.country} type="text" value={basics.countryValue} onChange={(e) => onChangeBasics({ countryValue: e.target.value })} className={inputClass(Boolean(errors.countryValue))} />
        </Field>
        <Field label="Province or city" htmlFor={ids.city} required error={errors.provinceOrCity}>
          <input id={ids.city} type="text" placeholder="e.g. Kigali" value={basics.provinceOrCity} onChange={(e) => onChangeBasics({ provinceOrCity: e.target.value })} className={inputClass(Boolean(errors.provinceOrCity))} />
        </Field>
      </div>

      <Field label="Plot size (sqm)" htmlFor={ids.plot} error={errors.areaSqm}>
        <input
          id={ids.plot}
          type="number"
          min={0}
          placeholder="e.g. 600"
          value={plot.areaSqm ?? ""}
          onChange={(e) => onChangePlot({ areaSqm: e.target.value === "" ? null : Number(e.target.value) })}
          className={inputClass(Boolean(errors.areaSqm))}
        />
      </Field>

      <div>
        <p className="mb-1.5 text-sm font-bold text-slate-700">Floors</p>
        {errors.floors && (
          <p className="mb-2 text-xs font-semibold text-red-600" role="alert">
            {errors.floors}
          </p>
        )}
        <Choices options={[1, 2, 3, 4]} selected={household.floors} onPick={(floors) => onChangeHousehold({ floors })} />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-bold text-slate-700">
          Bedrooms <span className="text-red-500">*</span>
        </p>
        {errors.bedrooms && (
          <p className="mb-2 text-xs font-semibold text-red-600" role="alert">
            {errors.bedrooms}
          </p>
        )}
        <Choices options={[1, 2, 3, 4, 5, 6]} selected={quantityOf("bedrooms")} onPick={(n) => setQuantity("bedrooms", n)} />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-bold text-slate-700">Bathrooms</p>
        <Choices options={[1, 2, 3, 4]} selected={quantityOf("bathrooms")} onPick={(n) => setQuantity("bathrooms", n)} />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-bold text-slate-700">Other spaces</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_EXTRA_ROOMS.map((key) => (
            <Toggle key={key} pressed={household.rooms.some((r) => r.key === key)} onClick={() => toggleRoom(key)}>
              {ROOM_LABELS[key]}
            </Toggle>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-bold text-slate-700">Parking spaces</p>
        <Choices options={[0, 1, 2, 3, 4]} selected={household.parkingSpaces} onPick={(parkingSpaces) => onChangeHousehold({ parkingSpaces })} />
      </div>

      <Field label="Anything else we should know?" htmlFor={ids.notes}>
        <textarea
          id={ids.notes}
          rows={3}
          maxLength={600}
          value={household.notes ?? ""}
          onChange={(e) => onChangeHousehold({ notes: e.target.value })}
          className={`${inputClass()} resize-none`}
        />
      </Field>
    </div>
  );
}
