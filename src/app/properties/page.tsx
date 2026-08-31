"use client";

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { mockProperties } from '@/lib/data';
import PropertyCard from '@/components/PropertyCard';

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') ?? '');
  const [filterType, setFilterType] = useState(searchParams.get('type') ?? 'all');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('all');
  const [bedsFilter, setBedsFilter] = useState('all');
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [customMinPrice, setCustomMinPrice] = useState('');
  const [customMaxPrice, setCustomMaxPrice] = useState('');

  const filteredProperties = mockProperties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          property.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || property.type === filterType;
    const matchesPropType = propertyTypeFilter === 'all' || property.propertyType === propertyTypeFilter.toLowerCase();
    
    let matchesPrice = true;
    if (customMinPrice) matchesPrice = matchesPrice && property.price >= Number(customMinPrice);
    if (customMaxPrice) matchesPrice = matchesPrice && property.price <= Number(customMaxPrice);

    let matchesBeds = true;
    if (bedsFilter !== 'all') matchesBeds = property.bedrooms >= parseInt(bedsFilter);
    
    return matchesSearch && matchesType && matchesPropType && matchesPrice && matchesBeds;
  });

  return (
    <div className="w-full bg-[#f8fafc] pt-4 pb-0 flex flex-col min-h-screen">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 md:px-8 flex-shrink-0">
        {/* NEW HEADER BAR */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between pb-6 pt-2 border-b border-slate-100 mb-6 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 xl:gap-6 w-full xl:w-auto flex-1 flex-wrap">
            
            {/* Search Input */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-[280px]">
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input 
                  type="text" 
                  placeholder="Kigali, Rwanda" 
                  className="w-full pl-11 pr-4 py-2.5 bg-white/60 border border-transparent rounded-full focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all text-slate-900 placeholder:text-slate-500 font-medium text-[15px] shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* For Sale / For Rent dropdown */}
              <div className="relative">
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-full px-5 py-2.5 pr-10 font-medium text-[14px] text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 shadow-sm transition-all"
                >
                  <option value="all">Any Status</option>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
                <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>

              {/* Price Filter */}
              <div className="relative">
                <button 
                  onClick={() => setIsPriceOpen(!isPriceOpen)}
                  className="bg-white border border-slate-200 rounded-full px-5 py-2.5 font-medium text-[14px] text-slate-700 hover:border-slate-300 shadow-sm flex items-center gap-2 transition-all"
                >
                  {customMinPrice || customMaxPrice ? `Price: $${customMinPrice || '0'} - $${customMaxPrice || 'Any'}` : 'Any Price'}
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {isPriceOpen && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 w-72">
                    <h3 className="font-bold text-slate-900 mb-2 px-2 text-[15px]">Price Range</h3>
                    
                    {/* Presets List */}
                    <div className="flex flex-col gap-0.5 mb-4">
                      <button onClick={() => { setCustomMinPrice(''); setCustomMaxPrice(''); setIsPriceOpen(false); }} className="text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700 font-medium text-[14px] transition-colors">Any Price</button>
                      <button onClick={() => { setCustomMinPrice(''); setCustomMaxPrice('100000'); setIsPriceOpen(false); }} className="text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700 font-medium text-[14px] transition-colors">Under $100k</button>
                      <button onClick={() => { setCustomMinPrice('100000'); setCustomMaxPrice('300000'); setIsPriceOpen(false); }} className="text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700 font-medium text-[14px] transition-colors">$100k - $300k</button>
                      <button onClick={() => { setCustomMinPrice('300000'); setCustomMaxPrice('500000'); setIsPriceOpen(false); }} className="text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700 font-medium text-[14px] transition-colors">$300k - $500k</button>
                      <button onClick={() => { setCustomMinPrice('500000'); setCustomMaxPrice(''); setIsPriceOpen(false); }} className="text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700 font-medium text-[14px] transition-colors">Over $500k</button>
                    </div>

                    <div className="w-full h-px bg-slate-100 mb-4"></div>

                    {/* Custom Range */}
                    <h4 className="font-bold text-slate-900 mb-2 px-2 text-[13px] uppercase tracking-wider">Custom</h4>
                    <div className="flex items-center gap-3 px-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                        <input 
                          type="number" 
                          placeholder="Min"
                          value={customMinPrice}
                          onChange={(e) => setCustomMinPrice(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]"
                        />
                      </div>
                      <span className="text-slate-400 font-medium">-</span>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                        <input 
                          type="number" 
                          placeholder="Max"
                          value={customMaxPrice}
                          onChange={(e) => setCustomMaxPrice(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-all text-[14px]"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2 px-2">
                      <button 
                        onClick={() => { setCustomMinPrice(''); setCustomMaxPrice(''); }}
                        className="flex-1 py-2 font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-[14px] border border-slate-200"
                      >
                        Reset
                      </button>
                      <button 
                        onClick={() => setIsPriceOpen(false)}
                        className="flex-1 py-2 font-semibold text-white bg-[#2ec440] hover:bg-[#28b039] rounded-lg transition-colors text-[14px]"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Beds & Baths dropdown */}
              <div className="relative">
                <select 
                  value={bedsFilter}
                  onChange={(e) => setBedsFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-full px-5 py-2.5 pr-10 font-medium text-[14px] text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 shadow-sm transition-all"
                >
                  <option value="all">Any Beds</option>
                  <option value="1">1+ beds</option>
                  <option value="2">2+ beds</option>
                  <option value="3">3+ beds</option>
                  <option value="4">4+ beds</option>
                </select>
                <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>

              {/* Home Type dropdown */}
              <div className="relative">
                <select 
                  value={propertyTypeFilter}
                  onChange={(e) => setPropertyTypeFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-full px-5 py-2.5 pr-10 font-medium text-[14px] text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 shadow-sm transition-all"
                >
                  <option value="all">Home Type</option>
                  <option value="House">Houses</option>
                  <option value="Apartment">Apartments</option>
                  <option value="Land">Land</option>
                </select>
                <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>

              {/* More Filters button */}
              <button className="bg-white border border-slate-200 rounded-full px-5 py-2.5 font-medium text-[14px] text-slate-700 hover:border-slate-300 shadow-sm flex items-center gap-2 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                More
              </button>
            </div>
          </div>
          
          {/* Save Search Button */}
          <div className="flex items-center w-full xl:w-auto justify-end mt-2 xl:mt-0">
            <button className="text-[#2ec440] font-bold text-[14px] hover:bg-[#2ec440]/10 px-4 py-2 rounded-full transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              Save Search
            </button>
          </div>
        </div>

        {/* TITLE ROW */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight mb-1">
              {searchTerm || 'Kigali, Rwanda'} Real Estate & Homes
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              {filteredProperties.length} results
            </p>
          </div>
          
          <div className="hidden sm:flex items-center gap-1 text-sm font-bold text-slate-900 cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-200">
            Sort: <span className="text-slate-500">Homes for You</span>
            <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 md:px-8 flex-1 pb-12">
        {filteredProperties.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border border-slate-200 mt-4 max-w-2xl mx-auto shadow-sm">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No exact matches</h3>
            <p className="text-slate-500 mb-6">Try changing or removing some of your filters.</p>
            <button
              onClick={() => { setSearchTerm(''); setFilterType('all'); setPropertyTypeFilter('all'); setCustomMinPrice(''); setCustomMaxPrice(''); setBedsFilter('all'); }}
              className="bg-[#2ec440] hover:bg-[#28b039] text-white font-bold py-2.5 px-6 rounded-full transition-colors shadow-sm"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

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
