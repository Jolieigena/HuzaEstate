"use client";

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';
import AISearchCard from '@/components/AISearchCard';
import { useVisibleListings } from '@/lib/admin/listings';
import { useAllProperties } from '@/lib/sellerListings/hooks';
import type { AIPropertyFilters } from '@/app/api/ai-property-search/route';
import { SavedSearchesStoreEngine } from '@/lib/savedSearches/store';
import { useSavedSearches } from '@/lib/savedSearches/hooks';
import type { SavedSearchCriteria } from '@/lib/savedSearches/types';
import { useToast } from '@/lib/toast-context';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'largest';

const SORT_LABELS: Record<SortOption, string> = {
  default: 'Homes for You',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  largest: 'Largest',
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function titleCase(text: string) {
  return text.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

// ─── main page ────────────────────────────────────────────────────────────────

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') ?? '');
  const [filterType, setFilterType] = useState(searchParams.get('type') ?? 'all');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('all');
  const [bedsFilter, setBedsFilter] = useState('all');
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [customMinPrice, setCustomMinPrice] = useState('');
  const [customMaxPrice, setCustomMaxPrice] = useState('');
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [minSqm, setMinSqm] = useState('');
  const [maxSqm, setMaxSqm] = useState('');

  const [aiFilters, setAiFilters] = useState<AIPropertyFilters | null>(null);

  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSavedSearchesOpen, setIsSavedSearchesOpen] = useState(false);
  const savedSearches = useSavedSearches();
  const { showToast } = useToast();

  // Reset URL-backed fields during navigation, before rendering stale results.
  const query = searchParams.toString();
  const [previousQuery, setPreviousQuery] = useState(query);
  if (query !== previousQuery) {
    setPreviousQuery(query);
    setFilterType(searchParams.get('type') ?? 'all');
    setSearchTerm(searchParams.get('q') ?? '');
  }

  const allProperties = useAllProperties();
  const visibleProperties = useVisibleListings(allProperties);

  const filteredProperties = visibleProperties.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    const propText = `${p.title} ${p.location} ${p.city} ${p.propertyType} rwanda`.toLowerCase();
    const searchTokens = searchLower.split(/[\s,]+/).filter(Boolean);
    const matchesSearch = searchTokens.length === 0 || searchTokens.every(token => propText.includes(token));
    const matchesType = filterType === 'all' || p.type === filterType;
    const matchesPropType = propertyTypeFilter === 'all' || p.propertyType === propertyTypeFilter.toLowerCase();
    let matchesPrice = true;
    if (customMinPrice) matchesPrice = matchesPrice && p.price >= Number(customMinPrice);
    if (customMaxPrice) matchesPrice = matchesPrice && p.price <= Number(customMaxPrice);
    let matchesBeds = true;
    if (bedsFilter !== 'all') matchesBeds = p.bedrooms >= parseInt(bedsFilter);
    let matchesSqm = true;
    if (minSqm) matchesSqm = matchesSqm && p.sqm >= Number(minSqm);
    if (maxSqm) matchesSqm = matchesSqm && p.sqm <= Number(maxSqm);
    let matchesAi = true;
    if (aiFilters) {
      if (aiFilters.type && aiFilters.type !== 'all') matchesAi = matchesAi && p.type === aiFilters.type;
      if (aiFilters.propertyType && aiFilters.propertyType !== 'all') matchesAi = matchesAi && p.propertyType === aiFilters.propertyType;
      if (aiFilters.minBedrooms !== undefined) matchesAi = matchesAi && p.bedrooms >= aiFilters.minBedrooms;
      if (aiFilters.maxBedrooms !== undefined) matchesAi = matchesAi && p.bedrooms <= aiFilters.maxBedrooms;
      if (aiFilters.minPrice !== undefined) matchesAi = matchesAi && p.price >= aiFilters.minPrice;
      if (aiFilters.maxPrice !== undefined) matchesAi = matchesAi && p.price <= aiFilters.maxPrice;
      if (aiFilters.minSqm !== undefined) matchesAi = matchesAi && p.sqm >= aiFilters.minSqm;
      if (aiFilters.maxSqm !== undefined) matchesAi = matchesAi && p.sqm <= aiFilters.maxSqm;
      if (aiFilters.city) {
        const cityTokens = aiFilters.city.toLowerCase().split(/[\s,]+/).filter(Boolean);
        const propText = `${p.location} ${p.city} rwanda`.toLowerCase();
        matchesAi = matchesAi && cityTokens.every((token) => propText.includes(token));
      }
      if (aiFilters.keywords?.length) {
        const hay = `${p.title} ${p.description}`.toLowerCase();
        matchesAi = matchesAi && aiFilters.keywords.some((kw) => hay.includes(kw));
      }
    }
    return matchesSearch && matchesType && matchesPropType && matchesPrice && matchesBeds && matchesSqm && matchesAi;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'largest') return b.sqm - a.sqm;
    return 0;
  });

  function clearAll() {
    setSearchTerm(''); setFilterType('all'); setPropertyTypeFilter('all');
    setCustomMinPrice(''); setCustomMaxPrice(''); setBedsFilter('all');
    setMinSqm(''); setMaxSqm(''); setAiFilters(null);
  }

  function handleSaveSearch() {
    const criteria: SavedSearchCriteria = {
      searchTerm: searchTerm.trim(),
      filterType,
      propertyTypeFilter,
      minPrice: customMinPrice,
      maxPrice: customMaxPrice,
      bedsFilter,
      minSqm,
      maxSqm,
    };
    const res = SavedSearchesStoreEngine.save(criteria);
    if (res === 'empty') showToast('Please enter a location or select a filter first.', 'error');
    else if (res === 'duplicate') showToast('You already saved this search.', 'info');
    else showToast('Search saved to your account!', 'success');
  }

  return (
    <div className="w-full bg-[#f8fafc] pt-4 pb-0 flex flex-col min-h-screen">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 md:px-8 flex-shrink-0">

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between pb-6 pt-2 border-b border-slate-100 mb-6 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 xl:gap-6 w-full xl:w-auto flex-1 flex-wrap">

            {/* Search input */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-[280px]">
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Kigali, Rwanda" className="w-full pl-11 pr-4 py-2.5 bg-white/60 border border-transparent rounded-full focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all text-slate-900 placeholder:text-slate-500 font-medium text-[15px] shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            {/* Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status */}
              <div className="relative">
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="appearance-none bg-white border border-slate-200 rounded-full px-5 py-2.5 pr-10 font-medium text-[14px] text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 shadow-sm transition-all">
                  <option value="all">Any Status</option><option value="sale">For Sale</option><option value="rent">For Rent</option>
                </select>
                <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>

              {/* Price */}
              <div className="relative">
                <button onClick={() => setIsPriceOpen(!isPriceOpen)} className="bg-white border border-slate-200 rounded-full px-5 py-2.5 font-medium text-[14px] text-slate-700 hover:border-slate-300 shadow-sm flex items-center gap-2 transition-all">
                  {customMinPrice || customMaxPrice ? `Price: $${customMinPrice || '0'} – $${customMaxPrice || 'Any'}` : 'Any Price'}
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isPriceOpen && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 w-72">
                    <h3 className="font-bold text-slate-900 mb-2 px-2 text-[15px]">Price Range</h3>
                    <div className="flex flex-col gap-0.5 mb-4">
                      {[['Any Price','',''],['Under $100k','','100000'],['$100k – $300k','100000','300000'],['$300k – $500k','300000','500000'],['Over $500k','500000','']].map(([l,mn,mx])=>(
                        <button key={l} onClick={()=>{setCustomMinPrice(mn);setCustomMaxPrice(mx);setIsPriceOpen(false);}} className="text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700 font-medium text-[14px] transition-colors">{l}</button>
                      ))}
                    </div>
                    <div className="w-full h-px bg-slate-100 mb-4" />
                    <h4 className="font-bold text-slate-900 mb-2 px-2 text-[13px] uppercase tracking-wider">Custom</h4>
                    <div className="flex items-center gap-3 px-2">
                      <div className="flex-1 relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span><input type="number" placeholder="Min" value={customMinPrice} onChange={(e)=>setCustomMinPrice(e.target.value)} className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]" /></div>
                      <span className="text-slate-400 font-medium">–</span>
                      <div className="flex-1 relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span><input type="number" placeholder="Max" value={customMaxPrice} onChange={(e)=>setCustomMaxPrice(e.target.value)} className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]" /></div>
                    </div>
                    <div className="mt-4 flex gap-2 px-2">
                      <button onClick={()=>{setCustomMinPrice('');setCustomMaxPrice('');}} className="flex-1 py-2 font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-[14px] border border-slate-200">Reset</button>
                      <button onClick={()=>setIsPriceOpen(false)} className="flex-1 py-2 font-semibold text-white bg-[#2ec440] hover:bg-[#28b039] rounded-lg transition-colors text-[14px]">Apply</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Beds */}
              <div className="relative">
                <select value={bedsFilter} onChange={(e)=>setBedsFilter(e.target.value)} className="appearance-none bg-white border border-slate-200 rounded-full px-5 py-2.5 pr-10 font-medium text-[14px] text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 shadow-sm transition-all">
                  <option value="all">Any Beds</option><option value="1">1+ beds</option><option value="2">2+ beds</option><option value="3">3+ beds</option><option value="4">4+ beds</option>
                </select>
                <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>

              {/* Type */}
              <div className="relative">
                <select value={propertyTypeFilter} onChange={(e)=>setPropertyTypeFilter(e.target.value)} className="appearance-none bg-white border border-slate-200 rounded-full px-5 py-2.5 pr-10 font-medium text-[14px] text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 shadow-sm transition-all">
                  <option value="all">Type</option><option value="House">Houses</option><option value="Apartment">Apartments</option><option value="Land">Land</option>
                </select>
                <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>

              {/* More */}
              <div className="relative">
                <button onClick={()=>setIsMoreOpen(!isMoreOpen)} className="bg-white border border-slate-200 rounded-full px-5 py-2.5 font-medium text-[14px] text-slate-700 hover:border-slate-300 shadow-sm flex items-center gap-2 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                  {minSqm || maxSqm ? 'More (1)' : 'More'}
                </button>
                {isMoreOpen && (
                  <div className="absolute top-full right-0 xl:left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-5 z-50 w-72">
                    <h3 className="font-bold text-slate-900 mb-4 text-[15px]">Square Meters (sqm)</h3>
                    <div className="flex items-center gap-3">
                      <input type="number" placeholder="Min sqm" value={minSqm} onChange={(e)=>setMinSqm(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]" />
                      <span className="text-slate-400 font-medium">–</span>
                      <input type="number" placeholder="Max sqm" value={maxSqm} onChange={(e)=>setMaxSqm(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]" />
                    </div>
                    <div className="mt-5 flex gap-2">
                      <button onClick={()=>{setMinSqm('');setMaxSqm('');}} className="flex-1 py-2 font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-[14px] border border-slate-200">Reset</button>
                      <button onClick={()=>setIsMoreOpen(false)} className="flex-1 py-2 font-semibold text-white bg-[#2ec440] hover:bg-[#28b039] rounded-lg transition-colors text-[14px]">Apply</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save Search */}
          <div className="flex items-center w-full xl:w-auto justify-end mt-2 xl:mt-0">
            <button onClick={handleSaveSearch} className="text-[#2ec440] font-bold text-[14px] hover:bg-[#2ec440]/10 px-4 py-2 rounded-full transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              Save Search
            </button>
          </div>
        </div>

        {/* ── Title row ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-1">
              {searchTerm.trim() ? titleCase(searchTerm.trim()) : 'Kigali, Rwanda'}
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              {filteredProperties.length} {filteredProperties.length === 1 ? 'result' : 'results'}
              {aiFilters && <span className="ml-2 inline-flex items-center gap-1 text-[#2ec440] font-semibold"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" /></svg>AI filtered · <button onClick={clearAll} className="underline underline-offset-2 hover:text-[#28b039]">clear</button></span>}
            </p>
          </div>
          <div className="relative">
            <div onClick={() => setIsSortOpen(!isSortOpen)} className="hidden sm:flex items-center gap-1 text-sm font-bold text-slate-900 cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 select-none">
              Sort: <span className="text-slate-500">{SORT_LABELS[sortBy]}</span>
              <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
            {isSortOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 w-48">
                {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSortBy(opt); setIsSortOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-[14px] font-medium text-slate-700 transition-colors"
                  >
                    {SORT_LABELS[opt]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Property grid ─────────────────────────────────────────────────── */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 md:px-8 flex-1 pb-12">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {(() => {
            // The AI search card takes the 3rd grid slot (rightmost of the
            // first row on the lg 3-column layout) instead of the old
            // floating button — it IS the search interface now, not a
            // trigger for one, so it lives right in the results. It's always
            // rendered in this same list under one stable key (even with 0
            // matching properties, where it's the only item) so React keeps
            // its conversation state across result-count changes instead of
            // remounting it and wiping the chat.
            const aiCard = (
              <AISearchCard
                key="ai-search-card"
                visibleProperties={visibleProperties}
                onFiltersChange={(f) => setAiFilters(f)}
                hasActiveFilter={!!aiFilters}
                matchCount={filteredProperties.length}
                onClearFilter={clearAll}
              />
            );
            const items: React.ReactNode[] = [];
            filteredProperties.forEach((property, i) => {
              items.push(<PropertyCard key={property.id} property={property} />);
              if (i === 1) items.push(aiCard);
            });
            if (filteredProperties.length < 2) items.push(aiCard);
            return items;
          })()}
        </div>
        {filteredProperties.length === 0 && (
          <div className="text-center py-32 bg-white rounded-3xl border border-slate-200 mt-6 max-w-2xl mx-auto shadow-sm">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No exact matches</h3>
            <p className="text-slate-500 mb-6">
              {aiFilters ? "No listings match your dream home yet." : "Try changing or removing some of your filters."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={clearAll} className="bg-[#2ec440] hover:bg-[#28b039] text-white font-bold py-2.5 px-6 rounded-full transition-colors shadow-sm">
                Clear all filters
              </button>
              <Link href="/build" className="flex items-center gap-2 border border-slate-900 text-slate-900 font-bold py-2.5 px-6 rounded-full hover:bg-slate-900 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                Design &amp; Build My Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={null}>
      <PropertiesContent />
    </Suspense>
  );
}
