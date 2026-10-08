"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Select from "@/components/shared/Select";
import {
  DESIGN_CATEGORY_LABELS,
  DESIGN_PRICE_TYPE_LABELS,
  DesignsApi,
  formatDesignPrice,
  type DesignCategory,
  type DesignFacets,
  type DesignList,
  type DesignPriceType,
  type DesignSort,
} from "@/lib/designs/api";

const PAGE_SIZE = 24;

const SORT_LABELS: Record<DesignSort, string> = { newest: "Newest first", price_asc: "Price: low to high", price_desc: "Price: high to low", title: "Title A to Z" };

// Rough exchange rates, used only to pick sensible price brackets for a currency. Prices are never converted.
const BRACKET_RATE: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79, RWF: 1400, KES: 130, UGX: 3700, TZS: 2600, ZAR: 18, NGN: 1500, GHS: 15 };
const USD_EDGES = [500, 1000, 2500, 5000, 10000];

function priceBrackets(currency: string): { label: string; min?: number; max?: number }[] {
  const rate = BRACKET_RATE[currency] ?? 1;
  const edges = USD_EDGES.map((usd) => Number((usd * rate).toPrecision(2)));
  const money = (n: number) => (currency === "USD" ? `$${n.toLocaleString("en-US")}` : `${currency} ${n.toLocaleString("en-US")}`);
  return [
    { label: `Under ${money(edges[0])}`, max: edges[0] },
    ...edges.slice(0, -1).map((edge, i) => ({ label: `${money(edge)} to ${money(edges[i + 1])}`, min: edge, max: edges[i + 1] })),
    { label: `Over ${money(edges[edges.length - 1])}`, min: edges[edges.length - 1] },
  ];
}

const ANY = "";

export default function DesignsCatalogPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center text-sm font-semibold text-slate-400">Loading…</p>}>
      <Catalog />
    </Suspense>
  );
}

function Catalog() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Every filter lives in the web address, so a filtered view can be shared, bookmarked and reached with Back.
  const get = (key: string) => params.get(key) ?? "";
  const category = get("category") as DesignCategory | "";
  const space = get("space");
  const profession = get("profession");
  const country = get("country");
  const city = get("city");
  const designer = get("designer");
  const priceType = get("priceType") as DesignPriceType | "";
  const hasFurniture = get("furniture") === "1";
  const currencyParam = get("currency");
  const minPrice = get("min");
  const maxPrice = get("max");
  const sort = (get("sort") as DesignSort) || "newest";
  const search = get("q");
  const page = Math.max(parseInt(get("page") || "1", 10) || 1, 1);

  const update = useCallback(
    (changes: Record<string, string | undefined>, keepPage = false) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (!keepPage) next.delete("page");
      const text = next.toString();
      router.replace(text ? `${pathname}?${text}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const [facets, setFacets] = useState<DesignFacets | null>(null);
  useEffect(() => {
    let cancelled = false;
    DesignsApi.filters().then((result) => {
      if (!cancelled && result.ok) setFacets(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Typing in the search box waits a beat before it reaches the address.
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    if (searchInput.trim() === search) return;
    const timer = setTimeout(() => update({ q: searchInput.trim() || undefined }), 350);
    return () => clearTimeout(timer);
  }, [searchInput, search, update]);

  const currencies = facets?.currencies ?? [];
  const defaultCurrency = [...currencies].sort((a, b) => b.count - a.count)[0]?.code ?? "USD";
  const currency = currencyParam || defaultCurrency;
  const brackets = useMemo(() => priceBrackets(currency), [currency]);
  const activeBracket = brackets.findIndex((b) => String(b.min ?? "") === minPrice && String(b.max ?? "") === maxPrice);
  const priced = minPrice !== "" || maxPrice !== "";

  const [data, setData] = useState<{ key: string; list?: DesignList; error?: string } | null>(null);
  const key = params.toString();
  useEffect(() => {
    let cancelled = false;
    DesignsApi.list({
      category,
      search,
      space,
      profession,
      country,
      city,
      professionalId: designer,
      priceType,
      hasFurniture,
      currency: priced || currencyParam ? currency : undefined,
      minPrice: minPrice === "" ? "" : Number(minPrice),
      maxPrice: maxPrice === "" ? "" : Number(maxPrice),
      sort,
      page,
      limit: PAGE_SIZE,
    }).then((result) => {
      if (!cancelled) setData(result.ok ? { key, list: result.data } : { key, error: result.error });
    });
    return () => {
      cancelled = true;
    };
    // `key` stands for every filter above: they all come from the address.
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = data?.list;
  const loading = data?.key !== key;
  const lastPage = Math.max(Math.ceil((list?.total ?? 0) / PAGE_SIZE), 1);

  const spaces = (facets?.spaces ?? []).filter((s) => !category || s.category === category);
  const spaceOptions = Array.from(new Map(spaces.map((s) => [s.name.toLowerCase(), s])).values());
  const designerName = facets?.designers.find((d) => d.id === designer)?.name;

  // The filters that are switched on, each with how to switch it off.
  const chips: { label: string; clear: Record<string, string | undefined> }[] = [];
  if (space) chips.push({ label: space, clear: { space: undefined } });
  if (profession) chips.push({ label: profession, clear: { profession: undefined } });
  if (designer) chips.push({ label: designerName ?? "Designer", clear: { designer: undefined } });
  if (country) chips.push({ label: country, clear: { country: undefined } });
  if (city) chips.push({ label: city, clear: { city: undefined } });
  if (priceType) chips.push({ label: DESIGN_PRICE_TYPE_LABELS[priceType], clear: { priceType: undefined } });
  if (priced) chips.push({ label: activeBracket >= 0 ? brackets[activeBracket].label : `${minPrice || 0} to ${maxPrice || "any"}`, clear: { min: undefined, max: undefined, currency: undefined } });
  if (hasFurniture) chips.push({ label: "With furniture list", clear: { furniture: undefined } });
  if (search) chips.push({ label: `“${search}”`, clear: { q: undefined } });

  const [panelOpen, setPanelOpen] = useState(false);
  const showPanel = panelOpen;
  const clearAll = () => {
    setSearchInput("");
    router.replace(category ? `${pathname}?category=${category}` : pathname, { scroll: false });
  };

  const tabs: { value: DesignCategory | ""; label: string }[] = [{ value: "", label: "All" }, ...(Object.keys(DESIGN_CATEGORY_LABELS) as DesignCategory[]).map((c) => ({ value: c, label: DESIGN_CATEGORY_LABELS[c] }))];
  const selectClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15";
  const labelClass = "block text-xs font-bold uppercase tracking-wide text-slate-500";
  const withCount = (name: string, count: number) => `${name} (${count})`;
  const filterCount = chips.filter((c) => !("q" in c.clear)).length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Designs</h1>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2" role="tablist" aria-label="Design type">
          {tabs.map((tab) => (
            <button
              key={tab.value || "all"}
              type="button"
              role="tab"
              aria-selected={category === tab.value}
              onClick={() => update({ category: tab.value || undefined, space: undefined })}
              className={`rounded-full border px-5 py-2 text-sm font-bold transition-colors ${category === tab.value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-3 lg:max-w-2xl lg:justify-end">
          <input
            className="min-w-48 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15"
            placeholder="Search designs"
            aria-label="Search designs"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            type="button"
            aria-expanded={showPanel}
            onClick={() => setPanelOpen((open) => !open)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors ${showPanel || filterCount > 0 ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M6 12h12M10 18h4" />
            </svg>
            Filters
            {filterCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[11px] text-white">{filterCount}</span>}
          </button>
          <div className="w-48">
            <Select className={selectClass} value={sort} aria-label="Sort designs" onChange={(e) => update({ sort: e.target.value === "newest" ? undefined : e.target.value })}>
              {(Object.keys(SORT_LABELS) as DesignSort[]).map((s) => (
                <option key={s} value={s}>
                  {SORT_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {showPanel && (
        <section aria-label="Filters" className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <label className={labelClass}>
            Space
            <Select className={`${selectClass} mt-1.5 normal-case tracking-normal`} value={space} aria-label="Space" onChange={(e) => update({ space: e.target.value || undefined })}>
              <option value={ANY}>Any space</option>
              {spaceOptions.map((s) => (
                <option key={s.name} value={s.name}>
                  {withCount(s.name, s.count)}
                </option>
              ))}
            </Select>
          </label>
          <label className={labelClass}>
            Designer&apos;s profession
            <Select className={`${selectClass} mt-1.5 normal-case tracking-normal`} value={profession} aria-label="Designer's profession" onChange={(e) => update({ profession: e.target.value || undefined })}>
              <option value={ANY}>Any profession</option>
              {(facets?.professions ?? []).map((p) => (
                <option key={p.name} value={p.name}>
                  {withCount(p.name, p.count)}
                </option>
              ))}
            </Select>
          </label>
          <label className={labelClass}>
            Designer
            <Select className={`${selectClass} mt-1.5 normal-case tracking-normal`} value={designer} aria-label="Designer" onChange={(e) => update({ designer: e.target.value || undefined })}>
              <option value={ANY}>Any designer</option>
              {(facets?.designers ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {withCount(d.name, d.count)}
                </option>
              ))}
            </Select>
          </label>
          <label className={labelClass}>
            Pricing
            <Select className={`${selectClass} mt-1.5 normal-case tracking-normal`} value={priceType} aria-label="Pricing" onChange={(e) => update({ priceType: e.target.value || undefined })}>
              <option value={ANY}>Any pricing</option>
              {(facets?.priceTypes ?? []).map((t) => (
                <option key={t.value} value={t.value}>
                  {withCount(DESIGN_PRICE_TYPE_LABELS[t.value], t.count)}
                </option>
              ))}
            </Select>
          </label>
          <label className={labelClass}>
            Price
            <Select
              className={`${selectClass} mt-1.5 normal-case tracking-normal`}
              value={activeBracket >= 0 ? String(activeBracket) : priced ? "custom" : ANY}
              aria-label="Price"
              onChange={(e) => {
                const bracket = e.target.value === "" || e.target.value === "custom" ? undefined : brackets[Number(e.target.value)];
                update({ min: bracket?.min !== undefined ? String(bracket.min) : undefined, max: bracket?.max !== undefined ? String(bracket.max) : undefined, currency: bracket ? currency : undefined });
              }}
            >
              <option value={ANY}>Any price</option>
              {priced && activeBracket < 0 && <option value="custom">{minPrice || 0} to {maxPrice || "any"}</option>}
              {brackets.map((b, i) => (
                <option key={b.label} value={String(i)}>
                  {b.label}
                </option>
              ))}
            </Select>
          </label>
          {currencies.length > 1 && (
            <label className={labelClass}>
              Currency
              <Select className={`${selectClass} mt-1.5 normal-case tracking-normal`} value={currency} aria-label="Currency" onChange={(e) => update({ currency: e.target.value, min: undefined, max: undefined })}>
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {withCount(c.code, c.count)}
                  </option>
                ))}
              </Select>
            </label>
          )}
          <label className={labelClass}>
            Country
            <Select className={`${selectClass} mt-1.5 normal-case tracking-normal`} value={country} aria-label="Country" onChange={(e) => update({ country: e.target.value || undefined, city: undefined })}>
              <option value={ANY}>Any country</option>
              {(facets?.countries ?? []).map((c) => (
                <option key={c.name} value={c.name}>
                  {withCount(c.name, c.count)}
                </option>
              ))}
            </Select>
          </label>
          <label className={labelClass}>
            City
            <Select className={`${selectClass} mt-1.5 normal-case tracking-normal`} value={city} aria-label="City" onChange={(e) => update({ city: e.target.value || undefined })}>
              <option value={ANY}>Any city</option>
              {(facets?.cities ?? []).map((c) => (
                <option key={c.name} value={c.name}>
                  {withCount(c.name, c.count)}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-slate-700">
              <input type="checkbox" className="h-4 w-4 accent-[#2ec440]" checked={hasFurniture} onChange={(e) => update({ furniture: e.target.checked ? "1" : undefined })} />
              Has a furniture list{facets ? ` (${facets.withFurniture})` : ""}
            </label>
          </div>
        </section>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2" aria-live="polite">
        <p className="mr-2 text-sm font-semibold text-slate-500">{loading && !list ? "Loading…" : `${list?.total ?? 0} ${list?.total === 1 ? "design" : "designs"}`}</p>
        {chips.map((chip) => (
          <button key={chip.label} type="button" onClick={() => { if ("q" in chip.clear) setSearchInput(""); update(chip.clear); }} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200">
            {chip.label}
            <span aria-hidden="true" className="text-slate-400">
              ×
            </span>
            <span className="sr-only">Remove filter</span>
          </button>
        ))}
        {chips.length > 1 && (
          <button type="button" onClick={clearAll} className="px-2 text-xs font-bold text-slate-500 underline hover:text-slate-900">
            Clear all
          </button>
        )}
      </div>

      <div className="mt-6">
        {data?.error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{data.error}</p>
        ) : list && list.designs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-slate-400">No designs match</p>
            {chips.length > 0 && (
              <button type="button" onClick={clearAll} className="mt-3 text-sm font-bold text-[#219b31] hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
            {(list?.designs ?? []).map((design) => (
              <Link key={design.id} href={`/designs/${design.id}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {design.images[0] ? <img src={design.images[0]} alt={design.title} className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" /> : <div className="h-56 w-full bg-slate-100" />}
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {DESIGN_CATEGORY_LABELS[design.category]}
                    {design.spaceType ? ` · ${design.spaceType}` : ""}
                  </p>
                  <h2 className="mt-1 font-black text-slate-900">{design.title}</h2>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <span className="font-bold text-slate-900">{formatDesignPrice(design)}</span>
                    {design.designer && (
                      <span className="min-w-0 text-right">
                        <span className="block truncate font-semibold text-slate-700">{design.designer.displayName}</span>
                        {design.designer.specialisations.length > 0 && <span className="block truncate text-xs text-slate-400">{design.designer.specialisations.slice(0, 2).join(" · ")}</span>}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {(list?.total ?? 0) > PAGE_SIZE && (
        <div className="mt-8 flex items-center justify-center gap-3 text-sm font-semibold text-slate-600">
          <button type="button" disabled={page <= 1} onClick={() => update({ page: String(page - 1) }, true)} className="rounded-xl border border-slate-200 px-4 py-2 disabled:opacity-40">
            Previous
          </button>
          <span>
            Page {page} of {lastPage}
          </span>
          <button type="button" disabled={page >= lastPage} onClick={() => update({ page: String(page + 1) }, true)} className="rounded-xl border border-slate-200 px-4 py-2 disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </main>
  );
}
