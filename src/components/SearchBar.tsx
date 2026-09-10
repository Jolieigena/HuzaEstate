"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SearchMode = "sale" | "rent";

/**
 * Buy/Rent are filters on the same search, not separate pages — matching
 * how a marketplace homepage's tabs work: picking "Rent" just changes what
 * you're about to search for, it doesn't navigate anywhere by itself. Only
 * the actual search submit navigates, to /properties?type=<mode>&q=<query>.
 * Sell isn't a search filter (you don't search listings "for sell"), so it
 * stays a normal link straight to the sell flow.
 */
export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("sale");
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    // Simulate AI processing delay before navigating
    setTimeout(() => {
      const params = new URLSearchParams({ type: mode });
      if (query.trim()) params.set("q", query.trim());
      router.push(`/properties?${params.toString()}`);
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="inline-flex bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20">
        <button
          type="button"
          onClick={() => setMode("sale")}
          className={`px-6 py-2.5 rounded-full text-sm font-bold transition-colors ${
            mode === "sale" ? "text-white bg-white/20" : "text-white/80 hover:text-white hover:bg-white/10"
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setMode("rent")}
          className={`px-6 py-2.5 rounded-full text-sm font-bold transition-colors ${
            mode === "rent" ? "text-white bg-white/20" : "text-white/80 hover:text-white hover:bg-white/10"
          }`}
        >
          Rent
        </button>
        <Link href="/sell" className="px-6 py-2.5 rounded-full text-sm font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors">
          Sell
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 border border-slate-100 p-2 relative group focus-within:ring-2 focus-within:ring-[#2ec440]/50 transition-all">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-green-50 opacity-0 group-focus-within:opacity-100 transition-opacity rounded-3xl -z-10"></div>

        <div className="flex items-center flex-grow pl-4">
          {/* AI Sparkle Icon */}
          <div className={`flex-shrink-0 transition-transform ${isSearching ? 'animate-pulse text-[#2ec440]' : 'text-blue-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>

          <input
            type="text"
            placeholder={mode === "rent" ? "Describe the rental you want... (e.g. '2-bed apartment in Kigali under $500/mo')" : "Describe your dream home... (e.g. 'A 3-bed villa in Kigali under $300k with a pool')"}
            className="flex-grow px-4 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent text-base md:text-lg font-medium"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isSearching}
          />
        </div>

        <button
          type="submit"
          disabled={isSearching}
          className="bg-slate-900 hover:bg-[#2ec440] text-white px-8 py-4 rounded-2xl transition-all duration-300 flex items-center justify-center font-bold text-base whitespace-nowrap shadow-md disabled:bg-slate-300"
        >
          {isSearching ? 'Thinking...' : 'AI Search'}
        </button>
      </form>
    </div>
  );
}
