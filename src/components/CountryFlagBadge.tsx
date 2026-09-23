"use client";

import { countryFlagUrl } from "@/lib/countries";
import { useCurrentCountry } from "@/lib/geo/useCurrentCountry";

/** Small read-only flag badge — the navbar's old country picker was removed
 *  in favor of just showing the visitor's (detected or previously chosen)
 *  country at a glance, on the logo and on the account avatar. Renders
 *  nothing until a country is known (see useCurrentCountry) rather than
 *  guessing one. */
export default function CountryFlagBadge({ className = "" }: { className?: string }) {
  const current = useCurrentCountry();
  if (!current) return null;

  return (
    <img
      src={countryFlagUrl(current.code)}
      alt={current.name}
      title={current.name}
      className={`rounded-full ring-2 ring-white object-cover shrink-0 ${className}`}
    />
  );
}
