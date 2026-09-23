"use client";

import React, { Suspense, useEffect, useRef, useState } from 'react';
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
import { COUNTRY_OPTIONS, findCountry, getPropertyCountry } from '@/lib/countries';
import { getSelectedCountryName } from '@/components/CountrySelector';

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

// Status/Type are free-text inputs (with a <datalist> of suggestions) rather
// than closed <select> dropdowns, so typing something close ("renting",
// "flat") still resolves — see the datalist options rendered alongside each
// input for what's suggested. An unrecognized value just means "no filter"
// rather than zeroing out the results.
function parseStatusInput(text: string): 'all' | 'sale' | 'rent' {
  const t = text.trim().toLowerCase();
  if (!t) return 'all';
  if (/rent/.test(t)) return 'rent';
  if (/sale|buy|sell/.test(t)) return 'sale';
  return 'all';
}

// The underlying data model only has 3 real property-type buckets (see
// Property['propertyType']) — "Villa", "Condo" etc. aren't separate
// categories, they're synonyms real users type that should resolve to
// whichever bucket they actually mean, same as "renting"/"buy" already do
// for Status above. That keeps this in sync with the post-property form's
// Property Type select without needing a parallel taxonomy there.
function parsePropertyTypeInput(text: string): 'all' | 'house' | 'apartment' | 'land' {
  const t = text.trim().toLowerCase();
  if (!t) return 'all';
  if (/apartment|flat|condo|studio/.test(t)) return 'apartment';
  if (/land|plot|lot|acre/.test(t)) return 'land';
  if (/house|villa|home|bungalow|townhouse|duplex|cottage|mansion|commercial/.test(t)) return 'house';
  return 'all';
}

function parseMinNumberInput(text: string): number | undefined {
  const t = text.trim();
  if (!t) return undefined;
  const n = parseInt(t, 10);
  return Number.isNaN(n) ? undefined : n;
}

// ─── main page ────────────────────────────────────────────────────────────────

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') ?? '');
  const [statusInput, setStatusInput] = useState(searchParams.get('type') === 'rent' ? 'For Rent' : searchParams.get('type') === 'sale' ? 'For Sale' : '');
  const [propertyTypeInput, setPropertyTypeInput] = useState('');
  const [bedsInput, setBedsInput] = useState('');
  const [bathsInput, setBathsInput] = useState('');
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [customMinPrice, setCustomMinPrice] = useState('');
  const [customMaxPrice, setCustomMaxPrice] = useState('');
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  // Price/More render as position:fixed panels (see openPanel below) instead
  // of being absolutely positioned inside the horizontally-scrolling pills
  // row — an absolute panel there either scrolls out of view with its
  // trigger or gets clipped by the row's overflow-x-auto, which is exactly
  // the cut-off/overlapping panel bug this replaces.
  const priceButtonRef = useRef<HTMLButtonElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [pricePanelPos, setPricePanelPos] = useState<{ top: number; left: number } | null>(null);
  const [morePanelPos, setMorePanelPos] = useState<{ top: number; left: number } | null>(null);
  const [minSqm, setMinSqm] = useState('');
  const [maxSqm, setMaxSqm] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  // Seeded from whatever the visitor picked in the navbar's country pill
  // (CountrySelector.tsx) — a default only, still fully typeable below.
  // Starts at '' (matching SSR, which has no localStorage) and is filled in
  // by the effect further down — a lazy initializer here would read a real
  // value on the client's first render while the server rendered '', a
  // genuine hydration mismatch on this controlled input's value.
  const [countryInput, setCountryInput] = useState('');

  const filterType = parseStatusInput(statusInput);
  const propertyTypeFilter = parsePropertyTypeInput(propertyTypeInput);

  const [aiFilters, setAiFilters] = useState<AIPropertyFilters | null>(null);
  const [isDreamOpen, setIsDreamOpen] = useState(false);
  const [dreamVisible, setDreamVisible] = useState(false);

  function openDreamPanel() {
    setIsDreamOpen(true);
    requestAnimationFrame(() => setDreamVisible(true));
  }
  function closeDreamPanel() {
    setDreamVisible(false);
    setTimeout(() => setIsDreamOpen(false), 300); // wait for slide-out animation
  }

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
    const urlType = searchParams.get('type');
    setStatusInput(urlType === 'rent' ? 'For Rent' : urlType === 'sale' ? 'For Sale' : '');
    setSearchTerm(searchParams.get('q') ?? '');
  }

  useEffect(() => {
    const saved = getSelectedCountryName();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setCountryInput(saved);
  }, []);

  // Fixed-position panels don't track their trigger on scroll, so close them
  // the moment any scrolling happens (the pills row's own horizontal scroll
  // included — that still fires a 'scroll' event window can catch in the
  // capture phase) rather than letting them drift away from the button.
  useEffect(() => {
    if (!isPriceOpen && !isMoreOpen) return;
    const closeAll = () => { setIsPriceOpen(false); setIsMoreOpen(false); };
    window.addEventListener('scroll', closeAll, true);
    window.addEventListener('resize', closeAll);
    return () => {
      window.removeEventListener('scroll', closeAll, true);
      window.removeEventListener('resize', closeAll);
    };
  }, [isPriceOpen, isMoreOpen]);

  function openPanel(buttonRef: React.RefObject<HTMLButtonElement | null>, panelWidth: number, setPos: (pos: { top: number; left: number }) => void, open: () => void) {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const left = Math.min(Math.max(16, rect.left), window.innerWidth - panelWidth - 16);
      setPos({ top: rect.bottom + 8, left });
    }
    open();
  }

  const allProperties = useAllProperties();
  const visibleProperties = useVisibleListings(allProperties);

  const filteredProperties = visibleProperties.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    const propText = `${p.title} ${p.location} ${p.city} ${p.propertyType} rwanda`.toLowerCase();
    const searchTokens = searchLower.split(/[\s,]+/).filter(Boolean);
    const matchesSearch = searchTokens.length === 0 || searchTokens.every(token => propText.includes(token));
    const matchesType = filterType === 'all' || p.type === filterType;
    const matchesPropType = propertyTypeFilter === 'all' || p.propertyType === propertyTypeFilter;
    let matchesPrice = true;
    if (customMinPrice) matchesPrice = matchesPrice && p.price >= Number(customMinPrice);
    if (customMaxPrice) matchesPrice = matchesPrice && p.price <= Number(customMaxPrice);
    const minBeds = parseMinNumberInput(bedsInput);
    const matchesBeds = minBeds === undefined || p.bedrooms >= minBeds;
    const minBaths = parseMinNumberInput(bathsInput);
    const matchesBaths = minBaths === undefined || p.bathrooms >= minBaths;
    let matchesSqm = true;
    if (minSqm) matchesSqm = matchesSqm && p.sqm >= Number(minSqm);
    if (maxSqm) matchesSqm = matchesSqm && p.sqm <= Number(maxSqm);
    let matchesCity = true;
    if (cityInput.trim()) {
      const cityTokens = cityInput.toLowerCase().split(/[\s,]+/).filter(Boolean);
      const cityPropText = `${p.location} ${p.city} rwanda`.toLowerCase();
      matchesCity = cityTokens.every((token) => cityPropText.includes(token));
    }
    let matchesKeywords = true;
    if (keywordsInput.trim()) {
      const kws = keywordsInput.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
      const keywordHay = `${p.title} ${p.description}`.toLowerCase();
      matchesKeywords = kws.length === 0 || kws.some((kw) => keywordHay.includes(kw));
    }
    const wantedCountry = findCountry(countryInput);
    const matchesCountry = !wantedCountry || getPropertyCountry(p).code === wantedCountry.code;
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
    return matchesSearch && matchesType && matchesPropType && matchesPrice && matchesBeds && matchesBaths && matchesSqm && matchesCity && matchesKeywords && matchesCountry && matchesAi;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'largest') return b.sqm - a.sqm;
    return 0;
  });

  function clearAll() {
    setSearchTerm(''); setStatusInput(''); setPropertyTypeInput('');
    setCustomMinPrice(''); setCustomMaxPrice(''); setBedsInput(''); setBathsInput('');
    setMinSqm(''); setMaxSqm(''); setCityInput(''); setKeywordsInput(''); setCountryInput(''); setAiFilters(null);
  }

  function handleSaveSearch() {
    const criteria: SavedSearchCriteria = {
      searchTerm: searchTerm.trim(),
      filterType,
      propertyTypeFilter,
      minPrice: customMinPrice,
      maxPrice: customMaxPrice,
      bedsFilter: bedsInput.trim(),
      bathsFilter: bathsInput.trim(),
      minSqm,
      maxSqm,
      city: cityInput.trim(),
      keywords: keywordsInput.trim(),
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
          <div className="flex items-center gap-4 xl:gap-6 w-full xl:w-auto flex-1 flex-nowrap overflow-x-auto pb-1 [scrollbar-width:thin]">

            {/* Search input */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative w-[220px] sm:w-[280px]">
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Kigali, Rwanda" className="w-full pl-11 pr-4 py-2.5 bg-white/60 border border-transparent rounded-full focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all text-slate-900 placeholder:text-slate-500 font-medium text-[15px] shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            {/* Pills — one line, no wrap; the row scrolls horizontally instead of
                wrapping onto a second line, which is also what kept the Price/More
                dropdown panels below from getting clipped or drifting off-screen. */}
            <div className="flex items-center gap-2 flex-nowrap shrink-0">
              {/* Status — typeable, suggestions via datalist so "renting"/"buy" etc still resolve */}
              <div className="relative shrink-0">
                <input
                  type="text"
                  list="status-options"
                  placeholder="Any Status"
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  className="w-[150px] bg-white border border-slate-200 rounded-full pl-5 pr-8 py-2.5 font-medium text-[14px] text-slate-700 placeholder:text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 shadow-sm transition-all"
                />
                <datalist id="status-options">
                  <option value="For Sale" />
                  <option value="For Rent" />
                </datalist>
                {statusInput && (
                  <button onClick={() => setStatusInput('')} aria-label="Clear status" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              {/* Price */}
              <div className="relative shrink-0">
                <button
                  ref={priceButtonRef}
                  onClick={() => (isPriceOpen ? setIsPriceOpen(false) : openPanel(priceButtonRef, 288, setPricePanelPos, () => setIsPriceOpen(true)))}
                  className="bg-white border border-slate-200 rounded-full px-5 py-2.5 font-medium text-[14px] text-slate-700 hover:border-slate-300 shadow-sm flex items-center gap-2 transition-all"
                >
                  {customMinPrice || customMaxPrice ? `Price: $${customMinPrice || '0'} – $${customMaxPrice || 'Any'}` : 'Any Price'}
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isPriceOpen && pricePanelPos && (
                  <div style={{ position: 'fixed', top: pricePanelPos.top, left: pricePanelPos.left }} className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 w-72">
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

              {/* Beds — typeable, any number, not just the presets in the datalist */}
              <div className="relative shrink-0">
                <input
                  type="text"
                  inputMode="numeric"
                  list="beds-options"
                  placeholder="Any Beds"
                  value={bedsInput}
                  onChange={(e) => setBedsInput(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-[132px] bg-white border border-slate-200 rounded-full pl-5 pr-8 py-2.5 font-medium text-[14px] text-slate-700 placeholder:text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 shadow-sm transition-all"
                />
                <datalist id="beds-options">
                  <option value="1" /><option value="2" /><option value="3" /><option value="4" /><option value="5" />
                </datalist>
                {bedsInput && (
                  <button onClick={() => setBedsInput('')} aria-label="Clear beds" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              {/* Baths — typeable, same pattern as Beds */}
              <div className="relative shrink-0">
                <input
                  type="text"
                  inputMode="numeric"
                  list="baths-options"
                  placeholder="Any Baths"
                  value={bathsInput}
                  onChange={(e) => setBathsInput(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-[136px] bg-white border border-slate-200 rounded-full pl-5 pr-8 py-2.5 font-medium text-[14px] text-slate-700 placeholder:text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 shadow-sm transition-all"
                />
                <datalist id="baths-options">
                  <option value="1" /><option value="2" /><option value="3" /><option value="4" />
                </datalist>
                {bathsInput && (
                  <button onClick={() => setBathsInput('')} aria-label="Clear baths" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              {/* Type — typeable, suggestions via datalist. These resolve down to the
                  same 3 real categories the post-property form offers (house/apartment/
                  land) — see parsePropertyTypeInput above — so a listing created there
                  is always reachable by every synonym suggested here. */}
              <div className="relative shrink-0">
                <input
                  type="text"
                  list="type-options"
                  placeholder="Any Type"
                  value={propertyTypeInput}
                  onChange={(e) => setPropertyTypeInput(e.target.value)}
                  className="w-[140px] bg-white border border-slate-200 rounded-full pl-5 pr-8 py-2.5 font-medium text-[14px] text-slate-700 placeholder:text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 shadow-sm transition-all"
                />
                <datalist id="type-options">
                  <option value="House" /><option value="Apartment" /><option value="Land" />
                  <option value="Villa" /><option value="Condo" /><option value="Townhouse" />
                  <option value="Studio" /><option value="Duplex" /><option value="Bungalow" />
                  <option value="Commercial" />
                </datalist>
                {propertyTypeInput && (
                  <button onClick={() => setPropertyTypeInput('')} aria-label="Clear type" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              {/* Country — typeable, suggestions via datalist; any world country resolves
                  (see COUNTRY_OPTIONS), not just Rwanda's immediate neighbors */}
              <div className="relative shrink-0">
                <input
                  type="text"
                  list="country-options"
                  placeholder="Any Country"
                  value={countryInput}
                  onChange={(e) => setCountryInput(e.target.value)}
                  className="w-[150px] bg-white border border-slate-200 rounded-full pl-5 pr-8 py-2.5 font-medium text-[14px] text-slate-700 placeholder:text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 shadow-sm transition-all"
                />
                <datalist id="country-options">
                  {COUNTRY_OPTIONS.map((c) => <option key={c.code} value={c.name} />)}
                </datalist>
                {countryInput && (
                  <button onClick={() => setCountryInput('')} aria-label="Clear country" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              {/* More — everything else, all typeable: sqm range, city/district, amenities */}
              <div className="relative shrink-0">
                <button
                  ref={moreButtonRef}
                  onClick={() => (isMoreOpen ? setIsMoreOpen(false) : openPanel(moreButtonRef, 288, setMorePanelPos, () => setIsMoreOpen(true)))}
                  className="bg-white border border-slate-200 rounded-full px-5 py-2.5 font-medium text-[14px] text-slate-700 hover:border-slate-300 shadow-sm flex items-center gap-2 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                  {(() => {
                    const n = [minSqm || maxSqm, cityInput, keywordsInput].filter(Boolean).length;
                    return n > 0 ? `More (${n})` : 'More';
                  })()}
                </button>
                {isMoreOpen && morePanelPos && (
                  <div style={{ position: 'fixed', top: morePanelPos.top, left: morePanelPos.left }} className="bg-white border border-slate-200 rounded-2xl shadow-xl p-5 z-50 w-72">
                    <h3 className="font-bold text-slate-900 mb-2 text-[15px]">Square Meters (sqm)</h3>
                    <div className="flex items-center gap-3">
                      <input type="number" placeholder="Min sqm" value={minSqm} onChange={(e)=>setMinSqm(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]" />
                      <span className="text-slate-400 font-medium">–</span>
                      <input type="number" placeholder="Max sqm" value={maxSqm} onChange={(e)=>setMaxSqm(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]" />
                    </div>

                    <h3 className="font-bold text-slate-900 mb-2 mt-5 text-[15px]">City / District</h3>
                    <input type="text" placeholder="e.g. Kigali, Musanze" value={cityInput} onChange={(e)=>setCityInput(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]" />

                    <h3 className="font-bold text-slate-900 mb-2 mt-5 text-[15px]">Amenities / Keywords</h3>
                    <input type="text" placeholder="e.g. pool, garden, furnished" value={keywordsInput} onChange={(e)=>setKeywordsInput(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]" />
                    <p className="text-[11px] text-slate-400 mt-1">Comma-separated — matches any one.</p>

                    <div className="mt-5 flex gap-2">
                      <button onClick={()=>{setMinSqm('');setMaxSqm('');setCityInput('');setKeywordsInput('');}} className="flex-1 py-2 font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-[14px] border border-slate-200">Reset</button>
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
        {filteredProperties.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border border-slate-200 mt-4 max-w-2xl mx-auto shadow-sm">
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

      {/* ── Floating "Describe Your Desired Property" button ─────────────── */}
      <button
        onClick={openDreamPanel}
        className={`fixed bottom-8 right-6 z-40 flex items-center gap-2 font-bold text-[14px] px-5 py-3 rounded-full shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
          aiFilters ? 'bg-[#2ec440] hover:bg-[#28b039] text-white' : 'bg-slate-900 hover:bg-[#2ec440] text-white'
        }`}
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zM5 15l.9 2.7L8.6 19l-2.7.9L5 22.6l-.9-2.7L1.4 19l2.7-.9L5 15zM19 15l.9 2.7 2.7.9-2.7.9L19 22.6l-.9-2.7-2.7-.9 2.7-.9L19 15z" />
        </svg>
        {aiFilters ? 'AI Active — Edit' : 'Describe Your Desired Property'}
        {aiFilters && <span className="w-2.5 h-2.5 rounded-full bg-white border-2 border-[#2ec440] absolute -top-0.5 -right-0.5" />}
      </button>

      {/* ── Slide-in AI search panel ──────────────────────────────────────── */}
      {isDreamOpen && (
        <>
          <div
            className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${dreamVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeDreamPanel}
          />
          <div className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl transition-transform duration-300 ease-in-out ${dreamVisible ? 'translate-x-0' : 'translate-x-full'}`}>
            <AISearchCard
              visibleProperties={visibleProperties}
              onFiltersChange={(f) => setAiFilters(f)}
              hasActiveFilter={!!aiFilters}
              matchCount={filteredProperties.length}
              onClearFilter={clearAll}
              onClose={closeDreamPanel}
            />
          </div>
        </>
      )}
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
