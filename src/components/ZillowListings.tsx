"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Select from "@/components/shared/Select";
import { useDisplayCurrency } from "@/lib/currency/display";
import { fetchZillowHomes, fetchZillowStatus, type ZillowHome, type ZillowStatus } from "@/lib/zillow/api";

/** US homes for sale from Zillow, for visitors looking at the USA. It shows nothing at all until the server has the feature switched on. Each
 *  card says where it is from and opens the home on Zillow. */
export default function ZillowListings() {
  const [status, setStatus] = useState<ZillowStatus | null>(null);
  const [city, setCity] = useState("");
  const [homes, setHomes] = useState<ZillowHome[] | null>(null);
  const [failed, setFailed] = useState(false);
  const money = useDisplayCurrency();

  useEffect(() => {
    let cancelled = false;
    fetchZillowStatus().then((s) => {
      if (cancelled) return;
      setStatus(s);
      if (s.enabled && s.cities.length > 0) setCity(s.cities[0].key);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!city) return;
    let cancelled = false;
    fetchZillowHomes(city).then((result) => {
      if (cancelled) return;
      if (result.ok) setHomes(result.homes);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [city]);

  if (!status?.enabled || status.cities.length === 0) return null;

  return (
    <section aria-label="US homes" className="mt-14">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">{`Homes in ${status.cities.find((c) => c.key === city)?.name ?? "the USA"}`}</h2>
        <Select value={city} onChange={(e) => { setHomes(null); setFailed(false); setCity(e.target.value); }} aria-label="City" className="w-[190px] rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm">
          {status.cities.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {failed ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">Zillow homes could not be loaded right now.</p>
      ) : homes === null ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading homes">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-3xl border border-slate-100 bg-slate-50" aria-hidden="true" />
          ))}
        </div>
      ) : homes.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">No homes found here.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {homes.map((home) => (
            <a key={home.id} href={home.url} target="_blank" rel="noopener noreferrer nofollow" className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="relative aspect-[16/10] bg-slate-100">
                {home.image && <img src={home.image} alt={home.address} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />}
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#006aff]">Zillow</span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-lg font-bold text-slate-900">{money.format(home.price, home.currency)}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">{home.address}</p>
                <p className="mt-3 text-sm font-medium text-slate-500">
                  {[home.bedrooms !== null ? `${home.bedrooms} bd` : "", home.bathrooms !== null ? `${home.bathrooms} ba` : "", home.sqft !== null ? `${home.sqft.toLocaleString("en-US")} sqft` : ""].filter(Boolean).join(" · ")}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
