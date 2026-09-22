"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { AIPropertyFilters } from '@/app/api/ai-property-search/route';
import type { Property } from '@/lib/properties/types';

interface ChatMsg { role: 'assistant' | 'user'; content: string; filters?: AIPropertyFilters; matchCount?: number; }

const GREETING: ChatMsg = {
  role: 'assistant',
  content: "Describe your dream home. I'll find it.",
};

const QUICK_PROMPTS = [
  '3-bed house for sale',
  'Apartment for rent',
  'House under $150k',
  'Land plot in Musanze',
  'Villa with pool & garden',
];

function renderMd(text: string) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return <span key={i}>{part}</span>;
  });
}

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
      const cityTokens = filters.city.toLowerCase().split(/[\s,]+/).filter(Boolean);
      const propText = `${p.location} ${p.city} rwanda`.toLowerCase();
      if (!cityTokens.every((token) => propText.includes(token))) return false;
    }
    if (filters.keywords?.length) {
      const hay = `${p.title} ${p.description}`.toLowerCase();
      if (!filters.keywords.some((kw) => hay.includes(kw))) return false;
    }
    return true;
  }).length;
}

/** Content of the "Describe Your Desired Property" slide-in panel (see
 *  src/app/properties/page.tsx, which mounts this behind a floating button
 *  rather than embedding it in the grid). Same /api/ai-property-search flow
 *  throughout: quick prompts and the send button both run a search
 *  immediately, and a zero-match result offers the Design & Build path
 *  instead of leaving the user stuck. */
export default function AISearchCard({
  visibleProperties,
  onFiltersChange,
  hasActiveFilter,
  matchCount,
  onClearFilter,
  onClose,
}: {
  visibleProperties: Property[];
  onFiltersChange: (f: AIPropertyFilters) => void;
  hasActiveFilter: boolean;
  matchCount: number;
  onClearFilter: () => void;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const lastFilteredIndex = messages.findLastIndex((m) => m.role === 'assistant' && m.filters);
  const displayedMessages = messages.map((message, index) =>
    hasActiveFilter && index === lastFilteredIndex ? { ...message, matchCount } : message);

  async function send(text?: string) {
    const trimmed = (text ?? input).trim();
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
          ? `**${count} ${count === 1 ? 'match' : 'matches'}.** Take a look.`
          : "Nothing like that in our listings yet."
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
    <div className="bg-white flex flex-col h-full text-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 sm:px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
        <span className="w-9 h-9 rounded-xl bg-[#2ec440]/10 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-[#2ec440]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zM5 15l.9 2.7L8.6 19l-2.7.9L5 22.6l-.9-2.7L1.4 19l2.7-.9L5 15zM19 15l.9 2.7 2.7.9-2.7.9L19 22.6l-.9-2.7-2.7-.9 2.7-.9L19 15z" />
          </svg>
        </span>
        <h2 className="font-bold text-slate-900 text-[17px] leading-tight flex-1 min-w-0">Say it. We&apos;ll find it.</h2>
        {hasActiveFilter && (
          <button onClick={onClearFilter} className="text-[12px] font-semibold text-[#2ec440] hover:text-[#28b039] transition-colors shrink-0">
            Clear
          </button>
        )}
        <button onClick={onClose} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Quick prompts — shown before first search */}
      {messages.length === 1 && (
        <div className="px-5 sm:px-6 pt-4 pb-1 flex flex-wrap gap-2 shrink-0">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              disabled={loading}
              className="text-[12px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 hover:border-[#2ec440] hover:text-[#2ec440] transition-colors disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Chat thread */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4 flex flex-col">
        {displayedMessages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div key={i} className={`flex w-full mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${isUser ? 'bg-[#2ec440] text-white rounded-tr-sm' : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm'}`}>
                {msg.content.split('\n').map((line, li) => (
                  <p key={li} className={li > 0 ? 'mt-1' : ''}>{renderMd(line)}</p>
                ))}
                {!isUser && msg.filters && msg.matchCount !== undefined && (
                  <div className="mt-3">
                    {msg.matchCount > 0 ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 bg-[#2ec440]/10 text-[#1a9e2e] font-bold text-[12px] px-3 py-1.5 rounded-full">
                          {msg.matchCount} {msg.matchCount === 1 ? 'match' : 'matches'} found
                        </span>
                        <button onClick={onClose} className="text-[12px] font-semibold text-[#2ec440] hover:text-[#28b039] transition-colors">
                          View results →
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-[#2ec440]/30 bg-[#2ec440]/5 p-3">
                        <p className="font-bold text-[13px] text-slate-900">Can&apos;t find it? We&apos;ll design and build it.</p>
                        <p className="text-[12px] text-slate-500 mt-0.5 mb-2.5">Custom homes, made to your brief.</p>
                        <Link href="/build" onClick={onClose} className="flex items-center justify-center gap-1.5 bg-slate-900 text-white font-bold text-[13px] px-4 py-2.5 rounded-lg hover:bg-[#2ec440] transition-colors">
                          Design &amp; Build My Home →
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
            <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-[#2ec440] animate-bounce" style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-slate-100 px-5 sm:px-6 py-4 shrink-0">
        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-[#2ec440] focus-within:bg-white transition-all">
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
            type="button"
            onClick={() => send()}
            disabled={!input.trim() || loading}
            aria-label="Search with AI"
            className="shrink-0 w-9 h-9 rounded-full bg-[#2ec440] hover:bg-[#28b039] disabled:bg-slate-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors mb-0.5"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
        <p className="text-center text-[11px] text-slate-400 mt-1.5">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
