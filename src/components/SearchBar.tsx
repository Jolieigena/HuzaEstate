"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsSearching(true);
      // Simulate AI processing delay before navigating
      setTimeout(() => {
        router.push(`/properties?q=${encodeURIComponent(query)}`);
      }, 1000);
    }
  };

  return (
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
          placeholder="Describe your dream home... (e.g. 'A 3-bed villa in Kigali under $300k with a pool')"
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
  );
}
