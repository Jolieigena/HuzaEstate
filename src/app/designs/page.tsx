"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DESIGN_CATEGORY_LABELS, DesignsApi, formatDesignPrice, type DesignCategory, type DesignList } from "@/lib/designs/api";

const PAGE_SIZE = 24;

export default function DesignsCatalogPage() {
  const [category, setCategory] = useState<DesignCategory | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState<{ key: string; data?: DesignList; error?: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const key = `${category}|${search}|${page}`;
  useEffect(() => {
    let cancelled = false;
    DesignsApi.list({ category, search, page, limit: PAGE_SIZE }).then((result) => {
      if (!cancelled) setLoaded(result.ok ? { key, data: result.data } : { key, error: result.error });
    });
    return () => {
      cancelled = true;
    };
  }, [category, search, page, key]);

  const data = loaded?.data;
  const loading = loaded?.key !== key;
  const lastPage = Math.max(Math.ceil((data?.total ?? 0) / PAGE_SIZE), 1);
  const tabs: { value: DesignCategory | ""; label: string }[] = [{ value: "", label: "All" }, ...(Object.keys(DESIGN_CATEGORY_LABELS) as DesignCategory[]).map((c) => ({ value: c, label: DESIGN_CATEGORY_LABELS[c] }))];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Designs</h1>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2" role="tablist" aria-label="Design type">
          {tabs.map((tab) => (
            <button
              key={tab.value || "all"}
              type="button"
              role="tab"
              aria-selected={category === tab.value}
              onClick={() => {
                setCategory(tab.value);
                setPage(1);
              }}
              className={`rounded-full border px-5 py-2 text-sm font-bold transition-colors ${category === tab.value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15 sm:max-w-xs"
          placeholder="Search designs"
          aria-label="Search designs"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="mt-8">
        {loaded?.error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{loaded.error}</p>
        ) : loading && !data ? (
          <p className="py-16 text-center text-sm font-semibold text-slate-400">Loading designs…</p>
        ) : data && data.designs.length === 0 ? (
          <p className="py-16 text-center text-sm font-semibold text-slate-400">No designs found</p>
        ) : (
          <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
            {(data?.designs ?? []).map((design) => (
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

      {(data?.total ?? 0) > PAGE_SIZE && (
        <div className="mt-8 flex items-center justify-center gap-3 text-sm font-semibold text-slate-600">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-xl border border-slate-200 px-4 py-2 disabled:opacity-40">
            Previous
          </button>
          <span>
            Page {page} of {lastPage}
          </span>
          <button type="button" disabled={page >= lastPage} onClick={() => setPage(page + 1)} className="rounded-xl border border-slate-200 px-4 py-2 disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </main>
  );
}
