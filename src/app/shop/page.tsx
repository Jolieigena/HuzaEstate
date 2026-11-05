"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Select from "@/components/shared/Select";
import ProductCard from "@/components/shop/ProductCard";
import { FurnitureApi, type ProductFacets, type ProductList, type ProductSort } from "@/lib/furniture/api";
import CurrencyPicker from "@/components/CurrencyPicker";
import { priceBracketsFor } from "@/lib/currency/brackets";
import { useDisplayCurrency } from "@/lib/currency/display";
import { useShopTabs } from "@/lib/furniture/groups";

const PAGE_SIZE = 24;
const SORT_LABELS: Record<ProductSort, string> = { newest: "Newest first", price_asc: "Price: low to high", price_desc: "Price: high to low", name: "Name A to Z" };
const OTHER = "other";
const USD_EDGES = [50, 150, 300, 600, 1200];

export default function FurnitureCatalogPage() {
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

  // Every filter lives in the web address, so a filtered view can be shared and reached with Back.
  const get = (key: string) => params.get(key) ?? "";
  const category = get("category");
  const group = get("group");
  const supplier = get("supplier");
  const country = get("country");
  const available = get("available") === "1";
  const minPrice = get("min");
  const maxPrice = get("max");
  const sort = (get("sort") as ProductSort) || "newest";
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

  const [facets, setFacets] = useState<ProductFacets | null>(null);
  useEffect(() => {
    let cancelled = false;
    FurnitureApi.filters().then((result) => {
      if (!cancelled && result.ok) setFacets(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    if (searchInput.trim() === search) return;
    const timer = setTimeout(() => update({ q: searchInput.trim() || undefined }), 350);
    return () => clearTimeout(timer);
  }, [searchInput, search, update]);

  const money = useDisplayCurrency();
  const currency = money.currency ?? "USD";
  const brackets = useMemo(() => priceBracketsFor(money, USD_EDGES), [money]);
  const activeBracket = brackets.findIndex((b) => String(b.min ?? "") === minPrice && String(b.max ?? "") === maxPrice);
  const priced = minPrice !== "" || maxPrice !== "";

  const [data, setData] = useState<{ key: string; list?: ProductList; error?: string } | null>(null);
  const key = params.toString();
  useEffect(() => {
    let cancelled = false;
    FurnitureApi.list({
      category,
      group,
      supplierId: supplier,
      country,
      availability: available ? "available" : "",
      inCurrency: money.currency ?? undefined,
      minPrice: minPrice === "" ? "" : Number(minPrice),
      maxPrice: maxPrice === "" ? "" : Number(maxPrice),
      search,
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
  }, [key, money.currency]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = data?.list;
  const loading = data?.key !== key;
  const lastPage = Math.max(Math.ceil((list?.total ?? 0) / PAGE_SIZE), 1);
  const tabs = useShopTabs();
  // The tab a view belongs to: the one chosen, or the one that lists the chosen category.
  const activeTab = group || (category ? tabs?.groups.find((g) => g.categories.some((c) => c.name === category))?.name ?? (tabs?.other.some((c) => c.name === category) ? OTHER : "") : "");
  const [openTab, setOpenTab] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openTab) return;
    const onDown = (e: MouseEvent) => {
      if (tabsRef.current && !tabsRef.current.contains(e.target as Node)) setOpenTab("");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenTab("");
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openTab]);
  const supplierName = facets?.suppliers.find((s) => s.id === supplier)?.name;

  const chips: { label: string; clear: Record<string, string | undefined> }[] = [];
  if (group && !category) chips.push({ label: group === OTHER ? "Other" : group, clear: { group: undefined } });
  if (category) chips.push({ label: category, clear: { category: undefined, group: undefined } });
  if (supplier) chips.push({ label: supplierName ?? "Supplier", clear: { supplier: undefined } });
  if (country) chips.push({ label: country, clear: { country: undefined } });
  if (priced) chips.push({ label: activeBracket >= 0 ? brackets[activeBracket].label : `${minPrice || 0} to ${maxPrice || "any"}`, clear: { min: undefined, max: undefined, currency: undefined } });
  if (available) chips.push({ label: "Available now", clear: { available: undefined } });
  if (search) chips.push({ label: `“${search}”`, clear: { q: undefined } });

  const [panelOpen, setPanelOpen] = useState(false);
  const clearAll = () => {
    setSearchInput("");
    router.replace(pathname, { scroll: false });
  };
  const filterCount = chips.filter((c) => !("q" in c.clear)).length;
  const selectClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15";
  const labelClass = "block text-xs font-bold uppercase tracking-wide text-slate-500";
  const withCount = (name: string, count: number) => `${name} (${count})`;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
      <h1 className="sr-only">Shop</h1>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="h-11 min-w-52 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15"
          placeholder="Search the shop"
          aria-label="Search the shop"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button
          type="button"
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((open) => !open)}
          className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors ${panelOpen || filterCount > 0 ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M6 12h12M10 18h4" />
          </svg>
          Filters
          {filterCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[11px] text-white">{filterCount}</span>}
        </button>
        <div className="w-48">
          <Select className={`${selectClass} !h-11 !py-0`} value={sort} aria-label="Sort products" onChange={(e) => update({ sort: e.target.value === "newest" ? undefined : e.target.value })}>
            {(Object.keys(SORT_LABELS) as ProductSort[]).map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {tabs && (tabs.groups.length > 0 || tabs.other.length > 0) && (
        <div ref={tabsRef} className="mt-5">
          <div role="tablist" aria-label="Shop categories" className="flex gap-1 overflow-x-auto border-b border-slate-200">
            <button
              type="button"
              role="tab"
              aria-selected={!activeTab}
              onClick={() => {
                setOpenTab("");
                update({ category: undefined, group: undefined });
              }}
              className={`relative shrink-0 px-4 py-3 text-sm font-bold transition-colors ${!activeTab ? "text-slate-900 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-[#2ec440]" : "text-slate-500 hover:text-slate-900"}`}
            >
              All
            </button>
            {[...tabs.groups.map((g) => ({ key: g.name, label: g.name, categories: g.categories })), ...(tabs.other.length > 0 ? [{ key: OTHER, label: "Other", categories: tabs.other }] : [])].map((tab) => {
              const open = openTab === tab.key;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-haspopup="true"
                  aria-expanded={open}
                  onClick={() => setOpenTab(open ? "" : tab.key)}
                  className={`relative inline-flex shrink-0 items-center gap-1.5 px-4 py-3 text-sm font-bold transition-colors ${active ? "text-slate-900 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-[#2ec440]" : "text-slate-500 hover:text-slate-900"}`}
                >
                  {tab.label}
                  <svg className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              );
            })}
          </div>
          {openTab && (
            <TabMenu
              label={openTab === OTHER ? "Other" : openTab}
              categories={openTab === OTHER ? tabs.other : tabs.groups.find((g) => g.name === openTab)?.categories ?? []}
              selectedCategory={category}
              wholeTabSelected={group === openTab && !category}
              onPick={(next) => {
                setOpenTab("");
                update(next);
              }}
              tab={openTab}
            />
          )}
        </div>
      )}

      {panelOpen && (
        <section aria-label="Filters" className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <label className={labelClass}>
            Supplier
            <Select className={`${selectClass} mt-1.5 normal-case tracking-normal`} value={supplier} aria-label="Supplier" onChange={(e) => update({ supplier: e.target.value || undefined })}>
              <option value="">Any supplier</option>
              {(facets?.suppliers ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {withCount(s.name, s.count)}
                </option>
              ))}
            </Select>
          </label>
          <label className={labelClass}>
            Supplier&apos;s country
            <Select className={`${selectClass} mt-1.5 normal-case tracking-normal`} value={country} aria-label="Supplier's country" onChange={(e) => update({ country: e.target.value || undefined })}>
              <option value="">Any country</option>
              {(facets?.countries ?? []).map((c) => (
                <option key={c.name} value={c.name}>
                  {withCount(c.name, c.count)}
                </option>
              ))}
            </Select>
          </label>
          <label className={labelClass}>
            Price
            <Select
              className={`${selectClass} mt-1.5 normal-case tracking-normal`}
              value={activeBracket >= 0 ? String(activeBracket) : priced ? "custom" : ""}
              aria-label="Price"
              onChange={(e) => {
                const bracket = e.target.value === "" || e.target.value === "custom" ? undefined : brackets[Number(e.target.value)];
                update({ min: bracket?.min !== undefined ? String(bracket.min) : undefined, max: bracket?.max !== undefined ? String(bracket.max) : undefined, currency: bracket ? currency : undefined });
              }}
            >
              <option value="">Any price</option>
              {priced && activeBracket < 0 && <option value="custom">{minPrice || 0} to {maxPrice || "any"}</option>}
              {brackets.map((b, i) => (
                <option key={b.label} value={String(i)}>
                  {b.label}
                </option>
              ))}
            </Select>
          </label>
          <label className={labelClass}>
            Currency
            <div className="mt-1.5"><CurrencyPicker className={`${selectClass} normal-case tracking-normal`} onChange={() => update({ min: undefined, max: undefined, currency: undefined })} /></div>
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-slate-700">
              <input type="checkbox" className="h-4 w-4 accent-[#2ec440]" checked={available} onChange={(e) => update({ available: e.target.checked ? "1" : undefined })} />
              Available now{facets ? ` (${facets.available})` : ""}
            </label>
          </div>
        </section>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2" aria-live="polite">
        <p className="mr-2 text-sm font-semibold text-slate-500">{loading && !list ? "Loading…" : `${list?.total ?? 0} ${list?.total === 1 ? "item" : "items"}`}</p>
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
        ) : list && list.products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-slate-400">Nothing matches</p>
            {chips.length > 0 && (
              <button type="button" onClick={clearAll} className="mt-3 text-sm font-bold text-[#219b31] hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${loading ? "opacity-60" : ""}`}>
            {(list?.products ?? []).map((product) => (
              <ProductCard key={product.id} product={product} />
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

/** The dropdown under a shop tab: the whole tab, then each of its categories with how many products it has. */
function TabMenu({ label, tab, categories, selectedCategory, wholeTabSelected, onPick }: { label: string; tab: string; categories: { name: string; count: number }[]; selectedCategory: string; wholeTabSelected: boolean; onPick: (next: Record<string, string | undefined>) => void }) {
  const item = "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50";
  return (
    <div role="menu" aria-label={`${label} categories`} className="grid gap-1 rounded-b-2xl border border-t-0 border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <button type="button" role="menuitem" onClick={() => onPick({ group: tab, category: undefined })} className={`${item} font-bold ${wholeTabSelected ? "bg-slate-50 text-[#219b31]" : "text-slate-900"}`}>
        All in {label}
      </button>
      {categories.map((c) => (
        <button key={c.name} type="button" role="menuitem" onClick={() => onPick({ category: c.name, group: undefined })} className={`${item} font-semibold ${selectedCategory === c.name ? "bg-slate-50 text-[#219b31]" : "text-slate-700"}`}>
          <span>{c.name}</span>
          <span className="text-xs font-bold text-slate-400">{c.count}</span>
        </button>
      ))}
      {categories.length === 0 && <p className="px-3 py-2.5 text-sm font-semibold text-slate-400">No categories in this tab yet</p>}
    </div>
  );
}
