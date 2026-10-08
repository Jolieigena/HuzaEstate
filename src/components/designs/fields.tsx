"use client";

import { useState } from "react";
import Select from "@/components/shared/Select";
import { MAJOR_CURRENCIES, useCurrencyOptions } from "@/lib/currencies";

/** What a design or request is about, as a pick list so nobody has to type it. Interior and exterior
 *  have their own lists; a request for a brand new design offers both. */
export const INTERIOR_SPACES = ["Living room", "Bedroom", "Kitchen", "Bathroom", "Dining room", "Home office", "Kids room", "Entrance hall", "Whole apartment"];
export const EXTERIOR_SPACES = ["Whole house", "Facade", "Garden", "Terrace", "Driveway and entrance", "Roof", "Fence and gate"];
export const ALL_SPACES = [...INTERIOR_SPACES, ...EXTERIOR_SPACES];

export function spacesFor(category?: "interior" | "exterior"): string[] {
  return category === "interior" ? INTERIOR_SPACES : category === "exterior" ? EXTERIOR_SPACES : ALL_SPACES;
}

type SelectFieldProps = { value: string; onChange: (value: string) => void; className?: string; ariaLabel?: string };

/** A pick list of spaces. A value saved earlier that is not on the list stays selectable. */
export function SpaceSelect({ value, onChange, category, className, ariaLabel = "Space", placeholder = "Choose a space" }: SelectFieldProps & { category?: "interior" | "exterior"; placeholder?: string }) {
  const options = spacesFor(category);
  const all = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <Select className={className} value={value} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {all.map((space) => (
        <option key={space} value={space}>
          {space}
        </option>
      ))}
    </Select>
  );
}

/** The currency to use: the one the person picked, otherwise their local one (see lib/currencies). */
export function useCurrencyChoice(initial = ""): { currency: string; setCurrency: (value: string) => void } {
  const { defaultCurrency } = useCurrencyOptions();
  const [choice, setChoice] = useState(initial);
  return { currency: choice || defaultCurrency, setCurrency: setChoice };
}

/** A currency pick list: the usual major currencies plus the visitor's local one. */
export function CurrencySelect({ value, onChange, className, ariaLabel = "Currency" }: SelectFieldProps) {
  const { options } = useCurrencyOptions();
  const list = Array.from(new Set([...(MAJOR_CURRENCIES as readonly string[]), ...options, ...(value ? [value] : [])]));
  return (
    <Select className={className} value={value} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value)}>
      {list.map((code) => (
        <option key={code} value={code}>
          {code}
        </option>
      ))}
    </Select>
  );
}

/** A pick list of whole numbers of days, e.g. how long a quote stays valid or how long delivery takes. */
export function DaysSelect({ value, onChange, options, className, ariaLabel }: SelectFieldProps & { options: { value: string; label: string }[]; ariaLabel: string }) {
  return (
    <Select className={className} value={value} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
