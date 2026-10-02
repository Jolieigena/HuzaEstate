"use client";

import { useCurrentCountry } from "@/lib/geo/useCurrentCountry";

/** Five major currencies always offered on the post-property / edit forms,
 *  regardless of where the seller is — USD/EUR/GBP as global majors, RWF as
 *  this platform's home currency, KES as the largest regional neighbor. */
export const MAJOR_CURRENCIES = ["USD", "EUR", "GBP", "RWF", "KES"] as const;

// ISO-4217 currency per COUNTRY_OPTIONS' own code (src/lib/countries.ts) —
// covers every country a seller could plausibly be posting from, so
// useCurrencyOptions() below can always surface their real local currency
// even when it isn't one of the majors above.
const CURRENCY_BY_COUNTRY_CODE: Record<string, string> = {
  RW: "RWF", KE: "KES", UG: "UGX", TZ: "TZS", BI: "BIF", CD: "CDF",
  ET: "ETB", SO: "SOS", SS: "SSP", DJ: "DJF", ER: "ERN", MW: "MWK",
  ZM: "ZMW", ZW: "ZWL", MZ: "MZN", MG: "MGA", KM: "KMF", SC: "SCR",
  MU: "MUR", AO: "AOA", CM: "XAF", CF: "XAF", TD: "XAF", CG: "XAF",
  GA: "XAF", GQ: "XAF", ST: "STN", NG: "NGN", GH: "GHS", CI: "XOF",
  SN: "XOF", ML: "XOF", BF: "XOF", NE: "XOF", GN: "GNF", GW: "XOF",
  SL: "SLE", LR: "LRD", TG: "XOF", BJ: "XOF", GM: "GMD", CV: "CVE",
  MR: "MRU", EG: "EGP", LY: "LYD", TN: "TND", DZ: "DZD", MA: "MAD",
  SD: "SDG", ZA: "ZAR", NA: "NAD", BW: "BWP", LS: "LSL", SZ: "SZL",
  SA: "SAR", AE: "AED", QA: "QAR", KW: "KWD", BH: "BHD", OM: "OMR",
  YE: "YER", JO: "JOD", LB: "LBP", SY: "SYP", IQ: "IQD", IL: "ILS",
  PS: "ILS", IR: "IRR", TR: "TRY",
  CN: "CNY", JP: "JPY", KR: "KRW", KP: "KPW", IN: "INR", PK: "PKR",
  BD: "BDT", LK: "LKR", NP: "NPR", BT: "BTN", MV: "MVR", AF: "AFN",
  UZ: "UZS", KZ: "KZT", KG: "KGS", TJ: "TJS", TM: "TMT", MN: "MNT",
  TH: "THB", VN: "VND", KH: "KHR", LA: "LAK", MM: "MMK", MY: "MYR",
  SG: "SGD", ID: "IDR", PH: "PHP", BN: "BND", TL: "USD", TW: "TWD", HK: "HKD",
  GB: "GBP", IE: "EUR", FR: "EUR", DE: "EUR", IT: "EUR", ES: "EUR",
  PT: "EUR", NL: "EUR", BE: "EUR", LU: "EUR", CH: "CHF", AT: "EUR",
  SE: "SEK", NO: "NOK", DK: "DKK", FI: "EUR", IS: "ISK", PL: "PLN",
  CZ: "CZK", SK: "EUR", HU: "HUF", RO: "RON", BG: "BGN", GR: "EUR",
  CY: "EUR", MT: "EUR", HR: "EUR", SI: "EUR", RS: "RSD", BA: "BAM",
  ME: "EUR", MK: "MKD", AL: "ALL", XK: "EUR", EE: "EUR", LV: "EUR",
  LT: "EUR", UA: "UAH", BY: "BYN", MD: "MDL", RU: "RUB", GE: "GEL",
  AM: "AMD", AZ: "AZN", AD: "EUR", MC: "EUR", LI: "CHF", SM: "EUR", VA: "EUR",
  US: "USD", CA: "CAD", MX: "MXN", GT: "GTQ", BZ: "BZD", HN: "HNL",
  SV: "USD", NI: "NIO", CR: "CRC", PA: "USD", CU: "CUP", JM: "JMD",
  HT: "HTG", DO: "DOP", BS: "BSD", BB: "BBD", TT: "TTD", GD: "XCD",
  LC: "XCD", VC: "XCD", AG: "XCD", DM: "XCD", KN: "XCD",
  BR: "BRL", AR: "ARS", CL: "CLP", CO: "COP", PE: "PEN", VE: "VES",
  EC: "USD", BO: "BOB", PY: "PYG", UY: "UYU", GY: "GYD", SR: "SRD",
  AU: "AUD", NZ: "NZD", FJ: "FJD", PG: "PGK", SB: "SBD", VU: "VUV",
  WS: "WST", TO: "TOP", KI: "AUD", FM: "USD", PW: "USD", MH: "USD",
  NR: "AUD", TV: "AUD",
};

export function currencyForCountryCode(code?: string): string | undefined {
  return code ? CURRENCY_BY_COUNTRY_CODE[code] : undefined;
}

/** The currency dropdown a seller actually sees: the 5 majors, plus their
 *  own local currency (geo-detected or previously picked — see
 *  useCurrentCountry) appended and set as the default whenever it isn't
 *  already one of the majors. Falls back to USD/the majors alone if
 *  detection hasn't resolved yet or the country maps to no known currency. */
export function useCurrencyOptions(): { options: string[]; defaultCurrency: string } {
  const country = useCurrentCountry();
  const local = currencyForCountryCode(country?.code);
  const options = local && !(MAJOR_CURRENCIES as readonly string[]).includes(local)
    ? [...MAJOR_CURRENCIES, local]
    : [...MAJOR_CURRENCIES];
  return { options, defaultCurrency: local ?? "USD" };
}
