"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SearchMode = "sale" | "rent";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const mode: SearchMode = "sale";
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ type: mode });
    if (query.trim()) params.set("q", query.trim());
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">


      {/* Search bar */}
      <form
        onSubmit={handleSearch}
        className="flex w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-100 p-1.5 gap-1.5"
      >
        <div className="flex items-center flex-grow pl-3 gap-2">
          {/* Location pin icon */}
          <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            type="text"
            placeholder="City, neighbourhood or area…"
            className="flex-grow py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent text-base font-medium"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="bg-[#2ec440] hover:bg-[#28b039] text-white px-8 py-3.5 rounded-xl transition-colors font-bold text-base whitespace-nowrap shadow-sm"
        >
          Search
        </button>
      </form>
    </div>
  );
}
