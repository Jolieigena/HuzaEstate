"use client";

import { useId } from "react";
import { HouseholdBrief, ProjectBasics, PROPERTY_USE_LABELS, PropertyUse, ROOM_LABELS, RoomKey } from "@/lib/build/types";
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

/** The short path's first screen: where the home is, what it is for, and its size in floors, bedrooms and bathrooms. */
export default function BriefQuickHome({
  basics,
  household,
  onChangeBasics,
  onChangeHousehold,
  errors,
}: {
  basics: ProjectBasics;
  household: HouseholdBrief;
  onChangeBasics: (patch: Partial<ProjectBasics>) => void;
  onChangeHousehold: (patch: Partial<HouseholdBrief>) => void;
  errors: StepErrors;
}) {
  const ids = { country: useId(), city: useId() };
  const quantityOf = (key: RoomKey) => household.rooms.find((r) => r.key === key)?.quantity ?? 0;

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

      <Field label="Intended property use" htmlFor="quick-property-use" required error={errors.propertyUse}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.entries(PROPERTY_USE_LABELS) as [PropertyUse, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChangeBasics({ propertyUse: key })}
              aria-pressed={basics.propertyUse === key}
              className={`rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                basics.propertyUse === key ? "border-[#2ec440] bg-[#2ec440]/10 text-[#2ec440]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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
    </div>
  );
}
