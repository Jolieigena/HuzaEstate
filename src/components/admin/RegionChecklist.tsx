"use client";

import { useState } from "react";
import { regionsForCountry } from "@/lib/regions";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

const MAX_CHIPS = 8;

/** Pick which regions/districts of the chosen countries an organisation covers. It folds away like a
 *  dropdown: a closed bar shows how many districts are chosen (and removable chips for them), and
 *  opening it reveals each province as its own collapsible group. Only countries with district data
 *  (lib/regions.ts, Rwanda at launch) get a picker; for any other the organisation covers the whole
 *  country. Choosing nothing = every district. */
export default function RegionChecklist({ countries, selected, onToggle, onSetMany }: { countries: string[]; selected: string[]; onToggle: (district: string) => void; onSetMany: (districts: string[], on: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [openRegions, setOpenRegions] = useState<Set<string>>(new Set());
  const withRegions = countries.map((country) => ({ country, regions: regionsForCountry(country) })).filter((c) => c.regions);

  if (withRegions.length === 0) {
    return <p className="text-xs font-medium text-slate-400">{countries.length === 0 ? "Choose a country first." : "No regional breakdown is available for the chosen countries, so the whole country is covered."}</p>;
  }

  const toggleRegion = (key: string) =>
    setOpenRegions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const summary = selected.length === 0 ? "Whole country (no limit)" : `${selected.length} district${selected.length === 1 ? "" : "s"} chosen`;

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-3 text-left text-sm transition ${open ? "border-[#2ec440] ring-2 ring-[#2ec440]/15" : "border-slate-200 hover:border-slate-300"}`}
      >
        <span className={`font-semibold ${selected.length ? "text-slate-900" : "text-slate-500"}`}>{summary}</span>
        <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
          {open ? "Hide" : "Choose districts"}
          <Chevron open={open} />
        </span>
      </button>

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.slice(0, open ? selected.length : MAX_CHIPS).map((district) => (
            <span key={district} className="inline-flex items-center gap-1.5 rounded-full border border-[#2ec440]/25 bg-[#2ec440]/10 py-1 pl-3 pr-1.5 text-xs font-bold text-[#219b31]">
              {district}
              <button type="button" onClick={() => onToggle(district)} aria-label={`Remove ${district}`} className="flex h-4 w-4 items-center justify-center rounded-full text-[#219b31]/70 hover:bg-[#2ec440]/25 hover:text-[#219b31]">
                &times;
              </button>
            </span>
          ))}
          {!open && selected.length > MAX_CHIPS && <span className="py-1 text-xs font-bold text-slate-400">+{selected.length - MAX_CHIPS} more</span>}
        </div>
      )}

      {open && (
        <div className="mt-3 space-y-4">
          {withRegions.map(({ country, regions }) => (
            <div key={country}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{country}</p>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {regions!.map((region) => {
                  const key = `${country}:${region.region}`;
                  const expanded = openRegions.has(key);
                  const chosen = region.districts.filter((d) => selected.includes(d)).length;
                  const allOn = chosen === region.districts.length;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <button type="button" aria-expanded={expanded} onClick={() => toggleRegion(key)} className="flex flex-1 items-center gap-2 text-left">
                          <Chevron open={expanded} />
                          <span className="text-sm font-bold text-slate-700">{region.region}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${chosen ? "bg-[#2ec440]/15 text-[#219b31]" : "bg-slate-100 text-slate-400"}`}>
                            {chosen}/{region.districts.length}
                          </span>
                        </button>
                        <button type="button" onClick={() => onSetMany(region.districts, !allOn)} className="text-xs font-bold text-[#219b31] hover:underline">
                          {allOn ? "Clear" : "Select all"}
                        </button>
                      </div>
                      {expanded && (
                        <div className="grid grid-cols-2 gap-1 px-3 pb-3 sm:grid-cols-3">
                          {region.districts.map((district) => (
                            <label key={district} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50">
                              <input type="checkbox" checked={selected.includes(district)} onChange={() => onToggle(district)} className="h-4 w-4 cursor-pointer accent-[#2ec440]" />
                              {district}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <p className="text-xs font-medium text-slate-400">{selected.length === 0 ? "Nothing chosen: the organisation covers every district." : "Only listings in the chosen districts are visible to this organisation."}</p>
        </div>
      )}
    </div>
  );
}
