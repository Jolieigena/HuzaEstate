"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Select from "@/components/shared/Select";
import { useToast } from "@/lib/toast-context";
import { useBasket } from "@/lib/furniture/basket";
import { FurnitureApi, STOCK_LABELS, formatPrice, type ProductFacets, type ProductList, type ProductSort } from "@/lib/furniture/api";
import { priceBrackets } from "@/lib/priceBrackets";

const PAGE_SIZE = 24;
const SORT_LABELS: Record<ProductSort, string> = { newest: "Newest first", price_asc: "Price: low to high", price_desc: "Price: high to low", name: "Name A to Z" };
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
  const { showToast } = useToast();
  const basket = useBasket();

  // Every filter lives in the web address, so a filtered view can be shared and reached with Back.
  const get = (key: string) => params.get(key) ?? "";
  const category = get("category");
  const supplier = get("supplier");
  const country = get("country");
  const available = get("available") === "1";
  const currencyParam = get("currency");
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

  const currencies = facets?.currencies ?? [];
  const defaultCurrency = [...currencies].sort((a, b) => b.count - a.count)[0]?.code ?? "USD";
  const currency = currencyParam || defaultCurrency;
  const brackets = useMemo(() => priceBrackets(currency, USD_EDGES), [currency]);
  const activeBracket = brackets.findIndex((b) => String(b.min ?? "") === minPrice && String(b.max ?? "") === maxPrice);
  const priced = minPrice !== "" || maxPrice !== "";

  const [data, setData] = useState<{ key: string; list?: ProductList; error?: string } | null>(null);
  const key = params.toString();
  useEffect(() => {
    let cancelled = false;
    FurnitureApi.list({
      category,
      supplierId: supplier,
      country,
      availability: available ? "available" : "",
      currency: priced || currencyParam ? currency : undefined,
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
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = data?.list;
  const loading = data?.key !== key;
  const lastPage = Math.max(Math.ceil((list?.total ?? 0) / PAGE_SIZE), 1);
  const supplierName = facets?.suppliers.find((s) => s.id === supplier)?.name;

  const chips: { label: string; clear: Record<string, string | undefined> }[] = [];
  if (category) chips.push({ label: category, clear: { category: undefined } });
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
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Furniture</h1>
        <Link href="/furniture/order" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 transition-colors hover:border-[#2ec440]">
          Order basket
          {basket.count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[11px] text-white">{basket.count}</span>}
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          className="min-w-52 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15"
          placeholder="Search furniture"
          aria-label="Search furniture"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <div className="w-56">
          <Select className={selectClass} value={category} aria-label="Category" onChange={(e) => update({ category: e.target.value || undefined })}>
            <option value="">All categories</option>
            {(facets?.categories ?? []).map((c) => (
              <option key={c.name} value={c.name}>
                {withCount(c.name, c.count)}
              </option>
            ))}
          </Select>
        </div>
        <button
          type="button"
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((open) => !open)}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors ${panelOpen || filterCount > 0 ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M6 12h12M10 18h4" />
          </svg>
          Filters
          {filterCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[11px] text-white">{filterCount}</span>}
        </button>
        <div className="w-48">
          <Select className={selectClass} value={sort} aria-label="Sort furniture" onChange={(e) => update({ sort: e.target.value === "newest" ? undefined : e.target.value })}>
            {(Object.keys(SORT_LABELS) as ProductSort[]).map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
      </div>

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
          {currencies.length > 1 ? (
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
          ) : (
            <div />
          )}
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
            <p className="text-sm font-semibold text-slate-400">No furniture matches</p>
            {chips.length > 0 && (
              <button type="button" onClick={clearAll} className="mt-3 text-sm font-bold text-[#219b31] hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${loading ? "opacity-60" : ""}`}>
            {(list?.products ?? []).map((product) => (
              <div key={product.id} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <Link href={`/furniture/${product.id}`} className="block">
                  <div className="relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {product.images[0] ? <img src={product.images[0]} alt={product.name} className={`h-52 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${product.stock === "out_of_stock" ? "opacity-60" : ""}`} /> : <div className="h-52 w-full bg-slate-100" />}
                    {product.stock !== "in_stock" && (
                      <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-800 shadow">
                        {STOCK_LABELS[product.stock]}
                        {product.stock === "made_to_order" && product.leadTimeDays ? ` · ${product.leadTimeDays} days` : ""}
                      </span>
                    )}
                  </div>
                  <div className="px-4 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{product.category}</p>
                    <h2 className="mt-1 font-black text-slate-900">{product.name}</h2>
                  </div>
                </Link>
                <div className="mt-auto flex items-center justify-between gap-3 p-4 pt-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">{formatPrice(product.price, product.currency)}</p>
                    {product.supplier && <p className="truncate text-xs text-slate-400">{product.supplier.companyName}</p>}
                  </div>
                  <button
                    type="button"
                    disabled={product.stock === "out_of_stock"}
                    onClick={() => {
                      basket.add(product);
                      showToast(`${product.name} added to your order.`);
                    }}
                    className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-[#2ec440] hover:text-[#219b31] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add to order
                  </button>
                </div>
              </div>
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
