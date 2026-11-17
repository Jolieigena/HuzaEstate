"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PropertyCard from "@/components/PropertyCard";
import { PropertyGridSkeleton } from "@/components/PropertyCardSkeleton";
import Select from "@/components/shared/Select";
import { fetchZillowHomes, fetchZillowStatus, type ZillowHome, type ZillowStatus } from "@/lib/zillow/api";
import { homeToProperty } from "@/lib/zillow/property";
import type { Property } from "@/lib/properties/types";

/** What the section tells the page: "off" when it shows nothing, "loading" while its homes are on their way, otherwise how many it shows. */
export type UsHomes = number | "loading" | "off";

/** US homes for sale, for visitors looking at the USA. It shows nothing at all until the server has the feature switched on, and tells the
 *  page what it is doing so the page can count the homes with its own listings and keep its empty-results box away while they load. */
export default function ZillowListings({ onCount, citySlot, matches, compare, cityHint }: { onCount?: (state: UsHomes) => void; citySlot?: HTMLElement | null; matches?: (property: Property) => boolean; compare?: (a: Property, b: Property) => number; cityHint?: string }) {
  const [status, setStatus] = useState<ZillowStatus | null>(null);
  // The visitor's own choice of city, remembered with the search text it was made under: a city typed into the search or the City / District box
  // takes over again when that text changes.
  const [pick, setPick] = useState<{ city: string; hint: string } | null>(null);
  const [loaded, setLoaded] = useState<{ city: string; homes: ZillowHome[] | null }>({ city: "", homes: null });
  const [failedCity, setFailedCity] = useState("");
  const hint = (cityHint ?? "").toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  const hinted = hint ? status?.cities.find((c) => { const name = c.name.split(",")[0].toLowerCase(); return hint === name || ` ${hint} `.includes(` ${name} `); }) : undefined;
  const city = pick && pick.hint === hint ? pick.city : (hinted?.key ?? status?.cities[0]?.key ?? "");

  useEffect(() => {
    let cancelled = false;
    fetchZillowStatus().then((s) => {
      if (cancelled) return;
      setStatus(s);
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
      if (result.ok) setLoaded({ city, homes: result.homes });
      else setFailedCity(city);
    });
    return () => {
      cancelled = true;
    };
  }, [city]);

  const homes = loaded.city === city ? loaded.homes : null;
  const failed = failedCity === city;

  // Every filter on the page applies to these homes as it does to our own listings (price, beds, baths, type, size, amenities, search ...).
  const cards = (homes ?? [])
    .map((home) => ({ home, property: homeToProperty(home) }))
    .filter(({ property }) => !matches || matches(property))
    .sort((a, b) => (compare ? compare(a.property, b.property) : 0));

  const state: UsHomes = status === null ? "loading" : !status.enabled || status.cities.length === 0 ? "off" : failed ? 0 : homes === null ? "loading" : cards.length;
  useEffect(() => {
    if (!onCount) return;
    onCount(state);
    return () => onCount("off");
  }, [onCount, state]);

  if (!status?.enabled || status.cities.length === 0) return null;

  // When the page offers a spot beside its own title, the city picker goes there, on the same line as the result count.
  const picker = (
    <Select value={city} onChange={(e) => setPick({ city: e.target.value, hint })} aria-label="City" className="w-[190px] rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm">
      {status.cities.map((c) => (
        <option key={c.key} value={c.key}>
          {c.name}
        </option>
      ))}
    </Select>
  );

  return (
    <section aria-label="US homes" className={citySlot ? "mt-4" : "mt-10"}>
      {citySlot ? (
        createPortal(picker, citySlot)
      ) : (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">{`Homes in ${status.cities.find((c) => c.key === city)?.name ?? "the USA"}`}</h2>
          {picker}
        </div>
      )}

      {failed ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">These homes could not be loaded right now.</p>
      ) : homes === null ? (
        <PropertyGridSkeleton className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
      ) : cards.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">{homes.length > 0 ? "No homes here match your filters." : "No homes found here."}</p>
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
