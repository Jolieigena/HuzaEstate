import type { Property } from "@/lib/properties/types";

export type PropertyCategory = Property["propertyType"];

/** The property categories an organisation can be limited to. Same three buckets every listing is
 *  filed under (Property["propertyType"]). */
export const PROPERTY_CATEGORY_OPTIONS: { value: PropertyCategory; label: string }[] = [
  { value: "apartment", label: "Apartments" },
  { value: "house", label: "Houses" },
  { value: "land", label: "Land" },
];

/** "Kicukiro, Gasabo" — or "Whole country" when an organisation isn't limited to any districts. */
export function describeDistricts(districts: string[] | undefined): string {
  return districts?.length ? districts.join(", ") : "Whole country";
}

/** "Apartments, Land" — or "All categories" when the organisation isn't limited to any. */
export function describePropertyCategories(types: string[] | undefined): string {
  if (!types?.length) return "All categories";
  return PROPERTY_CATEGORY_OPTIONS.filter((o) => types.includes(o.value)).map((o) => o.label).join(", ");
}
