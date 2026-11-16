"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchProfessionalsDirectory, type RealProfessionalProfile } from "@/lib/professional/api";

/** The real professionals from the directory, to pick the one who will review a design. Search by name, trade or place. */
export default function ProfessionalPicker({ selectedId, onPick }: { selectedId: string | null; onPick: (profile: RealProfessionalProfile) => void }) {
  const [list, setList] = useState<RealProfessionalProfile[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchProfessionalsDirectory().then((profiles) => {
      if (!cancelled) setList(profiles);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!list) return [];
    if (!needle) return list;
    return list.filter((p) => [p.displayName, p.city, p.country, ...(p.specialisations ?? [])].some((part) => (part ?? "").toLowerCase().includes(needle)));
  }, [list, search]);

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search professionals"
        placeholder="Search by name, trade or city"
        className="mb-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/20"
      />
      {!list ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading professionals…</p>
      ) : shown.length === 0 ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-400">{list.length === 0 ? "No professionals are listed yet." : "No professional matches that search."}</p>
      ) : (
        <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
          {shown.map((p) => {
            const selected = selectedId === p.accountId;
            return (
              <div key={p.accountId} className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${selected ? "border-[#2ec440] bg-[#2ec440]/5" : "border-slate-200 bg-white"}`}>
                <button type="button" onClick={() => onPick(p)} aria-pressed={selected} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photoUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{p.displayName.charAt(0)}</span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-900">{p.displayName}</span>
                    <span className="block truncate text-xs text-slate-500">{[p.specialisations?.slice(0, 2).join(", ") || p.specialisation, p.city].filter(Boolean).join(" · ")}</span>
                    {p.averageRating ? (
                      <span className="block text-xs text-slate-400">
                        ★ {p.averageRating.toFixed(1)} · {p.reviewCount ?? 0} review{p.reviewCount === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </span>
                </button>
                <Link href={`/professionals/${p.accountId}`} target="_blank" className="shrink-0 text-xs font-bold text-slate-500 hover:text-slate-900">
                  View profile
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
