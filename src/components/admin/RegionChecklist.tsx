"use client";

import { regionsForCountry } from "@/lib/regions";

/** Pick which regions/districts of the chosen countries an organisation covers. Only countries
 *  with district reference data (lib/regions.ts, Rwanda at launch) get a picker; for any other the
 *  organisation simply covers the whole country. Choosing nothing = every district. */
export default function RegionChecklist({ countries, selected, onToggle, onSetMany }: { countries: string[]; selected: string[]; onToggle: (district: string) => void; onSetMany: (districts: string[], on: boolean) => void }) {
  const withRegions = countries.map((country) => ({ country, regions: regionsForCountry(country) })).filter((c) => c.regions);

  if (withRegions.length === 0) {
    return <p className="text-xs font-medium text-slate-400">{countries.length === 0 ? "Choose a country first." : "No regional breakdown is available for the chosen countries, so the whole country is covered."}</p>;
  }

  return (
    <div className="space-y-4">
      {withRegions.map(({ country, regions }) => (
        <div key={country}>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{country}</p>
          <div className="space-y-3 rounded-xl border border-slate-200 p-3">
            {regions!.map((region) => {
              const allOn = region.districts.every((d) => selected.includes(d));
              return (
                <div key={region.region}>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-700">{region.region}</p>
                    <button type="button" onClick={() => onSetMany(region.districts, !allOn)} className="text-xs font-bold text-[#219b31] hover:underline">
                      {allOn ? "Clear" : "Select all"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                    {region.districts.map((district) => (
                      <label key={district} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <input type="checkbox" checked={selected.includes(district)} onChange={() => onToggle(district)} className="h-4 w-4 cursor-pointer accent-[#2ec440]" />
                        {district}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-xs font-medium text-slate-400">{selected.length === 0 ? "Nothing chosen: the organisation covers every district." : `${selected.length} district${selected.length === 1 ? "" : "s"} chosen. Only listings there are visible to this organisation.`}</p>
    </div>
  );
}
