"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "@/components/PropertyImage";
import { PropertyApi } from "@/lib/properties/api";
import { fetchZillowHome } from "@/lib/zillow/api";
import { US_HOME_PREFIX, homeToProperty, isUsHomeId } from "@/lib/zillow/property";
import type { Property } from "@/lib/properties/types";
import { isPerSqm, totalPriceOf } from "@/lib/properties/price";
import { formatArea } from "@/lib/properties/area";
import { formatPlace } from "@/lib/properties/place";
import { useDisplayCurrency } from "@/lib/currency/display";
import { useCompareIds } from "@/lib/compare/hooks";
import { CompareStoreEngine, MAX_COMPARE } from "@/lib/compare/store";
import { useLanguage } from "@/lib/i18n/language";
import { useToast } from "@/lib/toast-context";

type Loaded = Record<string, Property | null>;

const TYPE_NAMES: Record<string, string> = { house: "House", apartment: "Apartment", land: "Land", commercial: "Commercial" };

async function loadHome(id: string): Promise<Property | null> {
  if (isUsHomeId(id)) {
    const home = await fetchZillowHome(id.slice(US_HOME_PREFIX.length));
    return home ? homeToProperty(home) : null;
  }
  const result = await PropertyApi.byId(id);
  return result.ok ? result.data : null;
}

/** The positions of the best values in a row (all of them on a tie), or none when every value is the same or fewer than two are known. */
function bestOf(values: (number | null)[], better: "low" | "high"): Set<number> {
  const known = values.map((v, i) => (v === null || !Number.isFinite(v) ? null : { v, i })).filter((x): x is { v: number; i: number } => x !== null);
  if (known.length < 2 || known.every((k) => k.v === known[0].v)) return new Set();
  const target = better === "low" ? Math.min(...known.map((k) => k.v)) : Math.max(...known.map((k) => k.v));
  return new Set(known.filter((k) => k.v === target).map((k) => k.i));
}

function CompareView() {
  const { t } = useLanguage();
  const router = useRouter();
  const money = useDisplayCurrency();
  const { showToast } = useToast();
  const params = useSearchParams();
  const storedIds = useCompareIds();
  const fromLink = params.get("ids");
  // A shared link carries its own list; otherwise the homes ticked on this device are compared.
  const ids = useMemo(() => (fromLink !== null ? Array.from(new Set(fromLink.split(",").map((s) => s.trim()).filter(Boolean))).slice(0, MAX_COMPARE) : storedIds), [fromLink, storedIds]);
  const idsKey = ids.join(",");

  const [loaded, setLoaded] = useState<Loaded>({});

  useEffect(() => {
    let cancelled = false;
    const wanted = idsKey ? idsKey.split(",") : [];
    Promise.all(wanted.map(async (id) => [id, await loadHome(id).catch(() => null)] as const)).then((entries) => {
      if (!cancelled) setLoaded(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  const ready = ids.length > 0 && ids.every((id) => id in loaded);
  const homes = ids.map((id) => ({ id, home: loaded[id] ?? null }));
  const present = homes.map((h) => h.home);

  function removeHome(id: string) {
    CompareStoreEngine.remove(id);
    if (fromLink !== null) {
      const rest = ids.filter((x) => x !== id);
      router.replace(rest.length ? `/compare?ids=${encodeURIComponent(rest.join(","))}` : "/compare");
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}/compare?ids=${encodeURIComponent(ids.join(","))}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast(t("Link copied."), "success");
    } catch {
      showToast(url);
    }
  }

  if (ids.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-black text-slate-900 mb-6">{t("No homes selected")}</h1>
        <Link href="/properties" className="inline-block rounded-full bg-[#2ec440] hover:bg-[#25a835] text-white font-bold px-7 py-3 transition-colors">
          {t("Browse Properties")}
        </Link>
      </div>
    );
  }

  // Numbers in the buyer's display currency, so homes priced in different currencies can be set side by side.
  const total = (p: Property | null) => (p ? money.convert(totalPriceOf(p), p.currency) : null);
  const perSqm = (p: Property | null) => (p && p.sqm > 0 ? money.convert(totalPriceOf(p), p.currency) / p.sqm : null);
  const sameKind = present.filter((p): p is Property => !!p).every((p, _i, all) => p.type === all[0].type);
  const bestPrice = sameKind ? bestOf(present.map(total), "low") : new Set<number>();
  const bestPerSqm = sameKind ? bestOf(present.map(perSqm), "low") : new Set<number>();
  const bestBeds = bestOf(present.map((p) => (p && p.propertyType !== "land" && p.bedrooms > 0 ? p.bedrooms : null)), "high");
  const bestBaths = bestOf(present.map((p) => (p && p.propertyType !== "land" && p.bathrooms > 0 ? p.bathrooms : null)), "high");
  const bestSize = bestOf(present.map((p) => (p && p.sqm > 0 ? p.sqm : null)), "high");

  const amenityCount = new Map<string, number>();
  for (const p of present) for (const a of new Set((p?.amenities ?? []).map((x) => x.trim()).filter(Boolean))) amenityCount.set(a, (amenityCount.get(a) ?? 0) + 1);
  // "Parking" already has its own row (the number of spaces), so it is not listed again as a tick.
  const amenities = Array.from(amenityCount.entries()).filter(([name]) => name.toLowerCase() !== "parking").sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 30).map(([name]) => name);

  const columns = `9rem repeat(${ids.length}, minmax(13rem, 1fr))`;
  const labelCell = "sticky left-0 z-10 bg-white py-3 pr-3 text-sm font-semibold text-slate-500 border-t border-slate-100";
  const valueCell = (best: boolean) => `py-3 px-3 text-sm border-t border-slate-100 ${best ? "bg-[#2ec440]/10 font-bold text-slate-900" : "text-slate-700"}`;
  const dash = <span className="text-slate-300">–</span>;

  function row(label: string, cell: (p: Property, i: number) => React.ReactNode, best?: Set<number>) {
    return (
      <div key={label} className="contents">
        <div className={labelCell}>{t(label)}</div>
        {homes.map(({ id, home }, i) => (
          <div key={id} className={valueCell(!!best?.has(i))}>
            {home ? cell(home, i) : dash}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-8">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{t("Compare")}</h1>
        <div className="flex items-center gap-2">
          <button type="button" onClick={copyLink} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            {t("Copy link")}
          </button>
          <Link href="/properties" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            {t("Add more homes")}
          </Link>
        </div>
      </div>

      {!ready ? (
        <div className="h-64 rounded-3xl bg-slate-100 animate-pulse" aria-busy="true" />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="grid" style={{ gridTemplateColumns: columns, minWidth: `${9 + ids.length * 13}rem` }}>
            <div className="sticky left-0 z-10 bg-white" />
            {homes.map(({ id, home }) => (
              <div key={id} className="px-3 pb-4">
                {home ? (
                  <div className="relative">
                    <Link href={`/properties/${home.id}`} className="block relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
                      <Image src={home.imageUrl} alt={home.title} fill sizes="320px" className="object-cover" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeHome(id)}
                      aria-label={`${t("Remove")} ${home.title}`}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/95 shadow flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <Link href={`/properties/${home.id}`} className="block mt-3 font-bold text-slate-900 leading-snug hover:underline">
                      {home.title}
                    </Link>
                    <p className="text-sm text-slate-500 leading-snug mt-0.5">{formatPlace(home.location, home.city)}</p>
                  </div>
                ) : (
                  <div className="relative aspect-[4/3] rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 text-sm text-slate-500">
                    {t("No longer available")}
                    <button type="button" onClick={() => removeHome(id)} className="font-semibold text-slate-700 hover:text-red-500 transition-colors">
                      {t("Remove")}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {row("Price", (p) => (
              <>
                {money.format(totalPriceOf(p), p.currency)}
                {p.type === "rent" && <span className="text-slate-500 font-medium">{t("/mo")}</span>}
              </>
            ), bestPrice)}
            {row("Price per sqm", (p) => (perSqm(p) !== null ? `${money.format(perSqm(p) as number, money.currency ?? p.currency)}` : dash), bestPerSqm)}
            {row("Status", (p) => t(`For ${p.type}`))}
            {row("Type", (p) => t(p.propertyLabel ?? TYPE_NAMES[p.propertyType] ?? p.propertyType))}
            {row("Bedrooms", (p) => (p.propertyType !== "land" && p.bedrooms > 0 ? p.bedrooms : dash), bestBeds)}
            {row("Bathrooms", (p) => (p.propertyType !== "land" && p.bathrooms > 0 ? p.bathrooms : dash), bestBaths)}
            {row("Size", (p) => {
              if (!(p.sqm > 0)) return dash;
              const area = formatArea(p.sqm);
              return `${area.value} ${area.unit}`;
            }, bestSize)}
            {row("Floors", (p) => (p.floors && p.floors > 0 ? p.floors : dash))}
            {row("Parking", (p) => (p.parkingSpaces && p.parkingSpaces > 0 ? p.parkingSpaces : dash))}
            {row("Country", (p) => p.country ?? "Rwanda")}
            {row("Payment", (p) => (isPerSqm(p) ? t("Per sqm") : p.paymentOptions?.installments ? t("Installments") : t("Full payment")))}

            {amenities.map((name) =>
              row(name, (p) =>
                (p.amenities ?? []).some((a) => a.trim().toLowerCase() === name.toLowerCase()) ? (
                  <svg className="w-5 h-5 text-[#2ec440]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label={t("Yes")}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  dash
                )
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  // The page reads the shared list from the URL (useSearchParams), which needs a Suspense boundary.
  return (
    <Suspense fallback={<div className="max-w-[1400px] mx-auto px-4 py-8"><div className="h-64 rounded-3xl bg-slate-100 animate-pulse" /></div>}>
      <CompareView />
    </Suspense>
  );
}
