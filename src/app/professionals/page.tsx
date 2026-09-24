"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { fetchProfessionalsDirectory, type RealProfessionalProfile } from "@/lib/professional/api";

export default function ProfessionalsDirectoryPage() {
  const [allProfiles, setAllProfiles] = useState<RealProfessionalProfile[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchProfessionalsDirectory().then((profiles) => {
      if (!cancelled) setAllProfiles(profiles);
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
  const specializations = useMemo(() => Array.from(new Set(allProfiles.map(p => p.specialisation))).sort(), [allProfiles]);
  const locations = useMemo(() => Array.from(new Set(allProfiles.map(p => p.city))).sort(), [allProfiles]);

  const filteredProfiles = useMemo(() => {
    return allProfiles.filter(profile => {
      const matchesSearch = profile.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            profile.bio.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpec = specialization ? profile.specialisation === specialization : true;
      const matchesLoc = location ? profile.city === location : true;
      const matchesExp = experiencedOnly ? (profile.yearsExperience ?? 0) >= 5 : true;
      
      const matchesKind = kindFilter === "all" || profile.kind === kindFilter;

      return matchesSearch && matchesSpec && matchesLoc && matchesExp && matchesKind;
    });
  }, [allProfiles, searchTerm, specialization, location, experiencedOnly, kindFilter]);

  const hasActiveFilters = searchTerm || specialization || location || experiencedOnly || kindFilter !== "all";

  const clearAllFilters = () => {
    setSearchTerm("");
    setSpecialization("");
    setLocation("");
    setExperiencedOnly(false);
    setKindFilter("all");
  };

  return (
    <div className="w-full bg-[#fcfcfc] pb-16">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-10">
        
        {/* Header & Filters (No background split or border) */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Find Top Professionals</h1>
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

            {/* Specialization Select Pill */}
            <div className="relative flex-shrink-0">
              <select 
                value={specialization}
                onChange={e => setSpecialization(e.target.value)}
                className={`appearance-none pl-4 pr-9 py-2 bg-white border rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 shadow-sm cursor-pointer transition-all hover:bg-slate-50 ${specialization ? 'border-slate-900 text-slate-900' : 'border-slate-200 text-slate-700'}`}
              >
                <option value="">All Services</option>
                {specializations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <svg className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${specialization ? 'text-slate-900' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>

            {/* Location Select Pill */}
            <div className="relative flex-shrink-0">
              <select 
                value={location}
                onChange={e => setLocation(e.target.value)}
                className={`appearance-none pl-4 pr-9 py-2 bg-white border rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 shadow-sm cursor-pointer transition-all hover:bg-slate-50 ${location ? 'border-slate-900 text-slate-900' : 'border-slate-200 text-slate-700'}`}
              >
                <option value="">All Locations</option>
                {locations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <svg className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${location ? 'text-slate-900' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>

            <div className="hidden sm:block w-px h-5 bg-slate-200 mx-0.5"></div>

            <button 
              onClick={() => setExperiencedOnly(!experiencedOnly)}
              className={`px-4 py-2 rounded-full text-sm font-medium border shadow-sm transition-all ${experiencedOnly ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              5+ Years Exp.
            </button>

            <button 
              onClick={() => setKindFilter(kindFilter === 'individual' ? 'all' : 'individual')}
              className={`px-4 py-2 rounded-full text-sm font-medium border shadow-sm transition-all ${kindFilter === 'individual' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              Individuals
            </button>
            
            <button 
              onClick={() => setKindFilter(kindFilter === 'firm' ? 'all' : 'firm')}
              className={`px-4 py-2 rounded-full text-sm font-medium border shadow-sm transition-all ${kindFilter === 'firm' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              Firms
            </button>
            
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
        </div>

        {/* Results Info */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            {filteredProfiles.length} {filteredProfiles.length === 1 ? 'professional' : 'professionals'}
          </h2>
        </div>

        {/* Grid */}
        {filteredProfiles.length === 0 ? (
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
                    <p className="text-sm font-bold text-[#2ec440] mb-3">{profile.specialisation}</p>
                    
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
