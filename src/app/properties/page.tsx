"use client";

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';
import AISearchCard from '@/components/AISearchCard';
import { useAllProperties } from '@/lib/sellerListings/hooks';
import type { AIPropertyFilters } from '@/app/api/ai-property-search/route';
import { COUNTRY_OPTIONS, getPropertyCountry } from '@/lib/countries';
import { useCurrentCountry } from '@/lib/geo/useCurrentCountry';
import { AMENITY_OPTIONS, PROPERTY_TYPE_OPTIONS as TYPE_OPTIONS } from '@/lib/properties/types';
import { isPromotedNow } from '@/lib/promotion/types';
import { useSavedSearches } from '@/lib/savedSearches/hooks';
import { SavedSearchesStoreEngine } from '@/lib/savedSearches/store';
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

// Status is a free-text input (with a SuggestInput list of suggestions) rather
// than a closed <select> dropdown, so typing something close ("renting",
// "flat") still resolves — see STATUS_OPTIONS for what's suggested. An unrecognized value just means "no filter"
// rather than zeroing out the results.
function parseStatusInput(text: string): 'all' | 'sale' | 'rent' {
  const t = text.trim().toLowerCase();
  if (!t) return 'all';
  if (/rent/.test(t)) return 'rent';
  if (/sale|buy|sell/.test(t)) return 'sale';
  return 'all';
}

function parseMinNumberInput(text: string): number | undefined {
  const t = text.trim();
  if (!t) return undefined;
  const n = parseInt(t, 10);
  return Number.isNaN(n) ? undefined : n;
}

// Free-text pill input with a white suggestion list. Replaces a native
// <datalist>, whose popup is browser-rendered (dark on some platforms) and
// can't be styled to match the other filter panels.
function SuggestInput({ value, onChange, options, placeholder, widthClass, clearLabel, showChevron }: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  widthClass: string;
  clearLabel: string;
  showChevron?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const q = value.trim().toLowerCase();
  const exact = options.some((o) => o.toLowerCase() === q);
  const matches = !q || exact ? options : options.filter((o) => o.toLowerCase().includes(q));
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
        className={`${widthClass} bg-white border border-slate-200 rounded-full pl-5 pr-8 py-2.5 font-medium text-[14px] text-slate-700 placeholder:text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 shadow-sm transition-all`}
      />
      {value ? (
        <button onClick={() => onChange('')} aria-label={clearLabel} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      ) : showChevron ? (
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      ) : null}
      {open && matches.length > 0 && (
        <div className="absolute left-0 top-full mt-2 min-w-full w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 max-h-64 overflow-y-auto">
          {matches.map((o) => (
            <button
              key={o}
              // mousedown (not click) so the input's blur doesn't close the list first
              onMouseDown={(e) => { e.preventDefault(); onChange(o); setOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg font-medium text-[14px] transition-colors ${o.toLowerCase() === q ? 'bg-slate-50 text-[#2ec440]' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_OPTIONS = ['For Sale', 'For Rent'];

// ─── main page ────────────────────────────────────────────────────────────────

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') ?? '');
  const [statusInput, setStatusInput] = useState(searchParams.get('type') === 'rent' ? 'For Rent' : searchParams.get('type') === 'sale' ? 'For Sale' : '');
  // Checklist of labels (see TYPE_OPTIONS), not a typeable field — so a buyer
  // can match "Villa" and "Land" at once, and multiple synonyms of the same
  // underlying bucket (e.g. "House" and "Townhouse") stay separately tickable.
  const [selectedTypeLabels, setSelectedTypeLabels] = useState<string[]>([]);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const typeButtonRef = useRef<HTMLButtonElement>(null);
  const [typePanelPos, setTypePanelPos] = useState<{ top: number; left: number } | null>(null);
  function toggleTypeLabel(label: string) {
    setSelectedTypeLabels((prev) => prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label]);
  }
  const selectedTypeBuckets = new Set(
    selectedTypeLabels.map((label) => TYPE_OPTIONS.find((o) => o.label === label)?.bucket).filter((b): b is 'house' | 'apartment' | 'land' => Boolean(b))
  );
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
  const savedSearches = useSavedSearches();
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const { showToast } = useToast();
  // Buyers already see the "Top Pick" badge on a promoted card (see PropertyCard.tsx) — this
  // just lets them narrow the grid to only those, without ever calling them "promoted"
  // anywhere in the UI.
  const [topPicksOnly, setTopPicksOnly] = useState(false);

  // Reset URL-backed fields during navigation, before rendering stale results.
  const query = searchParams.toString();
  const [previousQuery, setPreviousQuery] = useState(query);
  if (query !== previousQuery) {
    setPreviousQuery(query);
    const urlType = searchParams.get('type');
    setStatusInput(urlType === 'rent' ? 'For Rent' : urlType === 'sale' ? 'For Sale' : '');
    setSearchTerm(searchParams.get('q') ?? '');
  }

  // Defaults the Country filter to the visitor's own country (previously
  // picked, or geo-detected — see useCurrentCountry) instead of leaving it
  // on "Any Country". Only fires while nothing's selected yet, so it won't
  // stomp on a country the visitor has since picked or cleared themselves.
  const currentCountry = useCurrentCountry();
  useEffect(() => {
    if (!currentCountry) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedCountryCodes((prev) => (prev.length === 0 ? [currentCountry.code] : prev));
  }, [currentCountry]);

  function closeAllPanels() {
    setIsPriceOpen(false); setIsAreaOpen(false); setIsBedsOpen(false); setIsBathsOpen(false);
    setIsAmenitiesOpen(false); setIsCountryOpen(false); setIsTypeOpen(false);
  }

  // A fixed-position panel doesn't track its trigger on scroll, so close it
  // the moment any scrolling happens rather than letting it drift away from
  // the button. Scrolls that happen *inside* a panel (e.g. the country list)
  // are ignored so the panel's own content stays scrollable.
  useEffect(() => {
    if (!isPriceOpen && !isAreaOpen && !isBedsOpen && !isBathsOpen && !isAmenitiesOpen && !isCountryOpen && !isTypeOpen) return;
    const close = (e: Event) => {
      if (e.target instanceof Element && e.target.closest('[data-filter-panel]')) return;
      closeAllPanels();
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [isPriceOpen, isAreaOpen, isBedsOpen, isBathsOpen, isAmenitiesOpen, isCountryOpen, isTypeOpen]);

  // Any click that lands outside every open panel and outside the pill that
  // triggers it closes all of them — panels no longer have their own Apply
  // button to dismiss themselves with, since every choice inside now takes
  // effect immediately.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest('[data-filter-panel]') || target.closest('[data-filter-trigger]')) return;
      closeAllPanels();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function openPanel(buttonRef: React.RefObject<HTMLButtonElement | null>, panelWidth: number, setPos: (pos: { top: number; left: number }) => void, open: () => void) {
    closeAllPanels();
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
    const matchesPropType = selectedTypeBuckets.size === 0 || selectedTypeBuckets.has(p.propertyType);
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
    const matchesTopPicks = !topPicksOnly || isPromotedNow(p);
    return matchesSearch && matchesType && matchesPropType && matchesPrice && matchesBeds && matchesBaths && matchesSqm && matchesCity && matchesKeywords && matchesCountry && matchesAi && matchesTopPicks;
  }).sort((a, b) => {
    // Listings a seller paid to promote (see lib/promotion) always lead the
    // first row, the same "boosted ads always come first" convention
    // marketplaces like Property24/Jiji/Lamudi use — the chosen sort order
    // below only decides ranking within each of the two groups.
    const aPromoted = isPromotedNow(a);
    const bPromoted = isPromotedNow(b);
    if (aPromoted !== bPromoted) return aPromoted ? -1 : 1;
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
    setSearchTerm(''); setStatusInput(''); setSelectedTypeLabels([]);
    setCustomMinPrice(''); setCustomMaxPrice(''); setBedsInput(''); setBathsInput('');
    setMinSqm(''); setMaxSqm(''); setCityInput(''); setKeywordsInput(''); setSelectedCountryCodes([]); setAiFilters(null);
    setTopPicksOnly(false);
  }

  function saveCurrentSearch() {
    const criteria: SavedSearchCriteria = {
      searchTerm,
      filterType,
      propertyTypeFilter: selectedTypeLabels.length ? selectedTypeLabels.join(', ') : 'all',
      minPrice: customMinPrice,
      maxPrice: customMaxPrice,
      bedsFilter: bedsInput,
      bathsFilter: bathsInput,
      minSqm,
      maxSqm,
      city: cityInput,
      keywords: keywordsInput,
    };
    const outcome = SavedSearchesStoreEngine.save(criteria);
    if (outcome === 'saved') showToast('Search saved.');
    else if (outcome === 'duplicate') showToast("You've already saved this search.");
    else showToast('Add a filter first to save a search.', 'error');
  }

  // Restores every filter a saved search captured — everything saveCurrentSearch wrote above,
  // in reverse. Country/Top Picks/sort aren't part of SavedSearchCriteria (it predates them),
  // so a saved search doesn't touch those three; they stay whatever the visitor already has set.
  function applySavedSearch(criteria: SavedSearchCriteria) {
    setSearchTerm(criteria.searchTerm);
    setStatusInput(criteria.filterType === 'rent' ? 'For Rent' : criteria.filterType === 'sale' ? 'For Sale' : '');
    setSelectedTypeLabels(criteria.propertyTypeFilter === 'all' || !criteria.propertyTypeFilter ? [] : criteria.propertyTypeFilter.split(', ').filter(Boolean));
    setCustomMinPrice(criteria.minPrice);
    setCustomMaxPrice(criteria.maxPrice);
    setBedsInput(criteria.bedsFilter);
    setBathsInput(criteria.bathsFilter);
    setMinSqm(criteria.minSqm);
    setMaxSqm(criteria.maxSqm);
    setCityInput(criteria.city);
    setKeywordsInput(criteria.keywords);
    setIsSavedOpen(false);
  }

  return (
    <div className="w-full bg-[#f8fafc] pt-4 pb-0 flex flex-col min-h-screen">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 md:px-8 flex-shrink-0">

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className="pb-6 pt-2 border-b border-slate-100 mb-3">
          {/* Search box and every filter share one flex-wrap flow (not nested
              in a separate row) so wrapping fills each line to the container's
              actual full width instead of leaving a trailing gap and wrapping
              early. */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-[280px]">
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="City, district or country" className="w-full pl-11 pr-4 py-2.5 bg-white/60 border border-transparent rounded-full focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all text-slate-900 placeholder:text-slate-500 font-medium text-[15px] shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

              {/* Status — typeable, with suggestions so "renting"/"buy" etc still resolve */}
              <SuggestInput value={statusInput} onChange={setStatusInput} options={STATUS_OPTIONS} placeholder="Any Status" widthClass="w-[150px]" clearLabel="Clear status" showChevron />

              {/* Price */}
              <div className="relative">
                <button
                  ref={priceButtonRef}
                  data-filter-trigger
                  onClick={() => (isPriceOpen ? setIsPriceOpen(false) : openPanel(priceButtonRef, 288, setPricePanelPos, () => setIsPriceOpen(true)))}
                  className="bg-white border border-slate-200 rounded-full px-5 py-2.5 font-medium text-[14px] text-slate-700 hover:border-slate-300 shadow-sm flex items-center gap-2 transition-all"
                >
                  {customMinPrice || customMaxPrice ? `Price: $${customMinPrice || '0'} – $${customMaxPrice || 'Any'}` : 'Any Price'}
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isPriceOpen && pricePanelPos && (
                  <div data-filter-panel style={{ position: 'fixed', top: pricePanelPos.top, left: pricePanelPos.left }} className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 w-72">
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
                  </div>
                )}
              </div>

              {/* Beds — dropdown with quick presets plus a custom number input the
                  user can type any value into, same pattern as Price/Area Size. */}
              <div className="relative">
                <button
                  ref={bedsButtonRef}
                  data-filter-trigger
                  onClick={() => (isBedsOpen ? setIsBedsOpen(false) : openPanel(bedsButtonRef, 220, setBedsPanelPos, () => setIsBedsOpen(true)))}
                  className="bg-white border border-slate-200 rounded-full px-5 py-2.5 font-medium text-[14px] text-slate-700 hover:border-slate-300 shadow-sm flex items-center gap-2 transition-all"
                >
                  {bedsInput ? `${bedsInput}+ Beds` : 'Any Beds'}
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isBedsOpen && bedsPanelPos && (
                  <div data-filter-panel style={{ position: 'fixed', top: bedsPanelPos.top, left: bedsPanelPos.left }} className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 w-56">
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
                  </div>
                )}
              </div>

              {/* Baths — same dropdown + custom-number pattern as Beds */}
              <div className="relative">
                <button
                  ref={bathsButtonRef}
                  data-filter-trigger
                  onClick={() => (isBathsOpen ? setIsBathsOpen(false) : openPanel(bathsButtonRef, 220, setBathsPanelPos, () => setIsBathsOpen(true)))}
                  className="bg-white border border-slate-200 rounded-full px-5 py-2.5 font-medium text-[14px] text-slate-700 hover:border-slate-300 shadow-sm flex items-center gap-2 transition-all"
                >
                  {bathsInput ? `${bathsInput}+ Baths` : 'Any Baths'}
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isBathsOpen && bathsPanelPos && (
                  <div data-filter-panel style={{ position: 'fixed', top: bathsPanelPos.top, left: bathsPanelPos.left }} className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 w-56">
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
                  </div>
                )}
              </div>

              {/* Type — exhaustive checklist of every type a buyer would actually look
                  for (see TYPE_OPTIONS), not collapsed to the 3 underlying buckets —
                  same two-column pattern as Amenities since there are as many options. */}
              <div className="relative">
                <button
                  ref={typeButtonRef}
                  data-filter-trigger
                  onClick={() => (isTypeOpen ? setIsTypeOpen(false) : openPanel(typeButtonRef, 288, setTypePanelPos, () => setIsTypeOpen(true)))}
                  className="bg-white border border-slate-200 rounded-full px-5 py-2.5 font-medium text-[14px] text-slate-700 hover:border-slate-300 shadow-sm flex items-center gap-2 transition-all"
                >
                  {selectedTypeLabels.length === 0
                    ? 'Any Type'
                    : selectedTypeLabels.length === 1
                    ? selectedTypeLabels[0]
                    : `Types (${selectedTypeLabels.length})`}
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isTypeOpen && typePanelPos && (
                  <div data-filter-panel style={{ position: 'fixed', top: typePanelPos.top, left: typePanelPos.left }} className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 w-72">
                    <h3 className="font-bold text-slate-900 mb-2 text-[15px]">Property Type</h3>
                    <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                      {TYPE_OPTIONS.map(({ label }) => {
                        const checked = selectedTypeLabels.includes(label);
                        return (
                          <label key={label} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700 font-medium">
                            <input type="checkbox" checked={checked} onChange={() => toggleTypeLabel(label)} className="accent-[#2ec440] w-4 h-4 cursor-pointer" />
                            {label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Country — checklist panel supporting multiple selections at once
                  (see COUNTRY_OPTIONS), rather than a single free-text field that
                  silently matched nothing if you typed a city instead of a country. */}
              <div className="relative">
                <button
                  ref={countryButtonRef}
                  data-filter-trigger
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
                  <div data-filter-panel style={{ position: 'fixed', top: countryPanelPos.top, left: countryPanelPos.left }} className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 w-72">
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
                  </div>
                )}
              </div>

              {/* Top Picks — a plain toggle, not a popover (nothing to choose beyond
                  on/off). Filters to whatever's currently showing the "Top Pick" badge
                  (see PropertyCard.tsx) without ever naming promotion anywhere. Its own
                  standalone pill, the next one after Country — not folded into a
                  property-attribute filter like Type or Amenities. */}
              <button
                type="button"
                onClick={() => setTopPicksOnly((v) => !v)}
                aria-pressed={topPicksOnly}
                className={`rounded-full px-5 py-2.5 font-medium text-[14px] shadow-sm flex items-center gap-2 transition-all border ${
                  topPicksOnly ? 'bg-[#2ec440] border-[#2ec440] text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <svg className="w-4 h-4" fill={topPicksOnly ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.539 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.196-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                Top Picks
              </button>

              {/* Area Size — a pill button matching Status/Price/Beds/etc, opening a
                  small popover with custom min/max sqm inputs (same fixed-position
                  pattern as Price) rather than exposing two inline number inputs. */}
              <div className="relative">
                <button
                  ref={areaButtonRef}
                  data-filter-trigger
                  onClick={() => (isAreaOpen ? setIsAreaOpen(false) : openPanel(areaButtonRef, 264, setAreaPanelPos, () => setIsAreaOpen(true)))}
                  className="bg-white border border-slate-200 rounded-full px-5 py-2.5 font-medium text-[14px] text-slate-700 hover:border-slate-300 shadow-sm flex items-center gap-2 transition-all"
                >
                  {minSqm || maxSqm ? `${minSqm || '0'} – ${maxSqm || 'Any'} sqm` : 'Area Size'}
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isAreaOpen && areaPanelPos && (
                  <div data-filter-panel style={{ position: 'fixed', top: areaPanelPos.top, left: areaPanelPos.left }} className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 w-64">
                    <h3 className="font-bold text-slate-900 mb-3 text-[15px]">Area Size (sqm)</h3>
                    <div className="flex items-center gap-3">
                      <input type="number" placeholder="Min" value={minSqm} onChange={(e) => setMinSqm(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]" />
                      <span className="text-slate-400 font-medium">–</span>
                      <input type="number" placeholder="Max" value={maxSqm} onChange={(e) => setMaxSqm(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]" />
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
                  data-filter-trigger
                  onClick={() => (isAmenitiesOpen ? setIsAmenitiesOpen(false) : openPanel(amenitiesButtonRef, 288, setAmenitiesPanelPos, () => setIsAmenitiesOpen(true)))}
                  className="bg-white border border-slate-200 rounded-full px-5 py-2.5 font-medium text-[14px] text-slate-700 hover:border-slate-300 shadow-sm flex items-center gap-2 transition-all"
                >
                  {selectedAmenities.length > 0 ? `Amenities (${selectedAmenities.length})` : 'Amenities'}
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isAmenitiesOpen && amenitiesPanelPos && (
                  <div data-filter-panel style={{ position: 'fixed', top: amenitiesPanelPos.top, left: amenitiesPanelPos.left }} className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 w-72">
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
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* ── Title row ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-baseline gap-1 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {heading}
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              {filteredProperties.length} {filteredProperties.length === 1 ? 'result' : 'results'}
              {aiFilters && <span className="ml-2 inline-flex items-center gap-1 text-[#2ec440] font-semibold"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" /></svg>AI filtered · <button onClick={clearAll} className="underline underline-offset-2 hover:text-[#28b039]">clear</button></span>}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {/* Saved searches — only appears once there's at least one, so it never crowds a
             *  first-time visitor's view. Subtle on purpose, same treatment as Save search
             *  below: plain text/icon, no border or shadow, until hovered. */}
            {savedSearches.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setIsSavedOpen((v) => !v); setIsSortOpen(false); }}
                  className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors select-none"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v12l7-4 7 4V5a2 2 0 00-2-2H5z" /></svg>
                  Saved ({savedSearches.length})
                </button>
                {isSavedOpen && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 w-72 max-h-80 overflow-y-auto">
                    {savedSearches.map((s) => (
                      <div key={s.id} className="flex items-center gap-1 px-2 hover:bg-slate-50">
                        <button onClick={() => applySavedSearch(s.criteria)} className="flex-1 text-left px-2 py-2.5 text-[14px] font-medium text-slate-700 truncate">
                          {s.label}
                        </button>
                        <button
                          onClick={() => SavedSearchesStoreEngine.remove(s.id)}
                          aria-label={`Remove saved search: ${s.label}`}
                          className="shrink-0 p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Save search — deliberately subtle (plain text/icon, no border or background
             *  until hovered) so it doesn't compete with the filter pills above or the Sort
             *  control next to it; this is a quiet secondary action, not a primary one. */}
            <button
              type="button"
              onClick={saveCurrentSearch}
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors select-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3a2 2 0 00-2 2v12l7-4 7 4V5a2 2 0 00-2-2H5z" /></svg>
              Save search
            </button>

            <div className="relative">
              <div onClick={() => { setIsSortOpen(!isSortOpen); setIsSavedOpen(false); }} className="hidden sm:flex items-center gap-1 text-sm font-bold text-slate-900 cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 select-none">
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
