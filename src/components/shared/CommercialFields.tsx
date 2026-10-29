"use client";

import { useLanguage } from "@/lib/i18n/language";

const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors";

/** For commercial space: is the price typed the total, or per square metre (per month when rented)? */
export function PriceBasisToggle({ value, onChange }: { value: "total" | "per_sqm"; onChange: (value: "total" | "per_sqm") => void }) {
  const { t } = useLanguage();
  const options: { value: "total" | "per_sqm"; label: string }[] = [
    { value: "total", label: "Total price" },
    { value: "per_sqm", label: "Per sqm" },
  ];
  return (
    <div role="radiogroup" aria-label={t("Price basis")} className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${value === o.value ? "border-[#2ec440] bg-[#2ec440]/5 text-[#2ec440]" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
        >
          {t(o.label)}
        </button>
      ))}
    </div>
  );
}

/** Optional floors and parking spaces of a commercial building. */
export function FloorsParkingFields({ floors, parking, onFloors, onParking }: { floors: string; parking: string; onFloors: (v: string) => void; onParking: (v: string) => void }) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">{t("Floors")}</label>
        <input type="number" min="0" value={floors} onChange={(e) => onFloors(e.target.value)} placeholder={t("e.g. 3")} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">{t("Parking spaces")}</label>
        <input type="number" min="0" value={parking} onChange={(e) => onParking(e.target.value)} placeholder={t("e.g. 10")} className={inputClass} />
      </div>
    </div>
  );
}
