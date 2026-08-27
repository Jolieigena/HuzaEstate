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
    <form onSubmit={handleSearch} className="flex w-full max-w-3xl mx-auto bg-white rounded-full overflow-hidden shadow-lg p-1 sm:p-2">
      <input
        type="text"
        placeholder="Enter an address, neighborhood, city, or ZIP code"
        className="flex-grow px-4 sm:px-6 py-3 sm:py-4 text-gray-900 focus:outline-none bg-transparent"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 sm:px-8 sm:py-4 rounded-full transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-label="Search"
      >
        <svg className="w-6 h-6 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden sm:inline font-bold text-lg">Search</span>
      </button>
    </form>
  );
}
