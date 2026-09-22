import type { Property } from "@/lib/properties/types";

// Rwanda plus its immediate East African Community neighbors — this is a
// Rwanda-based platform "adding multi-country," not going global in one
// pass. Extend this array to add more.
export interface CountryOption {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "UG", name: "Uganda", flag: "🇺🇬" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
  { code: "BI", name: "Burundi", flag: "🇧🇮" },
  { code: "CD", name: "DR Congo", flag: "🇨🇩" },
];

export const DEFAULT_COUNTRY = COUNTRY_OPTIONS[0]; // Rwanda

export function findCountry(nameOrCode: string): CountryOption | undefined {
  const t = nameOrCode.trim().toLowerCase();
  if (!t) return undefined;
  return COUNTRY_OPTIONS.find((c) => c.name.toLowerCase() === t || c.code.toLowerCase() === t);
}

/** Every existing listing (mockProperties + everything the real backend has
 *  served so far) predates the `country` field, so this is the single place
 *  that decides what "no country on record" means — Rwanda, since that's
 *  what every listing in this app has been until now. */
export function getPropertyCountry(property: Pick<Property, "country">): CountryOption {
  if (property.country) {
    return findCountry(property.country) ?? DEFAULT_COUNTRY;
  }
  return DEFAULT_COUNTRY;
}
