"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { AIPropertyFilters } from "@/app/api/ai-property-search/route";
import type { Property } from "@/lib/properties/types";

interface Message {
  role: "assistant" | "user";
  content: string;
  filters?: AIPropertyFilters;
  matchCount?: number;
}

interface DreamHomePanelProps {
  onFiltersChange: (filters: AIPropertyFilters | null) => void;
  matchCount: number;
  properties: Property[];
}

const GREETING: Message = {
  role: "assistant",
  content:
    "Tell me about your dream home and I'll search our listings for you.\n\nIf we don't have it yet, we'll help you design and build it from scratch. 🏡",
};

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-white rounded-2xl rounded-tl-sm border border-slate-100 shadow-sm w-fit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-[#2ec440] animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        />
      ))}
    </div>
  );
}

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return <span key={i}>{part}</span>;
  });
}

function ChatMessage({
  msg,
  onClear,
}: {
  msg: Message;
  onClear?: () => void;
}) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex w-full mb-3 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
          isUser
            ? "bg-slate-900 text-white rounded-tr-sm"
            : "bg-white border border-slate-100 shadow-sm text-slate-700 rounded-tl-sm"
        }`}
      >
        {msg.content.split("\n").map((line, i) => (
          <p key={i} className={i > 0 ? "mt-1" : ""}>
            {renderMarkdown(line)}
          </p>
        ))}

        {/* Results badge */}
        {!isUser && msg.filters && msg.matchCount !== undefined && (
          <div className="mt-3">
            {msg.matchCount > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-[#2ec440]/10 text-[#1a9e2e] font-bold text-[12px] px-3 py-1.5 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {msg.matchCount} {msg.matchCount === 1 ? "match" : "matches"} found
                </span>
                {onClear && (
                  <button
                    onClick={onClear}
                    className="text-slate-400 hover:text-slate-600 text-[11px] font-medium underline underline-offset-2 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            ) : (
              /* No match → Design & Build CTA */
              <div className="mt-2 rounded-xl overflow-hidden border border-amber-100">
                <div className="bg-amber-50 px-3 py-2.5">
                  <p className="text-amber-800 font-semibold text-[12.5px] leading-snug">
                    No listings match yet — but we can build it for you.
                  </p>
                </div>
                <Link
                  href="/build"
                  className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-[#2ec440] text-white font-bold text-[12.5px] px-4 py-2.5 transition-colors w-full"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Design &amp; Build My Dream Home
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DreamHomePanel({
  onFiltersChange,
  matchCount,
  properties,
}: DreamHomePanelProps) {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveFilter, setHasActiveFilter] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Keep match count live in the last AI message
  useEffect(() => {
    if (!hasActiveFilter) return;
    setMessages((prev) => {
      const lastIdx = [...prev]
        .reverse()
        .findIndex((m) => m.role === "assistant" && m.filters);
      if (lastIdx === -1) return prev;
      const realIdx = prev.length - 1 - lastIdx;
      const updated = [...prev];
      updated[realIdx] = { ...updated[realIdx], matchCount };
      return updated;
    });
  }, [matchCount, hasActiveFilter]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai-property-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!res.ok) throw new Error();
      const filters: AIPropertyFilters = await res.json();

      onFiltersChange(filters);
      setHasActiveFilter(true);

      const count = countMatches(properties, filters);
      let reply = filters.summary + "\n\n";
      if (count > 0) {
        reply += `I found **${count} ${count === 1 ? "property" : "properties"}** that match. Check the listings on the left!`;
      } else {
        reply +=
          "No current listings match your description — but that's exactly what our Design & Build service is for.";
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, filters, matchCount: count },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try describing your home again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    onFiltersChange(null);
    setHasActiveFilter(false);
    setMessages([
      GREETING,
      { role: "assistant", content: "Cleared! Describe another dream home to search again. 🏡" },
    ]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const PROMPTS = [
    "3-bed house for rent in Kigali",
    "Modern apartment under $200k",
    "Land plot in Musanze",
    "Villa with pool & garden",
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[340px] xl:w-[360px] shrink-0 border-l border-slate-200 bg-white sticky top-0 h-screen overflow-hidden">

      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          {/* Sparkle */}
          <span className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zM5 15l.9 2.7L8.6 19l-2.7.9L5 22.6l-.9-2.7L1.4 19l2.7-.9L5 15zM19 15l.9 2.7 2.7.9-2.7.9L19 22.6l-.9-2.7-2.7-.9 2.7-.9L19 15z" />
            </svg>
          </span>
          <h2 className="font-black text-slate-900 text-[16px] leading-tight">
            Describe Your<br />Dream Home
          </h2>
        </div>
        <p className="text-[12px] text-slate-500 leading-snug">
          Tell us what you want — we'll find it or build it.
        </p>

        {hasActiveFilter && (
          <button
            onClick={handleReset}
            className="mt-3 text-[12px] font-semibold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear AI search
          </button>
        )}
      </div>

      {/* Quick prompts (only at start) */}
      {messages.length === 1 && (
        <div className="px-4 pt-4 flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setInput(p);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="text-[11.5px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 hover:border-slate-900 hover:text-slate-900 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Chat thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col min-h-0">
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            msg={msg}
            onClear={
              msg.filters && msg.matchCount !== undefined && msg.matchCount > 0
                ? handleReset
                : undefined
            }
          />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <TypingIndicator />
          </div>
        )}
      </div>

      {/* Divider + Design & Build promo (shown always at bottom) */}
      {!hasActiveFilter && (
        <div className="mx-4 mb-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 p-4 text-white">
          <p className="font-bold text-[13px] mb-1">Can't find what you want?</p>
          <p className="text-[12px] text-slate-300 mb-3 leading-snug">
            We design and build custom homes tailored exactly to your vision.
          </p>
          <Link
            href="/build"
            className="inline-flex items-center gap-1.5 bg-[#2ec440] hover:bg-[#28b039] text-white font-bold text-[12.5px] px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Design &amp; Build My Home
          </Link>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-100 bg-white px-4 py-3">
        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:border-slate-900 focus-within:bg-white transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 3-bed house with a garden in Kigali…"
            rows={2}
            className="flex-1 bg-transparent text-[13.5px] text-slate-800 placeholder:text-slate-400 outline-none resize-none min-w-0 leading-snug"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0 w-8 h-8 rounded-full bg-slate-900 hover:bg-[#2ec440] disabled:bg-slate-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors mb-0.5"
            aria-label="Send"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[10.5px] text-slate-400 mt-1.5">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </aside>
  );
}

/** Client-side match counter — mirrors the server NLP filter logic */
function countMatches(properties: Property[], filters: AIPropertyFilters): number {
  return properties.filter((p) => {
    if (filters.type && filters.type !== "all" && p.type !== filters.type) return false;
    if (filters.propertyType && filters.propertyType !== "all" && p.propertyType !== filters.propertyType) return false;
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
