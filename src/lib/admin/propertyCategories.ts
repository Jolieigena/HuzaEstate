import { PROPERTY_LABEL_GROUPS } from "@/lib/properties/types";

/** Every property type an organisation can be limited to, grouped for the picker. Same labels sellers
 *  choose from when they post, so a limit to "Villa" means listings posted as villas. */
export const PROPERTY_CATEGORY_GROUPS = PROPERTY_LABEL_GROUPS;

/** "Villa, Condo" - or "All categories" when an organisation is not limited to any. */
export function describePropertyCategories(types: string[] | undefined): string {
  return types?.length ? types.join(", ") : "All categories";
}

/** One organisation's per-country region limits as { country: [districts] }; entries with no districts are dropped. */
export type RegionScopeMap = Record<string, string[]>;

export function scopesToMap(scopes: { country: string; districts: string[] }[] | undefined): RegionScopeMap {
  const map: RegionScopeMap = {};
  for (const s of scopes ?? []) if (s.districts?.length) map[s.country] = s.districts;
  return map;
}

/** Every district named in an organisation's region limits, for pickers that only offer those. Empty = no limit. */
export function allowedDistricts(scopes: { country: string; districts: string[] }[] | undefined): string[] {
  return (scopes ?? []).flatMap((s) => s.districts ?? []);
}

export function mapToScopes(map: RegionScopeMap): { country: string; districts: string[] }[] {
  return Object.entries(map).filter(([, districts]) => districts.length).map(([country, districts]) => ({ country, districts }));
}

/** "Rwanda: Gasabo, Kicukiro · Kenya: Nairobi City" - or "Whole country" when nothing is limited. */
export function describeRegionScopes(scopes: { country: string; districts: string[] }[] | undefined): string {
  const limited = (scopes ?? []).filter((s) => s.districts?.length);
  return limited.length ? limited.map((s) => `${s.country}: ${s.districts.join(", ")}`).join(" \u00b7 ") : "Whole country";
}
