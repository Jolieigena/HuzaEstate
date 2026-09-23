import type { Property } from "@/lib/properties/types";

export interface CountryOption {
  code: string;
  name: string;
}

/** Every country a listing (or a visitor) could plausibly be in, not just
 *  Rwanda and its EAC neighbors — a visitor typing any country into the
 *  /properties Country filter should get a real match (and a correct "no
 *  results" if nothing's listed there yet) instead of the filter silently
 *  no-opping because the name wasn't in a short hardcoded list. Rwanda and
 *  its immediate neighbors stay first since this is a Rwanda-based platform
 *  and that's where the overwhelming majority of listings are. */
export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "RW", name: "Rwanda" },
  { code: "KE", name: "Kenya" },
  { code: "UG", name: "Uganda" },
  { code: "TZ", name: "Tanzania" },
  { code: "BI", name: "Burundi" },
  { code: "CD", name: "DR Congo" },
  // Rest of Africa
  { code: "ET", name: "Ethiopia" },
  { code: "SO", name: "Somalia" },
  { code: "SS", name: "South Sudan" },
  { code: "DJ", name: "Djibouti" },
  { code: "ER", name: "Eritrea" },
  { code: "MW", name: "Malawi" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
  { code: "MZ", name: "Mozambique" },
  { code: "MG", name: "Madagascar" },
  { code: "KM", name: "Comoros" },
  { code: "SC", name: "Seychelles" },
  { code: "MU", name: "Mauritius" },
  { code: "AO", name: "Angola" },
  { code: "CM", name: "Cameroon" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CG", name: "Congo" },
  { code: "GA", name: "Gabon" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ST", name: "Sao Tome and Principe" },
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "CI", name: "Ivory Coast" },
  { code: "SN", name: "Senegal" },
  { code: "ML", name: "Mali" },
  { code: "BF", name: "Burkina Faso" },
  { code: "NE", name: "Niger" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "SL", name: "Sierra Leone" },
  { code: "LR", name: "Liberia" },
  { code: "TG", name: "Togo" },
  { code: "BJ", name: "Benin" },
  { code: "GM", name: "Gambia" },
  { code: "CV", name: "Cabo Verde" },
  { code: "MR", name: "Mauritania" },
  { code: "EG", name: "Egypt" },
  { code: "LY", name: "Libya" },
  { code: "TN", name: "Tunisia" },
  { code: "DZ", name: "Algeria" },
  { code: "MA", name: "Morocco" },
  { code: "SD", name: "Sudan" },
  { code: "ZA", name: "South Africa" },
  { code: "NA", name: "Namibia" },
  { code: "BW", name: "Botswana" },
  { code: "LS", name: "Lesotho" },
  { code: "SZ", name: "Eswatini" },
  // Middle East
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "YE", name: "Yemen" },
  { code: "JO", name: "Jordan" },
  { code: "LB", name: "Lebanon" },
  { code: "SY", name: "Syria" },
  { code: "IQ", name: "Iraq" },
  { code: "IL", name: "Israel" },
  { code: "PS", name: "Palestine" },
  { code: "IR", name: "Iran" },
  { code: "TR", name: "Turkey" },
  // Asia
  { code: "CN", name: "China" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "KP", name: "North Korea" },
  { code: "IN", name: "India" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "LK", name: "Sri Lanka" },
  { code: "NP", name: "Nepal" },
  { code: "BT", name: "Bhutan" },
  { code: "MV", name: "Maldives" },
  { code: "AF", name: "Afghanistan" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TM", name: "Turkmenistan" },
  { code: "MN", name: "Mongolia" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "KH", name: "Cambodia" },
  { code: "LA", name: "Laos" },
  { code: "MM", name: "Myanmar" },
  { code: "MY", name: "Malaysia" },
  { code: "SG", name: "Singapore" },
  { code: "ID", name: "Indonesia" },
  { code: "PH", name: "Philippines" },
  { code: "BN", name: "Brunei" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TW", name: "Taiwan" },
  { code: "HK", name: "Hong Kong" },
  // Europe
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "LU", name: "Luxembourg" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "IS", name: "Iceland" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czechia" },
  { code: "SK", name: "Slovakia" },
  { code: "HU", name: "Hungary" },
  { code: "RO", name: "Romania" },
  { code: "BG", name: "Bulgaria" },
  { code: "GR", name: "Greece" },
  { code: "CY", name: "Cyprus" },
  { code: "MT", name: "Malta" },
  { code: "HR", name: "Croatia" },
  { code: "SI", name: "Slovenia" },
  { code: "RS", name: "Serbia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "ME", name: "Montenegro" },
  { code: "MK", name: "North Macedonia" },
  { code: "AL", name: "Albania" },
  { code: "XK", name: "Kosovo" },
  { code: "EE", name: "Estonia" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "UA", name: "Ukraine" },
  { code: "BY", name: "Belarus" },
  { code: "MD", name: "Moldova" },
  { code: "RU", name: "Russia" },
  { code: "GE", name: "Georgia" },
  { code: "AM", name: "Armenia" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "AD", name: "Andorra" },
  { code: "MC", name: "Monaco" },
  { code: "LI", name: "Liechtenstein" },
  { code: "SM", name: "San Marino" },
  { code: "VA", name: "Vatican City" },
  // North America
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "GT", name: "Guatemala" },
  { code: "BZ", name: "Belize" },
  { code: "HN", name: "Honduras" },
  { code: "SV", name: "El Salvador" },
  { code: "NI", name: "Nicaragua" },
  { code: "CR", name: "Costa Rica" },
  { code: "PA", name: "Panama" },
  { code: "CU", name: "Cuba" },
  { code: "JM", name: "Jamaica" },
  { code: "HT", name: "Haiti" },
  { code: "DO", name: "Dominican Republic" },
  { code: "BS", name: "Bahamas" },
  { code: "BB", name: "Barbados" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "GD", name: "Grenada" },
  { code: "LC", name: "Saint Lucia" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "DM", name: "Dominica" },
  { code: "KN", name: "Saint Kitts and Nevis" },
  // South America
  { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "PE", name: "Peru" },
  { code: "VE", name: "Venezuela" },
  { code: "EC", name: "Ecuador" },
  { code: "BO", name: "Bolivia" },
  { code: "PY", name: "Paraguay" },
  { code: "UY", name: "Uruguay" },
  { code: "GY", name: "Guyana" },
  { code: "SR", name: "Suriname" },
  // Oceania
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "FJ", name: "Fiji" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "SB", name: "Solomon Islands" },
  { code: "VU", name: "Vanuatu" },
  { code: "WS", name: "Samoa" },
  { code: "TO", name: "Tonga" },
  { code: "KI", name: "Kiribati" },
  { code: "FM", name: "Micronesia" },
  { code: "PW", name: "Palau" },
  { code: "MH", name: "Marshall Islands" },
  { code: "NR", name: "Nauru" },
  { code: "TV", name: "Tuvalu" },
];

export const DEFAULT_COUNTRY = COUNTRY_OPTIONS[0]; // Rwanda

export function findCountry(nameOrCode: string): CountryOption | undefined {
  const t = nameOrCode.trim().toLowerCase();
  if (!t) return undefined;
  return COUNTRY_OPTIONS.find((c) => c.name.toLowerCase() === t || c.code.toLowerCase() === t);
}

/** A real flag graphic instead of the Unicode regional-indicator flag emoji —
 *  Windows' default fonts render those as bare two-letter codes ("RW") rather
 *  than a flag glyph, which is exactly the bug this replaces. flagcdn.com is
 *  a free, no-key CDN keyed off the same ISO 3166-1 alpha-2 code already
 *  used throughout this module. */
export function countryFlagUrl(code: string): string {
  return `https://flagcdn.com/${code.toLowerCase()}.svg`;
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
