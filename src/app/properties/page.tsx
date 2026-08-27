"use client";

import React, { useState } from 'react';
import { mockProperties } from '@/lib/data';
import PropertyCard from '@/components/PropertyCard';

export default function PropertiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredProperties = mockProperties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          property.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || property.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen pt-10 pb-20">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 md:px-12">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Search Properties
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl">
            Browse our exclusive collection of premium real estate across Kigali. Find your perfect home or investment opportunity today.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-10 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              placeholder="Search by neighborhood, city, or title..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#2ec440]/20 focus:bg-white transition-colors text-slate-900 placeholder:text-slate-400 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-6 py-3 rounded-xl font-bold transition-colors ${filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterType('sale')}
              className={`px-6 py-3 rounded-xl font-bold transition-colors ${filterType === 'sale' ? 'bg-[#2ec440] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              Buy
            </button>
            <button 
              onClick={() => setFilterType('rent')}
              className={`px-6 py-3 rounded-xl font-bold transition-colors ${filterType === 'rent' ? 'bg-[#2ec440] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              Rent
            </button>
          </div>
        </div>

        {/* Results Grid */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {filteredProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No properties found</h3>
            <p className="text-slate-500">Try adjusting your search criteria or clear your filters.</p>
            <button 
              onClick={() => { setSearchTerm(''); setFilterType('all'); }}
              className="mt-6 text-[#2ec440] font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
