"use client";

import { useEffect, useMemo, useState } from "react";
import PropertyCard from "@/components/PropertyCard";
import { PropertyGridSkeleton } from "@/components/PropertyCardSkeleton";
import Select from "@/components/shared/Select";
import { fetchZillowHomes, fetchZillowStatus, type ZillowHome, type ZillowStatus } from "@/lib/zillow/api";
import { homeToProperty } from "@/lib/zillow/property";

/** What the section tells the page: "off" when it shows nothing, "loading" while its homes are on their way, otherwise how many it shows. */
export type UsHomes = number | "loading" | "off";

/** US homes for sale, for visitors looking at the USA. It shows nothing at all until the server has the feature switched on, and tells the
 *  page what it is doing so the page can count the homes with its own listings and keep its empty-results box away while they load. */
export default function ZillowListings({ onCount }: { onCount?: (state: UsHomes) => void }) {
  const [status, setStatus] = useState<ZillowStatus | null>(null);
  const [city, setCity] = useState("");
  const [homes, setHomes] = useState<ZillowHome[] | null>(null);
  const [failed, setFailed] = useState(false);

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

  const cards = useMemo(() => (homes ?? []).map((home) => ({ home, property: homeToProperty(home) })), [homes]);

  const state: UsHomes = status === null ? "loading" : !status.enabled || status.cities.length === 0 ? "off" : failed ? 0 : homes === null ? "loading" : cards.length;
  useEffect(() => {
    if (!onCount) return;
    onCount(state);
    return () => onCount("off");
  }, [onCount, state]);

  if (!status?.enabled || status.cities.length === 0) return null;

  return (
    <section aria-label="US homes" className="mt-10">
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
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">These homes could not be loaded right now.</p>
      ) : homes === null ? (
        <PropertyGridSkeleton className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
      ) : cards.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">No homes found here.</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ home, property }) => (
            <PropertyCard key={home.id} property={property} />
          ))}
        </div>
      )}
    </section>
  );
}
