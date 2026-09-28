"use client";

import { useEffect, useRef, useState } from "react";

interface AddressSuggestion {
  label: string;
  lat: string;
  lon: string;
}

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  required?: boolean;
}

/** A standard-address autocomplete field, backed by OpenStreetMap's free Nominatim search — same
 *  "free, no API key" convention this app already uses for IP geolocation (see
 *  useVisitorCountry.ts) — instead of a plain free-text box a seller could type anything into.
 *  Picking a suggestion locks in a real, geocoded address; typing still works if nothing matches
 *  (Nominatim's coverage of rural addresses isn't exhaustive), same permissive fallback the
 *  /properties filter bar's own SuggestInput already uses for the same reason. */
export default function AddressInput({ value, onChange, id, placeholder, required }: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against a slower earlier request resolving after a newer one —
  // without this, fast typing could flash a stale suggestion list.
  const requestId = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const query = value.trim();
    // Nothing to reset here for a too-short query — the dropdown's own render
    // condition below gates on `value` directly, so stale suggestions/loading
    // state from a longer query typed a moment ago just never gets shown.
    // (Keeps every setState call inside an async callback — setTimeout/fetch
    // — rather than the effect body itself, which react-hooks/set-state-in-effect
    // flags as a cascading-render risk.)
    if (query.length < 3) return;
    // Debounced well past Nominatim's own "max ~1 request/sec" usage policy,
    // not just for UX.
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      const thisRequest = ++requestId.current;
      fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&q=${encodeURIComponent(query)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data: { display_name: string; lat: string; lon: string }[]) => {
          if (thisRequest !== requestId.current) return;
          setSuggestions(data.map((d) => ({ label: d.display_name, lat: d.lat, lon: d.lon })));
        })
        .catch(() => {
          if (thisRequest === requestId.current) setSuggestions([]);
        })
        .finally(() => {
          if (thisRequest === requestId.current) setLoading(false);
        });
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <input
        id={id}
        type="text"
        autoComplete="off"
        placeholder={placeholder ?? "Start typing your address…"}
        value={value}
        onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
      />
      {isOpen && value.trim().length >= 3 && (loading || suggestions.length > 0) && (
        <div className="absolute left-0 top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto">
          {loading && <p className="px-4 py-3 text-[13px] text-slate-400">Searching…</p>}
          {!loading && suggestions.map((s) => (
            <button
              key={`${s.lat},${s.lon}`}
              type="button"
              // mousedown (not click) so the input's blur doesn't close the list first
              onMouseDown={(e) => { e.preventDefault(); onChange(s.label); setSuggestions([]); setIsOpen(false); }}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-[14px] text-slate-700 font-medium transition-colors border-b border-slate-50 last:border-b-0"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      <p className="mt-1.5 text-xs text-slate-400">Pick a suggested address for the most accurate match.</p>
    </div>
  );
}
