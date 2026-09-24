"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ProfessionalService } from "@/lib/professional/service";
import { ProfessionalProfile } from "@/lib/professional/types";
import { adaptRealProfile, fetchProfessionalsDirectory } from "@/lib/professional/api";

const AVAILABILITY_STYLE: Record<string, string> = {
  available: "bg-[#2ec440]/10 text-[#219b31]",
  limited: "bg-amber-50 text-amber-700",
  unavailable: "bg-slate-100 text-slate-500",
};

const AVAILABILITY_LABEL: Record<string, string> = {
  available: "Available now",
  limited: "Limited availability",
  unavailable: "Not accepting work",
};

// High-quality headshots for individual professionals
const INDIVIDUAL_IMAGES = [
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
];

// High-quality logos or modern building facades for companies/firms
const COMPANY_IMAGES = [
  "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80",
  "https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&q=80",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&q=80",
];

function getProfileImage(profile: ProfessionalProfile, index: number) {
  if (profile.photoUrl) return profile.photoUrl;
  const isCompany = profile.kind.includes("firm") || profile.kind.includes("company");
  if (isCompany) {
    return COMPANY_IMAGES[index % COMPANY_IMAGES.length];
  }
  return INDIVIDUAL_IMAGES[index % INDIVIDUAL_IMAGES.length];
}

export default function ProfessionalsDirectoryPage() {
  const mockProfiles = ProfessionalService.getApprovedProfiles();
  const [realProfiles, setRealProfiles] = useState<ProfessionalProfile[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchProfessionalsDirectory().then((profiles) => {
      if (!cancelled) setRealProfiles(profiles.map(adaptRealProfile));
    });
    return () => { cancelled = true; };
  }, []);

  const allProfiles = useMemo(() => [...realProfiles, ...mockProfiles], [realProfiles, mockProfiles]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [location, setLocation] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [experiencedOnly, setExperiencedOnly] = useState(false);
  const [kindFilter, setKindFilter] = useState<"all" | "individual" | "firm">("all");

  // Extract unique options
  const specializations = useMemo(() => Array.from(new Set(allProfiles.map(p => p.primarySpecialisation))).sort(), [allProfiles]);
  const locations = useMemo(() => Array.from(new Set(allProfiles.map(p => p.city))).sort(), [allProfiles]);

  const filteredProfiles = useMemo(() => {
    return allProfiles.filter(profile => {
      const matchesSearch = profile.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            profile.biography.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpec = specialization ? profile.primarySpecialisation === specialization : true;
      const matchesLoc = location ? profile.city === location : true;
      const matchesAvailable = availableOnly ? profile.availability === "available" : true;
      const matchesExp = experiencedOnly ? profile.yearsExperience >= 5 : true;
      
      let matchesKind = true;
      if (kindFilter === "individual") {
        matchesKind = profile.kind.includes("individual");
      } else if (kindFilter === "firm") {
        matchesKind = profile.kind.includes("firm") || profile.kind.includes("company");
      }

      return matchesSearch && matchesSpec && matchesLoc && matchesAvailable && matchesExp && matchesKind;
    });
  }, [allProfiles, searchTerm, specialization, location, availableOnly, experiencedOnly, kindFilter]);

  const hasActiveFilters = searchTerm || specialization || location || availableOnly || experiencedOnly || kindFilter !== "all";

  const clearAllFilters = () => {
    setSearchTerm("");
    setSpecialization("");
    setLocation("");
    setAvailableOnly(false);
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

            {/* Toggle Pills */}
            <button 
              onClick={() => setAvailableOnly(!availableOnly)}
              className={`px-4 py-2 rounded-full text-sm font-medium border shadow-sm transition-all ${availableOnly ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              Available Now
            </button>

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
            {filteredProfiles.map((profile, index) => {
              const avatarImage = getProfileImage(profile, index);

              return (
                <Link
                  key={profile.id}
                  href={`/professionals/${profile.id}`}
                  className="group relative bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {/* Subtle Colored Top Banner */}
                  <div className="h-20 bg-gradient-to-r from-slate-50 to-slate-100/50 w-full rounded-t-[2rem]"></div>

                  {/* Prominent Circular Profile Picture (Headshot or Logo) */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-[3px] border-white shadow-sm overflow-hidden bg-white z-10">
                    <img 
                      src={avatarImage} 
                      alt={profile.displayName} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Card Content - Centered */}
                  <div className="px-6 pt-12 pb-6 flex flex-col flex-1 items-center text-center">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#2ec440] transition-colors mb-1 inline-flex items-center gap-1.5 justify-center">
                      {profile.displayName}
                    </h3>
                    <p className="text-sm font-bold text-[#2ec440] mb-3">{profile.primarySpecialisation}</p>
                    
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mb-4 font-semibold bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      {profile.city} &bull; {profile.yearsExperience} yrs exp.
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-6 flex-1 max-w-[280px]">
                      {profile.biography}
                    </p>

                    <div className="flex items-center justify-between w-full mt-auto pt-4 border-t border-slate-100">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full ${AVAILABILITY_STYLE[profile.availability]}`}>
                        {AVAILABILITY_LABEL[profile.availability]}
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
