"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { fetchProfessionalsDirectory, type RealProfessionalProfile } from "@/lib/professional/api";
import { useAuth } from "@/lib/auth-context";
import { OPEN_ADD_ROLE_EVENT, requestableRolesFor } from "@/lib/roleRequests/api";
import { useMenu } from "@/lib/menus/menus";
import { SERVICE_CATEGORIES, inServiceCategory } from "@/lib/professional/serviceCategories";
import { SPECIALISATION_GROUPS } from "@/lib/professional/specialisations";
import { useCurrentCountry } from "@/lib/geo/useCurrentCountry";

const FILTER_ITEMS = [
  { key: "services", label: "All Services" },
  { key: "locations", label: "All Locations" },
  { key: "experienced", label: "5+ Years Exp." },
  { key: "individuals", label: "Individuals" },
  { key: "firms", label: "Firms" },
];

export default function ProfessionalsDirectoryPage() {
  const [allProfiles, setAllProfiles] = useState<RealProfessionalProfile[]>([]);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const filterItems = useMenu("professionals-filters", FILTER_ITEMS);
  // The services (plumbing, electrical, tiling, glass...) the administrator shows, in their order and with their names. Every service
  // is listed, with how many professionals offer it, so a visitor sees what can be found here, not only what is already taken.
  const serviceItems = useMenu("professionals-categories", SERVICE_CATEGORIES);
  const { account, isAuthReady } = useAuth();
  const currentCountry = useCurrentCountry();
  const isProfessional = !!account?.roles.includes("professional");
  const canApply = !!account && requestableRolesFor(account.roles).includes("professional");

  // Someone who came here to apply, created an account on the way and was sent back: the application opens by itself, once.
  useEffect(() => {
    if (!account || !canApply) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("apply") !== "professional") return;
    window.history.replaceState(null, "", window.location.pathname);
    window.dispatchEvent(new CustomEvent(OPEN_ADD_ROLE_EVENT, { detail: { role: "professional" } }));
  }, [account, canApply]);
  const applyClass = "inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#2ec440]";

  useEffect(() => {
    let cancelled = false;
    fetchProfessionalsDirectory().then((profiles) => {
      if (!cancelled) {
        setAllProfiles(profiles);
        setProfilesLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  // Each filter can hold several choices. A service is a whole group ("cat:plumbing") or one trade ("spec:Plumber"); a professional
  // matches a filter when they match any of its choices.
  const [services, setServices] = useState<string[]>([]);
  const [places, setPlaces] = useState<string[]>([]);
  const [kinds, setKinds] = useState<("individual" | "firm")[]>([]);
  const [experiencedOnly, setExperiencedOnly] = useState(false);
  // The filter whose choices are open under the row of pills.
  const [openMenu, setOpenMenu] = useState<"" | "services" | "locations" | "type">("");
  const filtersRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setOpenMenu("");
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const toggle = <T,>(list: T[], value: T): T[] => (list.includes(value) ? list.filter(v => v !== value) : [...list, value]);

  // The service choices: each group the administrator shows (with how many professionals are in it) and the trades inside it. A trade is
  // listed once, under the first group that has it; trades no group has, and anything a professional typed in themselves, go under "Other".
  const serviceGroups = useMemo(() => {
    const seen = new Set<string>();
    const groups = serviceItems.map(c => {
      const trades = c.specialisations.filter(t => !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()));
      return { key: c.key, label: c.label, count: allProfiles.filter(p => inServiceCategory(p.specialisations, c)).length, trades };
    });
    const rest = Array.from(new Set([...SPECIALISATION_GROUPS.flatMap(g => g.options), ...allProfiles.flatMap(p => p.specialisations)])).filter(t => !seen.has(t.toLowerCase())).sort();
    return { groups, rest };
  }, [allProfiles, serviceItems]);
  // The cities to choose from are those in the visitor's own country; with nobody listed there, every city. A city is listed once, however
  // it was typed ("Kigali" and "kigali").
  const locations = useMemo(() => {
    const own = currentCountry ? allProfiles.filter(p => (p.country ?? '').trim().toLowerCase() === currentCountry.name.toLowerCase()) : [];
    const source = own.length > 0 ? own : allProfiles;
    const byKey = new Map<string, { name: string; count: number }>();
    for (const p of source) {
      const city = (p.city ?? '').trim();
      if (!city) continue;
      const entry = byKey.get(city.toLowerCase());
      if (entry) entry.count += 1;
      else byKey.set(city.toLowerCase(), { name: city.charAt(0).toUpperCase() + city.slice(1), count: 1 });
    }
    return Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allProfiles, currentCountry]);

  const filteredProfiles = useMemo(() => {
    return allProfiles.filter(profile => {
      // Every part of a card can be searched: the name, what they do, where they are and their bio.
      const needle = searchTerm.trim().toLowerCase();
      const matchesSearch = !needle || [profile.displayName, profile.bio, profile.city, profile.country, ...profile.specialisations].some(part => (part ?? '').toLowerCase().includes(needle));
      const matchesSpec = services.length === 0 || services.some(v => {
        if (v.startsWith('cat:')) {
          const chosen = serviceItems.find(c => c.key === v.slice(4));
          return !!chosen && inServiceCategory(profile.specialisations, chosen);
        }
        return profile.specialisations.some(t => t.toLowerCase() === v.slice(5).toLowerCase());
      });
      const matchesLoc = places.length === 0 || places.some(c => (profile.city ?? '').trim().toLowerCase() === c.toLowerCase());
      const matchesExp = experiencedOnly ? (profile.yearsExperience ?? 0) >= 5 : true;
      
      const matchesKind = kinds.length === 0 || kinds.includes(profile.kind as "individual" | "firm");

      return matchesSearch && matchesSpec && matchesLoc && matchesExp && matchesKind;
    });
  }, [allProfiles, searchTerm, services, places, experiencedOnly, kinds, serviceItems]);

  const labelOfService = (v: string) => (v.startsWith('cat:') ? serviceGroups.groups.find(g => g.key === v.slice(4))?.label ?? v : v.slice(5));
  // What is switched on, shown as removable chips under the pills.
  const chips: { label: string; remove: () => void }[] = [
    ...services.map(v => ({ label: labelOfService(v), remove: () => setServices(list => list.filter(x => x !== v)) })),
    ...places.map(c => ({ label: c, remove: () => setPlaces(list => list.filter(x => x !== c)) })),
    ...kinds.map(k => ({ label: k === 'individual' ? 'Individuals' : 'Firms', remove: () => setKinds(list => list.filter(x => x !== k)) })),
    ...(experiencedOnly ? [{ label: '5+ years', remove: () => setExperiencedOnly(false) }] : []),
  ];
  const hasActiveFilters = !!searchTerm || chips.length > 0;
  const kindCount = (k: 'individual' | 'firm') => allProfiles.filter(p => p.kind === k).length;

  const clearAllFilters = () => {
    setSearchTerm("");
    setServices([]);
    setPlaces([]);
    setExperiencedOnly(false);
    setKinds([]);
  };

  return (
    <div className="w-full bg-[#fcfcfc] pb-16">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-10">
        
        {/* Header & Filters (No background split or border) */}
        <div className="mb-8" ref={filtersRef}>
          <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Find Top Professionals</h1>
            {!isAuthReady ? null : isProfessional ? (
              <Link href="/professional" className={applyClass}>My professional page</Link>
            ) : !account ? (
              <Link href={`/signup?redirect=${encodeURIComponent("/professionals?apply=professional")}`} className={applyClass}>Apply to become a professional</Link>
            ) : canApply ? (
              <button type="button" onClick={() => window.dispatchEvent(new CustomEvent(OPEN_ADD_ROLE_EVENT, { detail: { role: "professional" } }))} className={applyClass}>
                Apply to become a professional
              </button>
            ) : null}
          </div>
          <p className="text-slate-500 max-w-2xl mb-6">
            Browse architects, engineers, designers, and contractors for your project. View their portfolios and reach out directly.
          </p>

          {/* Pill Filters Container */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Search Pill */}
            <div className="relative group flex-shrink-0">
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2ec440] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input 
                type="text" 
                placeholder="Search keywords..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/20 shadow-sm min-w-[200px] text-slate-900 placeholder:text-slate-400 transition-all"
              />
            </div>

            {/* The filters the administrator chose in Settings, in their order and with their names. A pill opens its choices below the row, and
                several can be ticked at once. Individuals and Firms are one filter, shown where the first of the two sits. */}
            {filterItems.map((item, index) => {
              const pill = (on: boolean, open: boolean) => `inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border shadow-sm transition-all ${on ? 'bg-slate-900 border-slate-900 text-white' : open ? 'bg-white border-slate-900 text-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`;
              const menuPill = (menu: 'services' | 'locations' | 'type', label: string, picked: number) => {
                const open = openMenu === menu;
                return (
                  <button key={menu} type="button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpenMenu(open ? '' : menu)} className={pill(picked > 0, open)}>
                    {label}
                    {picked > 0 && <span className="rounded-full bg-white/20 px-1.5 text-xs font-bold">{picked}</span>}
                    <svg className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                );
              };
              if (item.key === 'services') return menuPill('services', item.label, services.length);
              if (item.key === 'locations') return menuPill('locations', item.label, places.length);
              if (item.key === 'individuals' || item.key === 'firms') {
                return filterItems.findIndex(f => f.key === 'individuals' || f.key === 'firms') === index ? menuPill('type', 'Type', kinds.length) : null;
              }
              return (
                <button key={item.key} type="button" aria-pressed={experiencedOnly} onClick={() => setExperiencedOnly(!experiencedOnly)} className={pill(experiencedOnly, false)}>
                  {item.label}
                </button>
              );
            })}

            {/* Clear All Pill */}
            {hasActiveFilters && (
              <button 
                onClick={clearAllFilters}
                className="px-3 py-2 rounded-full text-sm font-bold border border-transparent text-slate-500 hover:text-slate-900 transition-all underline underline-offset-2 ml-0.5"
              >
                Clear
              </button>
            )}
          </div>

          {openMenu && (
            <div role="menu" aria-label={`${openMenu} choices`} className={`mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm ${openMenu === 'services' ? 'max-h-[420px] overflow-y-auto' : ''}`}>
              {openMenu === 'services' && (
                <div className="space-y-3">
                  {serviceGroups.groups.map(g => (
                    <div key={g.key}>
                      <CheckItem strong label={`All ${g.label}`} count={g.count} picked={services.includes(`cat:${g.key}`)} onToggle={() => setServices(list => toggle(list, `cat:${g.key}`))} />
                      {g.trades.length > 0 && (
                        <div className="grid gap-1 pl-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {g.trades.map(t => (
                            <CheckItem key={t} label={t} picked={services.includes(`spec:${t}`)} onToggle={() => setServices(list => toggle(list, `spec:${t}`))} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {serviceGroups.rest.length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-sm font-bold text-slate-900">Other</p>
                      <div className="grid gap-1 pl-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {serviceGroups.rest.map(t => (
                          <CheckItem key={t} label={t} picked={services.includes(`spec:${t}`)} onToggle={() => setServices(list => toggle(list, `spec:${t}`))} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {openMenu === 'locations' && (
                <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {locations.map(c => (
                    <CheckItem key={c.name} label={c.name} count={c.count} picked={places.some(x => x.toLowerCase() === c.name.toLowerCase())} onToggle={() => setPlaces(list => (list.some(x => x.toLowerCase() === c.name.toLowerCase()) ? list.filter(x => x.toLowerCase() !== c.name.toLowerCase()) : [...list, c.name]))} />
                  ))}
                  {locations.length === 0 && <p className="px-3 py-2.5 text-sm font-semibold text-slate-400">No locations yet</p>}
                </div>
              )}
              {openMenu === 'type' && (
                <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <CheckItem label="Individuals" count={kindCount('individual')} picked={kinds.includes('individual')} onToggle={() => setKinds(list => toggle(list, 'individual'))} />
                  <CheckItem label="Firms" count={kindCount('firm')} picked={kinds.includes('firm')} onToggle={() => setKinds(list => toggle(list, 'firm'))} />
                </div>
              )}
            </div>
          )}

          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2" aria-live="polite">
              {chips.map(chip => (
                <button key={chip.label} type="button" onClick={chip.remove} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200">
                  {chip.label}
                  <span aria-hidden="true" className="text-slate-400">×</span>
                  <span className="sr-only">Remove filter</span>
                </button>
              ))}
            </div>
          )}

        </div>

        {/* Results Info */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            {profilesLoaded ? `${filteredProfiles.length} ${filteredProfiles.length === 1 ? 'professional' : 'professionals'}` : 'Loading…'}
          </h2>
        </div>

        {/* Grid */}
        {!profilesLoaded ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading professionals">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-3xl border border-slate-100 bg-slate-50" aria-hidden="true" />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No professionals found</h3>
            <p className="text-slate-500 mb-6">Try adjusting your filters to see more results.</p>
            <button 
              onClick={clearAllFilters}
              className="bg-[#2ec440] hover:bg-[#28b039] text-white font-bold py-2 px-6 rounded-full transition-colors shadow-sm text-sm"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => {
              const avatarImage = profile.photoUrl;

              return (
                <Link
                  key={profile.accountId}
                  href={`/professionals/${profile.accountId}`}
                  className="group relative bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {/* Subtle Colored Top Banner */}
                  <div className="h-20 bg-gradient-to-r from-slate-50 to-slate-100/50 w-full rounded-t-[2rem]"></div>

                  {/* Prominent Circular Profile Picture (Headshot or Logo) */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-[3px] border-white shadow-sm overflow-hidden bg-white z-10">
                    {avatarImage ? (
                      <img
                        src={avatarImage}
                        alt={profile.displayName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-slate-900 text-3xl font-bold text-white">{profile.displayName.charAt(0)}</span>
                    )}
                  </div>

                  {/* Card Content - Centered */}
                  <div className="px-6 pt-12 pb-6 flex flex-col flex-1 items-center text-center">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#2ec440] transition-colors mb-1 inline-flex items-center gap-1.5 justify-center">
                      {profile.displayName}
                    </h3>
                    <p className="text-sm font-bold text-[#2ec440] mb-3">
                      {profile.specialisations.slice(0, 2).join(" · ")}
                      {profile.specialisations.length > 2 && <span className="ml-1 text-xs font-bold text-slate-400">+{profile.specialisations.length - 2}</span>}
                      {!!profile.reviewCount && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                          <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.446a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.957 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.958z" />
                          </svg>
                          {(profile.averageRating ?? 0).toFixed(1)}
                        </span>
                      )}
                    </p>

                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mb-4 font-semibold bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      {profile.city} &bull; {profile.yearsExperience ?? 0} yrs exp.
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-6 flex-1 max-w-[280px]">
                      {profile.bio}
                    </p>

                    <div className="flex items-center justify-between w-full mt-auto pt-4 border-t border-slate-100">
                      <span className="text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-500">
                        {profile.kind === "firm" ? "Firm" : "Individual"}
                      </span>
                      <span className="text-xs font-bold text-slate-900 group-hover:translate-x-1 transition-transform inline-block">
                        View profile &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** One choice that can be ticked, with how many professionals it has. */
function CheckItem({ label, count, picked, strong, onToggle }: { label: string; count?: number; picked: boolean; strong?: boolean; onToggle: () => void }) {
  return (
    <button type="button" role="menuitemcheckbox" aria-checked={picked} onClick={onToggle} className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${strong ? 'font-bold' : 'font-semibold'} ${picked ? 'bg-slate-50 text-[#219b31]' : strong ? 'text-slate-900' : 'text-slate-700'}`}>
      <span className="flex items-center gap-2.5">
        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${picked ? 'border-[#2ec440] bg-[#2ec440] text-white' : 'border-slate-300 bg-white'}`}>
          {picked && (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
        {label}
      </span>
      {count !== undefined && <span className="text-xs font-bold text-slate-400">{count}</span>}
    </button>
  );
}
