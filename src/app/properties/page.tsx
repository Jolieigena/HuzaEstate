"use client";

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';
import AISearchCard from '@/components/AISearchCard';
import { useAllProperties } from '@/lib/sellerListings/hooks';
import type { AIPropertyFilters } from '@/app/api/ai-property-search/route';
import { COUNTRY_OPTIONS, findCountry, getPropertyCountry } from '@/lib/countries';
import { getSelectedCountryName } from '@/lib/geo/useCurrentCountry';
import { AMENITY_OPTIONS } from '@/lib/properties/types';

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
  // The Price panel renders as a position:fixed panel (see openPanel below)
  // computed from its trigger's bounding rect, rather than being absolutely
  // positioned inline — that's what keeps it from getting clipped or
  // drifting off-screen if the pills row wraps or the page scrolls.
  const priceButtonRef = useRef<HTMLButtonElement>(null);
  const [pricePanelPos, setPricePanelPos] = useState<{ top: number; left: number } | null>(null);
  const [isAreaOpen, setIsAreaOpen] = useState(false);
  const areaButtonRef = useRef<HTMLButtonElement>(null);
  const [areaPanelPos, setAreaPanelPos] = useState<{ top: number; left: number } | null>(null);
  const [isBedsOpen, setIsBedsOpen] = useState(false);
  const bedsButtonRef = useRef<HTMLButtonElement>(null);
  const [bedsPanelPos, setBedsPanelPos] = useState<{ top: number; left: number } | null>(null);
  const [isBathsOpen, setIsBathsOpen] = useState(false);
  const bathsButtonRef = useRef<HTMLButtonElement>(null);
  const [bathsPanelPos, setBathsPanelPos] = useState<{ top: number; left: number } | null>(null);
  const [isAmenitiesOpen, setIsAmenitiesOpen] = useState(false);
  const amenitiesButtonRef = useRef<HTMLButtonElement>(null);
  const [amenitiesPanelPos, setAmenitiesPanelPos] = useState<{ top: number; left: number } | null>(null);
  const [minSqm, setMinSqm] = useState('');
  const [maxSqm, setMaxSqm] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  // Multiple countries can be picked at once (see the checklist panel below)
  // instead of the old single free-text field, which silently matched
  // nothing when someone typed a city ("london") instead of a country name.
  // Seeded from whatever the visitor previously picked via the (now-removed)
  // navbar country picker, if anything — see useCurrentCountry.ts.
  // Starts empty (matching SSR, which has no localStorage) and is filled in
  // by the effect further down.
  const [selectedCountryCodes, setSelectedCountryCodes] = useState<string[]>([]);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const countryButtonRef = useRef<HTMLButtonElement>(null);
  const [countryPanelPos, setCountryPanelPos] = useState<{ top: number; left: number } | null>(null);
  const [countrySearch, setCountrySearch] = useState('');
  function toggleCountry(code: string) {
    setSelectedCountryCodes((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);
  }

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
    const code = saved ? findCountry(saved)?.code : undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (code) setSelectedCountryCodes([code]);
  }, []);

  // A fixed-position panel doesn't track its trigger on scroll, so close it
  // the moment any scrolling happens rather than letting it drift away from
  // the button.
  useEffect(() => {
    if (!isPriceOpen && !isAreaOpen && !isBedsOpen && !isBathsOpen && !isAmenitiesOpen && !isCountryOpen) return;
    const close = () => { setIsPriceOpen(false); setIsAreaOpen(false); setIsBedsOpen(false); setIsBathsOpen(false); setIsAmenitiesOpen(false); setIsCountryOpen(false); };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [isPriceOpen, isAreaOpen, isBedsOpen, isBathsOpen, isAmenitiesOpen, isCountryOpen]);

  function openPanel(buttonRef: React.RefObject<HTMLButtonElement | null>, panelWidth: number, setPos: (pos: { top: number; left: number }) => void, open: () => void) {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const left = Math.min(Math.max(16, rect.left), window.innerWidth - panelWidth - 16);
      setPos({ top: rect.bottom + 8, left });
    }
    open();
  }

  // The checkbox list and the free-text field both just read/write the same
  // comma-separated keywordsInput string, so ticking "Pool" and typing
  // "rooftop" combine into one filter instead of being two separate ones.
  const selectedAmenities = keywordsInput.split(',').map((s) => s.trim()).filter(Boolean);
  function toggleAmenity(label: string) {
    const has = selectedAmenities.some((k) => k.toLowerCase() === label.toLowerCase());
    const next = has
      ? selectedAmenities.filter((k) => k.toLowerCase() !== label.toLowerCase())
      : [...selectedAmenities, label];
    setKeywordsInput(next.join(', '));
  }

  const visibleProperties = useAllProperties();

  const filteredProperties = visibleProperties.filter((p) => {
    const propCountryName = getPropertyCountry(p).name;
    const searchLower = searchTerm.toLowerCase();
    const propText = `${p.title} ${p.location} ${p.city} ${p.propertyType} ${propCountryName}`.toLowerCase();
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
      const cityPropText = `${p.location} ${p.city} ${propCountryName}`.toLowerCase();
      matchesCity = cityTokens.every((token) => cityPropText.includes(token));
    }
    let matchesKeywords = true;
    if (keywordsInput.trim()) {
      const kws = keywordsInput.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
      // Structured amenities (ticked on post-property/EditPropertyModal) plus
      // free-text title/description, so a listing that ticked "Pool" matches
      // even if the word never appears in its description.
      const keywordHay = `${p.title} ${p.description} ${(p.amenities ?? []).join(' ')}`.toLowerCase();
      matchesKeywords = kws.length === 0 || kws.some((kw) => keywordHay.includes(kw));
    }
    const matchesCountry = selectedCountryCodes.length === 0 || selectedCountryCodes.includes(getPropertyCountry(p).code);
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
        const aiPropText = `${p.location} ${p.city} ${propCountryName}`.toLowerCase();
        matchesAi = matchesAi && cityTokens.every((token) => aiPropText.includes(token));
      }
      if (aiFilters.keywords?.length) {
        const hay = `${p.title} ${p.description} ${(p.amenities ?? []).join(' ')}`.toLowerCase();
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

  // The heading follows whatever the visitor is looking for instead of a fixed place name.
  const selectedCountryNames = COUNTRY_OPTIONS.filter((c) => selectedCountryCodes.includes(c.code)).map((c) => c.name);
  const countryLabel = selectedCountryNames.length === 1 ? selectedCountryNames[0] : selectedCountryNames.length > 1 ? `${selectedCountryNames.length} countries` : '';
  const placeParts = [searchTerm.trim() ? titleCase(searchTerm.trim()) : titleCase(cityInput.trim()), countryLabel].filter(Boolean);
  const heading = placeParts.length
    ? placeParts.join(', ')
    : filterType === 'sale' ? 'Homes for sale' : filterType === 'rent' ? 'Homes for rent' : 'All properties';

  function clearAll() {
    setSearchTerm(''); setStatusInput(''); setPropertyTypeInput('');
    setCustomMinPrice(''); setCustomMaxPrice(''); setBedsInput(''); setBathsInput('');
    setMinSqm(''); setMaxSqm(''); setCityInput(''); setKeywordsInput(''); setSelectedCountryCodes([]); setAiFilters(null);
  }

  return (
    <div className="w-full bg-[#f8fafc] pt-4 pb-0 flex flex-col min-h-screen">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 md:px-8 flex-shrink-0">

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className="pb-6 pt-2 border-b border-slate-100 mb-6">
          {/* Search box and every filter share one flex-wrap flow (not nested
              in a separate row) so wrapping fills each line to the container's
              actual full width instead of leaving a trailing gap and wrapping
              early. */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-[280px]">
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="City, district or country" className="w-full pl-11 pr-4 py-2.5 bg-white/60 border border-transparent rounded-full focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all text-slate-900 placeholder:text-slate-500 font-medium text-[15px] shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

              {/* Status — typeable, suggestions via datalist so "renting"/"buy" etc still resolve */}
              <div className="relative">
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
              <div className="relative">
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

              {/* Beds — dropdown with quick presets plus a custom number input the
                  user can type any value into, same pattern as Price/Area Size. */}
              <div className="relative">
                <button
                  ref={bedsButtonRef}
                  onClick={() => (isBedsOpen ? setIsBedsOpen(false) : openPanel(bedsButtonRef, 220, setBedsPanelPos, () => setIsBedsOpen(true)))}
                  className="bg-white border border-slate-200 rounded-full px-5 py-2.5 font-medium text-[14px] text-slate-700 hover:border-slate-300 shadow-sm flex items-center gap-2 transition-all"
                >
                  {bedsInput ? `${bedsInput}+ Beds` : 'Any Beds'}
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isBedsOpen && bedsPanelPos && (
                  <div style={{ position: 'fixed', top: bedsPanelPos.top, left: bedsPanelPos.left }} className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 w-56">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {['1', '2', '3', '4', '5'].map((n) => (
                        <button key={n} onClick={() => { setBedsInput(n); setIsBedsOpen(false); }} className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold border transition-colors ${bedsInput === n ? 'bg-[#2ec440] text-white border-[#2ec440]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                          {n}+
                        </button>
                      ))}
                    </div>
                    <div className="w-full h-px bg-slate-100 mb-3" />
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Custom</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Type any number"
                      value={bedsInput}
                      onChange={(e) => setBedsInput(e.target.value.replace(/[^\d]/g, ''))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]"
                    />
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => setBedsInput('')} className="flex-1 py-2 font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-[14px] border border-slate-200">Reset</button>
                      <button onClick={() => setIsBedsOpen(false)} className="flex-1 py-2 font-semibold text-white bg-[#2ec440] hover:bg-[#28b039] rounded-lg transition-colors text-[14px]">Apply</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Baths — same dropdown + custom-number pattern as Beds */}
              <div className="relative">
                <button
                  ref={bathsButtonRef}
                  onClick={() => (isBathsOpen ? setIsBathsOpen(false) : openPanel(bathsButtonRef, 220, setBathsPanelPos, () => setIsBathsOpen(true)))}
                  className="bg-white border border-slate-200 rounded-full px-5 py-2.5 font-medium text-[14px] text-slate-700 hover:border-slate-300 shadow-sm flex items-center gap-2 transition-all"
                >
                  {bathsInput ? `${bathsInput}+ Baths` : 'Any Baths'}
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isBathsOpen && bathsPanelPos && (
                  <div style={{ position: 'fixed', top: bathsPanelPos.top, left: bathsPanelPos.left }} className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 w-56">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {['1', '2', '3', '4'].map((n) => (
                        <button key={n} onClick={() => { setBathsInput(n); setIsBathsOpen(false); }} className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold border transition-colors ${bathsInput === n ? 'bg-[#2ec440] text-white border-[#2ec440]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                          {n}+
                        </button>
                      ))}
                    </div>
                    <div className="w-full h-px bg-slate-100 mb-3" />
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Custom</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Type any number"
                      value={bathsInput}
                      onChange={(e) => setBathsInput(e.target.value.replace(/[^\d]/g, ''))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]"
                    />
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => setBathsInput('')} className="flex-1 py-2 font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-[14px] border border-slate-200">Reset</button>
                      <button onClick={() => setIsBathsOpen(false)} className="flex-1 py-2 font-semibold text-white bg-[#2ec440] hover:bg-[#28b039] rounded-lg transition-colors text-[14px]">Apply</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Type — typeable, suggestions via datalist. These resolve down to the
                  same 3 real categories the post-property form offers (house/apartment/
                  land) — see parsePropertyTypeInput above — so a listing created there
                  is always reachable by every synonym suggested here. */}
              <div className="relative">
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

              {/* Country — checklist panel supporting multiple selections at once
                  (see COUNTRY_OPTIONS), rather than a single free-text field that
                  silently matched nothing if you typed a city instead of a country. */}
              <div className="relative">
                <button
                  ref={countryButtonRef}
                  onClick={() => (isCountryOpen ? setIsCountryOpen(false) : openPanel(countryButtonRef, 288, setCountryPanelPos, () => setIsCountryOpen(true)))}
                  className="bg-white border border-slate-200 rounded-full px-5 py-2.5 font-medium text-[14px] text-slate-700 hover:border-slate-300 shadow-sm flex items-center gap-2 transition-all"
                >
                  {selectedCountryCodes.length === 0
                    ? 'Any Country'
                    : selectedCountryCodes.length === 1
                    ? COUNTRY_OPTIONS.find((c) => c.code === selectedCountryCodes[0])?.name ?? 'Country'
                    : `Countries (${selectedCountryCodes.length})`}
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isCountryOpen && countryPanelPos && (
                  <div style={{ position: 'fixed', top: countryPanelPos.top, left: countryPanelPos.left }} className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 w-72">
                    <h3 className="font-bold text-slate-900 mb-2 text-[15px]">Countries</h3>
                    <input
                      type="text"
                      placeholder="Search countries…"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full mb-2 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]"
                    />
                    <div className="grid grid-cols-1 gap-1 max-h-56 overflow-y-auto pr-1">
                      {COUNTRY_OPTIONS.filter((c) => c.name.toLowerCase().includes(countrySearch.trim().toLowerCase())).map((c) => {
                        const checked = selectedCountryCodes.includes(c.code);
                        return (
                          <label key={c.code} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700 font-medium">
                            <input type="checkbox" checked={checked} onChange={() => toggleCountry(c.code)} className="accent-[#2ec440] w-4 h-4 cursor-pointer" />
                            {c.name}
                          </label>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => setSelectedCountryCodes([])} className="flex-1 py-2 font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-[14px] border border-slate-200">Reset</button>
                      <button onClick={() => setIsCountryOpen(false)} className="flex-1 py-2 font-semibold text-white bg-[#2ec440] hover:bg-[#28b039] rounded-lg transition-colors text-[14px]">Apply</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Area Size — a pill button matching Status/Price/Beds/etc, opening a
                  small popover with custom min/max sqm inputs (same fixed-position
                  pattern as Price) rather than exposing two inline number inputs. */}
              <div className="relative">
                <button
                  ref={areaButtonRef}
                  onClick={() => (isAreaOpen ? setIsAreaOpen(false) : openPanel(areaButtonRef, 264, setAreaPanelPos, () => setIsAreaOpen(true)))}
                  className="bg-white border border-slate-200 rounded-full px-5 py-2.5 font-medium text-[14px] text-slate-700 hover:border-slate-300 shadow-sm flex items-center gap-2 transition-all"
                >
                  {minSqm || maxSqm ? `${minSqm || '0'} – ${maxSqm || 'Any'} sqm` : 'Area Size'}
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isAreaOpen && areaPanelPos && (
                  <div style={{ position: 'fixed', top: areaPanelPos.top, left: areaPanelPos.left }} className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 w-64">
                    <h3 className="font-bold text-slate-900 mb-3 text-[15px]">Area Size (sqm)</h3>
                    <div className="flex items-center gap-3">
                      <input type="number" placeholder="Min" value={minSqm} onChange={(e) => setMinSqm(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]" />
                      <span className="text-slate-400 font-medium">–</span>
                      <input type="number" placeholder="Max" value={maxSqm} onChange={(e) => setMaxSqm(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]" />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => { setMinSqm(''); setMaxSqm(''); }} className="flex-1 py-2 font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-[14px] border border-slate-200">Reset</button>
                      <button onClick={() => setIsAreaOpen(false)} className="flex-1 py-2 font-semibold text-white bg-[#2ec440] hover:bg-[#28b039] rounded-lg transition-colors text-[14px]">Apply</button>
                    </div>
                  </div>
                )}
              </div>

              {/* City / District */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="City / District"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="w-[160px] bg-white border border-slate-200 rounded-full pl-5 pr-8 py-2.5 font-medium text-[14px] text-slate-700 placeholder:text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 shadow-sm transition-all"
                />
                {cityInput && (
                  <button onClick={() => setCityInput('')} aria-label="Clear city" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              {/* Amenities — a checklist of common amenities (tick as many as you
                  want) plus a free-text field for anything not in the list; both
                  read/write the same comma-separated keywordsInput (see
                  toggleAmenity above), matched against any one, not all. */}
              <div className="relative">
                <button
                  ref={amenitiesButtonRef}
                  onClick={() => (isAmenitiesOpen ? setIsAmenitiesOpen(false) : openPanel(amenitiesButtonRef, 288, setAmenitiesPanelPos, () => setIsAmenitiesOpen(true)))}
                  className="bg-white border border-slate-200 rounded-full px-5 py-2.5 font-medium text-[14px] text-slate-700 hover:border-slate-300 shadow-sm flex items-center gap-2 transition-all"
                >
                  {selectedAmenities.length > 0 ? `Amenities (${selectedAmenities.length})` : 'Amenities'}
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isAmenitiesOpen && amenitiesPanelPos && (
                  <div style={{ position: 'fixed', top: amenitiesPanelPos.top, left: amenitiesPanelPos.left }} className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 w-72">
                    <h3 className="font-bold text-slate-900 mb-2 text-[15px]">Amenities</h3>
                    <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                      {AMENITY_OPTIONS.map((label) => {
                        const checked = selectedAmenities.some((k) => k.toLowerCase() === label.toLowerCase());
                        return (
                          <label key={label} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700 font-medium">
                            <input type="checkbox" checked={checked} onChange={() => toggleAmenity(label)} className="accent-[#2ec440] w-4 h-4 cursor-pointer" />
                            {label}
                          </label>
                        );
                      })}
                    </div>
                    <div className="w-full h-px bg-slate-100 my-3" />
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Or type your own</label>
                    <input
                      type="text"
                      placeholder="e.g. rooftop, sea view"
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Comma-separated — matches any one.</p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => setKeywordsInput('')} className="flex-1 py-2 font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-[14px] border border-slate-200">Reset</button>
                      <button onClick={() => setIsAmenitiesOpen(false)} className="flex-1 py-2 font-semibold text-white bg-[#2ec440] hover:bg-[#28b039] rounded-lg transition-colors text-[14px]">Apply</button>
                    </div>
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* ── Title row ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-1">
              {heading}
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
