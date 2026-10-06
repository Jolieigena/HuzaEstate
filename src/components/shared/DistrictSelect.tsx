"use client";

import { regionsForCountry } from "@/lib/regions";
import Select from "@/components/shared/Select";

const fieldClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15";

/** A district dropdown, grouped by region, cascading off whichever country is already selected.
 *  Renders nothing when that country has no district reference data (lib/regions.ts — every
 *  country except Rwanda, at launch) — the caller just doesn't render a district field at all
 *  for those, same as today. */
export default function DistrictSelect({ country, value, onChange, className = "" }: { country: string; value: string; onChange: (district: string) => void; className?: string }) {
  const regions = regionsForCountry(country);
  if (!regions) return null;
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className={`${fieldClass} ${className}`}>
      <option value="">Select a district…</option>
      {regions.map((r) => (
        <optgroup key={r.region} label={r.region}>
          {r.districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </optgroup>
      ))}
    </Select>
  );
}
