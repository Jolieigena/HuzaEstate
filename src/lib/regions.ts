// Region/district reference data for org-admin staff scoping and property/professional
// tagging — same hand-authored static-list convention lib/countries.ts already uses (the
// backend just stores whatever string the frontend sends, verbatim, same as it does for
// country/city today). Only Rwanda is covered at launch; every other country simply has no
// entry here, which every picker that calls districtsForCountry() treats as "no district level
// for this country" and renders nothing — existing behavior (whole-country scoping only) is
// unaffected for any country without an entry.

export interface RegionOption {
  /** The province/region name — the grouping level above district. */
  region: string;
  districts: string[];
}

const RWANDA_REGIONS: RegionOption[] = [
  { region: "Kigali City", districts: ["Gasabo", "Kicukiro", "Nyarugenge"] },
  { region: "Northern Province", districts: ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"] },
  { region: "Southern Province", districts: ["Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango"] },
  { region: "Eastern Province", districts: ["Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana"] },
  { region: "Western Province", districts: ["Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro"] },
];

const COUNTRY_REGIONS: Record<string, RegionOption[]> = {
  Rwanda: RWANDA_REGIONS,
};

/** Undefined means this country has no region/district data — callers should render no district
 *  picker at all and fall back to whole-country scoping/tagging, exactly like today. */
export function regionsForCountry(country: string): RegionOption[] | undefined {
  return COUNTRY_REGIONS[country];
}

/** Every district name across every region of a country, flattened — used for validating a
 *  scope selection and for simple (non-grouped) district dropdowns. */
export function districtsForCountry(country: string): string[] {
  return (COUNTRY_REGIONS[country] ?? []).flatMap((r) => r.districts);
}

/** Which province/region a given district belongs to, within one country — undefined if the
 *  district isn't recognized for that country. */
export function regionOfDistrict(country: string, district: string): string | undefined {
  return COUNTRY_REGIONS[country]?.find((r) => r.districts.includes(district))?.region;
}
