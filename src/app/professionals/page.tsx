"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { fetchProfessionalsDirectory, type RealProfessionalProfile } from "@/lib/professional/api";
import Select from "@/components/shared/Select";
import { useAuth } from "@/lib/auth-context";
import { OPEN_ADD_ROLE_EVENT, requestableRolesFor } from "@/lib/roleRequests/api";
import { useMenu } from "@/lib/menus/menus";
import { SERVICE_CATEGORIES, inServiceCategory } from "@/lib/professional/serviceCategories";

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
  // The services (plumbing, tiling, glass...) the administrator shows, in their order and with their names. A service only appears once
  // someone offers it, so a chip never leads to an empty list.
  const serviceItems = useMenu("professionals-categories", SERVICE_CATEGORIES);
  const [category, setCategory] = useState("");
  const { account, isAuthReady } = useAuth();
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
  const [specialization, setSpecialization] = useState("");
  const [location, setLocation] = useState("");
  const [experiencedOnly, setExperiencedOnly] = useState(false);
  const [kindFilter, setKindFilter] = useState<"all" | "individual" | "firm">("all");

  // Extract unique options
  const specializations = useMemo(() => Array.from(new Set(allProfiles.flatMap(p => p.specialisations))).sort(), [allProfiles]);
  const locations = useMemo(() => Array.from(new Set(allProfiles.map(p => p.city))).sort(), [allProfiles]);

  const filteredProfiles = useMemo(() => {
    return allProfiles.filter(profile => {
      // Every part of a card can be searched: the name, what they do, where they are and their bio.
      const needle = searchTerm.trim().toLowerCase();
      const matchesSearch = !needle || [profile.displayName, profile.bio, profile.city, profile.country, ...profile.specialisations].some(part => (part ?? '').toLowerCase().includes(needle));
      const matchesSpec = specialization ? profile.specialisations.includes(specialization) : true;
      const matchesLoc = location ? profile.city === location : true;
      const matchesExp = experiencedOnly ? (profile.yearsExperience ?? 0) >= 5 : true;
      
      const matchesKind = kindFilter === "all" || profile.kind === kindFilter;
      const chosen = serviceItems.find((c) => c.key === category);
      const matchesCategory = !chosen || inServiceCategory(profile.specialisations, chosen);

      return matchesSearch && matchesSpec && matchesLoc && matchesExp && matchesKind && matchesCategory;
    });
  }, [allProfiles, searchTerm, specialization, location, experiencedOnly, kindFilter, category, serviceItems]);

  const serviceChips = serviceItems
    .map(c => ({ key: c.key, label: c.label, count: allProfiles.filter(p => inServiceCategory(p.specialisations, c)).length }))
    .filter(c => c.count > 0 || c.key === category);

  const hasActiveFilters = searchTerm || specialization || location || experiencedOnly || kindFilter !== "all" || category;

  const clearAllFilters = () => {
    setSearchTerm("");
    setSpecialization("");
    setLocation("");
    setExperiencedOnly(false);
    setKindFilter("all");
    setCategory("");
  };

  return (
    <div className="w-full bg-[#fcfcfc] pb-16">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-10">
        
        {/* Header & Filters (No background split or border) */}
        <div className="mb-8">
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

            {/* The filters the administrator chose in Settings, in their order and with their names. */}
            {filterItems.map((item, index) => {
              const pill = (cls: boolean) => `px-4 py-2 rounded-full text-sm font-medium border shadow-sm transition-all ${cls ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`;
              const isSelect = item.key === 'services' || item.key === 'locations';
              const wasSelect = index > 0 && (filterItems[index - 1].key === 'services' || filterItems[index - 1].key === 'locations');
              const divider = !isSelect && wasSelect ? <div className="hidden sm:block w-px h-5 bg-slate-200 mx-0.5"></div> : null;
              if (item.key === 'services' || item.key === 'locations') {
                const isServices = item.key === 'services';
                const value = isServices ? specialization : location;
                return (
                  <div key={item.key} className="relative flex-shrink-0">
                    <Select
                      value={value}
                      onChange={e => (isServices ? setSpecialization(e.target.value) : setLocation(e.target.value))}
                      className={`appearance-none pl-4 pr-9 py-2 bg-white border rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 shadow-sm cursor-pointer transition-all hover:bg-slate-50 ${value ? 'border-slate-900 text-slate-900' : 'border-slate-200 text-slate-700'}`}
                    >
                      <option value="">{item.label}</option>
                      {(isServices ? specializations : locations).map(o => <option key={o} value={o}>{o}</option>)}
                    </Select>
                  </div>
                );
              }
              const toggle =
                item.key === 'experienced'
                  ? { on: experiencedOnly, click: () => setExperiencedOnly(!experiencedOnly) }
                  : item.key === 'individuals'
                  ? { on: kindFilter === 'individual', click: () => setKindFilter(kindFilter === 'individual' ? 'all' : 'individual') }
                  : { on: kindFilter === 'firm', click: () => setKindFilter(kindFilter === 'firm' ? 'all' : 'firm') };
              return (
                <span key={item.key} className="contents">
                  {divider}
                  <button onClick={toggle.click} className={pill(toggle.on)}>
                    {item.label}
                  </button>
                </span>
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

          {/* Services: one chip for each service someone offers, with how many do. */}
          {serviceChips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Services">
              <button
                type="button"
                onClick={() => setCategory('')}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold border transition-all ${category === '' ? 'bg-[#2ec440] border-[#2ec440] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                All services
              </button>
              {serviceChips.map(chip => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setCategory(category === chip.key ? '' : chip.key)}
                  aria-pressed={category === chip.key}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold border transition-all ${category === chip.key ? 'bg-[#2ec440] border-[#2ec440] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                  {chip.label} <span className={category === chip.key ? 'text-white/80' : 'text-slate-400'}>{chip.count}</span>
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
