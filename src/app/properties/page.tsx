"use client";

import React, { Suspense, useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';
import { useVisibleListings } from '@/lib/admin/listings';
import { useAllProperties } from '@/lib/sellerListings/hooks';
import type { AIPropertyFilters } from '@/app/api/ai-property-search/route';
import type { Property } from '@/lib/properties/types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function countMatches(properties: Property[], filters: AIPropertyFilters): number {
  return properties.filter((p) => {
    if (filters.type && filters.type !== 'all' && p.type !== filters.type) return false;
    if (filters.propertyType && filters.propertyType !== 'all' && p.propertyType !== filters.propertyType) return false;
    if (filters.minBedrooms !== undefined && p.bedrooms < filters.minBedrooms) return false;
    if (filters.maxBedrooms !== undefined && p.bedrooms > filters.maxBedrooms) return false;
    if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
    if (filters.minSqm !== undefined && p.sqm < filters.minSqm) return false;
    if (filters.maxSqm !== undefined && p.sqm > filters.maxSqm) return false;
    if (filters.city) {
      const c = filters.city.toLowerCase();
      if (!p.city.toLowerCase().includes(c) && !p.location.toLowerCase().includes(c)) return false;
    }
    if (filters.keywords?.length) {
      const hay = `${p.title} ${p.description}`.toLowerCase();
      if (!filters.keywords.some((kw) => hay.includes(kw))) return false;
    }
    return true;
  }).length;
}

function titleCase(text: string) {
  return text.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

function renderMd(text: string) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return <span key={i}>{part}</span>;
  });
}

// ─── types ───────────────────────────────────────────────────────────────────

interface ChatMsg { role: 'assistant' | 'user'; content: string; filters?: AIPropertyFilters; matchCount?: number; }

const GREETING: ChatMsg = {
  role: 'assistant',
  content: "Tell me about your dream home and I'll search our listings for you.\n\nIf we don't have it yet, we'll help you design and build it. 🏡",
};

const QUICK_PROMPTS = [
  '3-bed house for rent in Kigali',
  'Apartment under $200k',
  'Land plot in Musanze',
  'Villa with pool & garden',
];

// ─── Dream Home Side Panel (slide-in drawer) ──────────────────────────────────

function DreamHomePanel({
  onClose,
  onFiltersChange,
  visibleProperties,
  matchCount,
  hasActiveFilter,
  onClearFilter,
}: {
  onClose: () => void;
  onFiltersChange: (f: AIPropertyFilters) => void;
  visibleProperties: Property[];
  matchCount: number;
  hasActiveFilter: boolean;
  onClearFilter: () => void;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Trigger slide-in on mount, focus after animation
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const lastFilteredIndex = messages.findLastIndex((m) => m.role === 'assistant' && m.filters);
  const displayedMessages = messages.map((message, index) =>
    hasActiveFilter && index === lastFilteredIndex ? { ...message, matchCount } : message);

  function close() {
    setVisible(false);
    setTimeout(onClose, 300); // wait for slide-out animation
  }

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setMessages((p) => [...p, { role: 'user', content: trimmed }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai-property-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!res.ok) throw new Error();
      const filters: AIPropertyFilters = await res.json();
      onFiltersChange(filters);
      const count = countMatches(visibleProperties, filters);
      const reply = filters.summary + '\n\n' + (
        count > 0
          ? `I found **${count} ${count === 1 ? 'property' : 'properties'}** that match. Browse the results!`
          : "No current listings match — but we can design and build it for you."
      );
      setMessages((p) => [...p, { role: 'assistant', content: reply, filters, matchCount: count }]);
    } catch {
      setMessages((p) => [...p, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <>
      {/* Dimmed backdrop — click to close */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={close}
      />

      {/* Slide-in panel from the right */}
      <div className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zM5 15l.9 2.7L8.6 19l-2.7.9L5 22.6l-.9-2.7L1.4 19l2.7-.9L5 15zM19 15l.9 2.7 2.7.9-2.7.9L19 22.6l-.9-2.7-2.7-.9 2.7-.9L19 15z" />
              </svg>
            </span>
            <div>
              <h2 className="font-black text-slate-900 text-[18px] leading-tight">Describe Your<br/>Dream Home</h2>
              <p className="text-[12px] text-[#2ec440] font-semibold mt-0.5">Powered by HuzaEstate AI</p>
            </div>
          </div>
          <button onClick={close} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 shrink-0 -mt-1 -mr-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Quick prompts — shown before first search */}
        {messages.length === 1 && (
          <div className="px-6 pt-4 pb-2 flex flex-wrap gap-2 shrink-0">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => { setInput(p); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="text-[12px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 hover:border-slate-900 hover:text-slate-900 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Chat thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col min-h-0">
          {displayedMessages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} className={`flex w-full mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${isUser ? 'bg-slate-900 text-white rounded-tr-sm' : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm'}`}>
                  {msg.content.split('\n').map((line, li) => (
                    <p key={li} className={li > 0 ? 'mt-1' : ''}>{renderMd(line)}</p>
                  ))}
                  {!isUser && msg.filters && msg.matchCount !== undefined && (
                    <div className="mt-3">
                      {msg.matchCount > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 bg-[#2ec440]/10 text-[#1a9e2e] font-bold text-[12px] px-3 py-1.5 rounded-full">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            {msg.matchCount} {msg.matchCount === 1 ? 'match' : 'matches'} found
                          </span>
                          <button onClick={() => { onClearFilter(); close(); }} className="text-[12px] font-semibold text-[#2ec440] hover:text-[#28b039] transition-colors">
                            View results →
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-xl overflow-hidden border border-amber-100 mt-1">
                          <div className="bg-amber-50 px-3 py-2.5">
                            <p className="text-amber-800 font-semibold text-[13px]">No listings match yet.</p>
                            <p className="text-amber-700 text-[12px] mt-0.5">But we can design and build it for you.</p>
                          </div>
                          <Link href="/build" onClick={close} className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-[#2ec440] text-white font-bold text-[13px] px-4 py-3 transition-colors w-full">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            Design &amp; Build My Dream Home
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start mb-3">
              <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 rounded-2xl rounded-tl-sm border border-slate-100">
                {[0,1,2].map((i) => <span key={i} className="w-2 h-2 rounded-full bg-[#2ec440] animate-bounce" style={{ animationDelay: `${i*0.15}s`, animationDuration: '0.8s' }} />)}
              </div>
            </div>
          )}
        </div>

        {/* Design & Build promo — before any search */}
        {messages.length <= 2 && !hasActiveFilter && (
          <div className="mx-6 mb-4 shrink-0 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 p-4 text-white">
            <p className="font-bold text-[13px] mb-1">Can&apos;t find what you want?</p>
            <p className="text-[12px] text-slate-300 mb-3 leading-snug">We design and build custom homes tailored exactly to your vision.</p>
            <Link href="/build" onClick={close} className="inline-flex items-center gap-1.5 bg-[#2ec440] hover:bg-[#28b039] text-white font-bold text-[12.5px] px-4 py-2 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              Design &amp; Build My Home
            </Link>
          </div>
        )}

        {/* Input bar */}
        <div className="border-t border-slate-100 px-6 py-4 shrink-0">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-slate-900 focus-within:bg-white transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="e.g. 3-bed house with a garden in Kigali…"
              rows={2}
              className="flex-1 bg-transparent text-[14px] text-slate-800 placeholder:text-slate-400 outline-none resize-none min-w-0 leading-snug"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="shrink-0 w-9 h-9 rounded-full bg-slate-900 hover:bg-[#2ec440] disabled:bg-slate-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors mb-0.5"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-1.5">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </>
  );
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

  const [isDreamOpen, setIsDreamOpen] = useState(false);
  const [aiFilters, setAiFilters] = useState<AIPropertyFilters | null>(null);

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
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase());
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
        const c = aiFilters.city.toLowerCase();
        matchesAi = matchesAi && (p.city.toLowerCase().includes(c) || p.location.toLowerCase().includes(c));
      }
      if (aiFilters.keywords?.length) {
        const hay = `${p.title} ${p.description}`.toLowerCase();
        matchesAi = matchesAi && aiFilters.keywords.some((kw) => hay.includes(kw));
      }
    }
    return matchesSearch && matchesType && matchesPropType && matchesPrice && matchesBeds && matchesSqm && matchesAi;
  });

  function clearAll() {
    setSearchTerm(''); setFilterType('all'); setPropertyTypeFilter('all');
    setCustomMinPrice(''); setCustomMaxPrice(''); setBedsFilter('all');
    setMinSqm(''); setMaxSqm(''); setAiFilters(null);
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
            <button className="text-[#2ec440] font-bold text-[14px] hover:bg-[#2ec440]/10 px-4 py-2 rounded-full transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              Save Search
            </button>
          </div>
        </div>

        {/* ── Title row ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight mb-1">
              {searchTerm.trim() ? titleCase(searchTerm.trim()) : 'Kigali, Rwanda'}
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              {filteredProperties.length} {filteredProperties.length === 1 ? 'result' : 'results'}
              {aiFilters && <span className="ml-2 inline-flex items-center gap-1 text-[#2ec440] font-semibold"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" /></svg>AI filtered · <button onClick={clearAll} className="underline underline-offset-2 hover:text-[#28b039]">clear</button></span>}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-sm font-bold text-slate-900 cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-200">
            Sort: <span className="text-slate-500">Homes for You</span>
            <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {/* ── Property grid ─────────────────────────────────────────────────── */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 md:px-8 flex-1 pb-12">
        {filteredProperties.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border border-slate-200 mt-4 max-w-2xl mx-auto shadow-sm">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No exact matches</h3>
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

      {/* ── Floating "Describe Your Dream Home" button (bottom-right) ─────── */}
      <button
        onClick={() => setIsDreamOpen(true)}
        className={`fixed bottom-8 right-6 z-40 flex items-center gap-2 font-bold text-[14px] px-5 py-3 rounded-full shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
          aiFilters
            ? 'bg-[#2ec440] hover:bg-[#28b039] text-white'
            : 'bg-slate-900 hover:bg-[#2ec440] text-white'
        }`}
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zM5 15l.9 2.7L8.6 19l-2.7.9L5 22.6l-.9-2.7L1.4 19l2.7-.9L5 15zM19 15l.9 2.7 2.7.9-2.7.9L19 22.6l-.9-2.7-2.7-.9 2.7-.9L19 15z" />
        </svg>
        {aiFilters ? 'AI Active — Edit' : 'Describe Your Dream Home'}
        {aiFilters && (
          <span className="w-2.5 h-2.5 rounded-full bg-white border-2 border-[#2ec440] absolute -top-0.5 -right-0.5" />
        )}
      </button>

      {/* ── Dream Home Modal ───────────────────────────────────────────────── */}
      {isDreamOpen && (
        <DreamHomePanel
          onClose={() => setIsDreamOpen(false)}
          onFiltersChange={(f) => setAiFilters(f)}
          visibleProperties={visibleProperties}
          matchCount={filteredProperties.length}
          hasActiveFilter={!!aiFilters}
          onClearFilter={clearAll}
        />
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
