"use client";

import { useMemo, useState } from "react";
import { adminRegionsForCountry } from "@/lib/adminRegions";
import type { RegionScopeMap } from "@/lib/admin/propertyCategories";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

const MAX_CHIPS = 8;
const SEARCH_THRESHOLD = 15;

function CountryRegions({ country, regions, selected, onChange }: { country: string; regions: { region: string; districts: string[] }[]; selected: string[]; onChange: (next: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const total = useMemo(() => regions.reduce((n, r) => n + r.districts.length, 0), [regions]);
  const q = search.trim().toLowerCase();
  const toggle = (d: string) => onChange(selected.includes(d) ? selected.filter((x) => x !== d) : [...selected, d]);
  const setMany = (list: string[], on: boolean) => onChange(on ? Array.from(new Set([...selected, ...list])) : selected.filter((d) => !list.includes(d)));
  // A group with a single flat list (every country but Rwanda) has no province level to fold, so it
  // is shown open; Rwanda's provinces each fold on their own.
  const flat = regions.length === 1;

  return (
    <div className="rounded-xl border border-slate-200">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left">
        <span className="flex items-center gap-2">
          <Chevron open={open} />
          <span className="text-sm font-bold text-slate-800">{country}</span>
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${selected.length ? "bg-[#2ec440]/15 text-[#219b31]" : "bg-slate-100 text-slate-500"}`}>
          {selected.length ? `${selected.length} of ${total} chosen` : "Whole country"}
        </span>
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3.5 pb-3">
          {selected.slice(0, open ? selected.length : MAX_CHIPS).map((d) => (
            <span key={d} className="inline-flex items-center gap-1.5 rounded-full border border-[#2ec440]/25 bg-[#2ec440]/10 py-1 pl-3 pr-1.5 text-xs font-bold text-[#219b31]">
              {d}
              <button type="button" onClick={() => toggle(d)} aria-label={`Remove ${d}`} className="flex h-4 w-4 items-center justify-center rounded-full text-[#219b31]/70 hover:bg-[#2ec440]/25 hover:text-[#219b31]">
                &times;
              </button>
            </span>
          ))}
          {!open && selected.length > MAX_CHIPS && <span className="py-1 text-xs font-bold text-slate-400">+{selected.length - MAX_CHIPS} more</span>}
        </div>
      )}

      {open && (
        <div className="space-y-3 border-t border-slate-100 p-3">
          {total > SEARCH_THRESHOLD && (
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${country} regions…`} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15" />
          )}
          {regions.map((group) => {
            const visible = q ? group.districts.filter((d) => d.toLowerCase().includes(q)) : group.districts;
            if (!visible.length) return null;
            const key = group.region;
            const expanded = flat || q !== "" || openGroups.has(key);
            const chosen = group.districts.filter((d) => selected.includes(d)).length;
            const allOn = chosen === group.districts.length;
            return (
              <div key={key} className={flat ? "" : "rounded-lg border border-slate-100"}>
                <div className="flex items-center justify-between gap-3 px-1 py-1.5">
                  {flat ? (
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{group.districts.length} regions</span>
                  ) : (
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setOpenGroups((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; })}
                      className="flex flex-1 items-center gap-2 px-2 text-left"
                    >
                      <Chevron open={expanded} />
                      <span className="text-sm font-bold text-slate-700">{group.region}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${chosen ? "bg-[#2ec440]/15 text-[#219b31]" : "bg-slate-100 text-slate-400"}`}>{chosen}/{group.districts.length}</span>
                    </button>
                  )}
                  <button type="button" onClick={() => setMany(group.districts, !allOn)} className="text-xs font-bold text-[#219b31] hover:underline">
                    {allOn ? "Clear" : "Select all"}
                  </button>
                </div>
                {expanded && (
                  <div className={`grid grid-cols-2 gap-1 sm:grid-cols-3 ${flat ? "max-h-64 overflow-y-auto" : "px-2 pb-2"}`}>
                    {visible.map((d) => (
                      <label key={d} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <input type="checkbox" checked={selected.includes(d)} onChange={() => toggle(d)} className="h-4 w-4 shrink-0 cursor-pointer accent-[#2ec440]" />
                        <span className="truncate">{d}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Give an organisation certain regions in certain countries. One folding block per country it covers:
 *  limit it to a few regions, or leave the country whole. Every country with region data is offered
 *  (lib/adminRegions.ts); one without simply stays whole-country. */
export default function RegionChecklist({ countries, value, onChange }: { countries: string[]; value: RegionScopeMap; onChange: (next: RegionScopeMap) => void }) {
  const withRegions = countries.map((country) => ({ country, regions: adminRegionsForCountry(country) })).filter((c) => c.regions);
  const without = countries.filter((c) => !adminRegionsForCountry(c));

  if (countries.length === 0) return <p className="text-xs font-medium text-slate-400">Choose a country first.</p>;
  return (
    <div className="space-y-2">
      {withRegions.map(({ country, regions }) => (
        <CountryRegions key={country} country={country} regions={regions!} selected={value[country] ?? []} onChange={(next) => onChange({ ...value, [country]: next })} />
      ))}
      {without.length > 0 && <p className="text-xs font-medium text-slate-400">No regional breakdown is available for {without.join(", ")}, so {without.length === 1 ? "it is" : "they are"} covered whole.</p>}
      <p className="text-xs font-medium text-slate-400">A country with nothing chosen is covered whole. A listing whose region could not be worked out is shown to every organisation in its country.</p>
    </div>
  );
}
