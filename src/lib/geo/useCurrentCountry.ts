"use client";

import type { CountryOption } from "@/lib/countries";
import { useVisitorCountry } from "./useVisitorCountry";

/** The country to show for this visitor, used for the flag badge, the Country filter's starting value, the phone prefix, the
 *  default currency and the signup country: where they are now, by best-effort IP detection (see useVisitorCountry). Null
 *  until that resolves — callers should render nothing rather than guess.
 *
 *  This used to prefer a country picked in the navbar's old country picker. That picker was removed, so nothing could change
 *  or clear the saved pick any more, and a leftover one overrode where the visitor really was. It is ignored now (and the
 *  leftover key is deleted, see visitorCountry.ts). */
export function useCurrentCountry(): CountryOption | null {
  return useVisitorCountry();
}
