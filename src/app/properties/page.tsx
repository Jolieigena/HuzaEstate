"use client";

import React, { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { mockProperties } from '@/lib/data';
import PropertyCard from '@/components/PropertyCard';

// Dynamically import the map to avoid SSR issues with Leaflet
const PropertiesMap = dynamic(() => import('@/components/PropertiesMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center border border-slate-200">
      <div className="text-slate-400 font-medium flex items-center gap-2">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        Loading Map...
      </div>
    </div>
  )
});

export type BoundingBox = { minLat: number; maxLat: number; minLng: number; maxLng: number };
export type PointSearch = { lat: number; lng: number; radiusKm: number };

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') ?? '');
  const [filterType, setFilterType] = useState(searchParams.get('type') ?? 'all');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [mapBoundingBox, setMapBoundingBox] = useState<BoundingBox | null>(null);
  const [pointSearch, setPointSearch] = useState<PointSearch | null>(null);

  const filteredProperties = mockProperties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          property.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || property.type === filterType;
    const matchesPropType = propertyTypeFilter === 'all' || property.propertyType === propertyTypeFilter.toLowerCase();
    const matchesBounds = mapBoundingBox
      ? (property.lat! >= mapBoundingBox.minLat && property.lat! <= mapBoundingBox.maxLat &&
         property.lng! >= mapBoundingBox.minLng && property.lng! <= mapBoundingBox.maxLng)
      : true;
    const matchesPoint = pointSearch
      ? haversineKm(property.lat!, property.lng!, pointSearch.lat, pointSearch.lng) <= pointSearch.radiusKm
      : true;
    return matchesSearch && matchesType && matchesPropType && matchesBounds && matchesPoint;
  });

  return (
    <div className="w-full bg-[#f8fafc] pt-4 pb-0 flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 md:px-8 flex-shrink-0">
        {/* NEW HEADER BAR */}
        <div className="flex flex-col md:flex-row items-center justify-between pb-6 pt-2 border-b border-slate-100 mb-6 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto flex-1">
            {/* Filter Tabs */}
            <div className="flex items-center gap-6 font-semibold text-slate-500 text-[15px]">
              <button 
                onClick={() => setFilterType('rent')}
                className={`pb-1 ${filterType === 'rent' ? 'text-slate-900 border-b-2 border-[#2ec440]' : 'hover:text-slate-900'}`}
              >Rent</button>
              <button 
                onClick={() => setFilterType('sale')}
                className={`pb-1 ${filterType === 'sale' ? 'text-slate-900 border-b-2 border-[#2ec440]' : 'hover:text-slate-900'}`}
              >Buy</button>
              <button 
                onClick={() => setFilterType('all')}
                className={`pb-1 ${filterType === 'all' ? 'text-slate-900 border-b-2 border-[#2ec440]' : 'hover:text-slate-900'}`}
              >All</button>
            </div>
            
            <div className="hidden sm:block w-px h-6 bg-slate-200"></div>

            {/* Search Input */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-[280px]">
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input 
                  type="text" 
                  placeholder="Kigali, Rwanda" 
                  className="w-full pl-11 pr-4 py-2.5 bg-white/60 border border-transparent rounded-full focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all text-slate-900 placeholder:text-slate-500 font-medium text-[15px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Property Type Pills */}
            <div className="hidden xl:flex items-center bg-white p-1.5 rounded-full border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] mx-auto">
              {['All', 'House', 'Apartment', 'Land'].map((type) => (
                <button
                  key={type}
                  onClick={() => setPropertyTypeFilter(type)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-[14px] transition-all ${
                    propertyTypeFilter === type
                      ? 'bg-slate-100 text-slate-700'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {type === 'House' && <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>}
                  {type === 'Apartment' && <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>}
                  {type === 'Land' && <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>}
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Map/Grid Toggle */}
          <div className="flex items-center bg-slate-50 p-1 rounded-full border border-slate-100 self-start md:self-auto w-full md:w-auto justify-center">
            <button 
              onClick={() => setViewMode('map')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all ${viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <svg className={`w-4 h-4 ${viewMode === 'map' ? 'text-[#2ec440]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
              Map
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <svg className={`w-4 h-4 ${viewMode === 'grid' ? 'text-[#2ec440]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              Grid
            </button>
          </div>
        </div>

        {/* TITLE ROW */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight mb-1">
              {searchTerm || 'Kigali, Rwanda'} Accommodation
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              {filteredProperties.length} homes found
            </p>
          </div>
          
          <div className="hidden sm:flex items-center gap-1 text-sm font-bold text-slate-900 cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
            Sort by: <span className="text-[#2ec440]">Latest</span>
            <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 md:px-8 flex-1 flex flex-col lg:flex-row gap-6 pb-6">
        
        {/* Left Side: Property List */}
        <div className={`w-full flex-col pr-1 pb-4 
          ${viewMode === 'map' ? 'lg:w-[55%] hidden lg:flex' : 'lg:w-full flex'}
        `}>
          {filteredProperties.length > 0 ? (
            <div className={`grid gap-5 ${viewMode === 'map' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              {filteredProperties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 mt-4">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No properties found</h3>
              <p className="text-slate-500">Try adjusting your search criteria or clear your filters.</p>
              <button
                onClick={() => { setSearchTerm(''); setFilterType('all'); setMapBoundingBox(null); setPointSearch(null); }}
                className="mt-6 text-[#2ec440] font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Interactive Map */}
        <div className={`w-full lg:w-[45%] h-[calc(100vh-280px)] lg:h-[calc(100vh-140px)] rounded-2xl overflow-hidden sticky top-6 
          ${viewMode === 'map' ? 'block' : 'hidden'}
        `}>
          <PropertiesMap
            properties={filteredProperties}
            viewMode={viewMode}
            onBoundingBoxChange={setMapBoundingBox}
            onPointSearchChange={setPointSearch}
          />
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={null}>
      <PropertiesContent />
    </Suspense>
  );
}
