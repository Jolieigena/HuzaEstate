"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/properties?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/properties");
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex w-full max-w-2xl bg-white rounded-full overflow-hidden shadow-lg border border-slate-100 p-1 sm:p-1.5">
      <div className="flex items-center flex-grow pl-4 sm:pl-5">
        <svg className="w-5 h-5 text-slate-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Enter an address, neighborhood, or city"
          className="flex-grow px-2 py-3 sm:py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent text-[15px] font-medium"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="bg-slate-900 hover:bg-[#2ec440] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full transition-all duration-300 flex items-center justify-center font-bold text-[15px] whitespace-nowrap"
      >
        Search
      </button>
    </form>
  );
}
