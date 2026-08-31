import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PropertyCard from '@/components/PropertyCard';
import { mockProperties } from '@/lib/data';

export default function BuyPage() {
  const featuredForSale = mockProperties.filter(property => property.type === 'sale').slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-40 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-40">
          <Image 
            src="https://images.unsplash.com/photo-6vKo_e01VYY?q=80&w=2000&auto=format&fit=crop"
            alt="Luxury Home"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">Find your <span className="text-[#2ec440]">forever</span> home.</h1>
          <p className="text-xl text-slate-200 max-w-2xl mx-auto mb-12 font-medium">Discover the most exclusive properties for sale across Rwanda. Start your journey here.</p>
          
          {/* Search Bar */}
          <form action="/properties" method="GET" className="max-w-3xl mx-auto bg-white rounded-2xl p-2 sm:p-3 flex flex-col sm:flex-row items-center gap-3 shadow-2xl">
            <input type="hidden" name="type" value="sale" />
            <div className="flex-grow flex items-center px-4 w-full sm:w-auto">
              <svg className="w-6 h-6 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input
                type="text"
                name="q"
                placeholder="Search by neighborhood, city, or zip code"
                className="w-full bg-transparent border-none focus:outline-none text-slate-900 text-lg py-2 font-medium placeholder:font-normal"
              />
            </div>
            <button type="submit" className="w-full sm:w-auto bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-4 px-10 rounded-xl transition-colors whitespace-nowrap">
              Search Homes
            </button>
          </form>
        </div>
      </section>

      {/* Curated Categories */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-24 -mt-20 relative z-10">
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Category 1 */}
          <Link href="/properties?type=sale" className="group relative h-80 rounded-3xl overflow-hidden bg-slate-900 shadow-xl">
            <Image
              src="https://images.unsplash.com/photo-1609507315751-216f91bc8ffb?q=80&w=800&auto=format&fit=crop"
              alt="Luxury Villas"
              fill
              className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8">
              <h3 className="text-2xl font-bold text-white mb-2">Luxury Villas</h3>
              <p className="text-slate-300 font-medium">Explore premium estates with pools and expansive gardens.</p>
            </div>
          </Link>

          {/* Category 2 */}
          <Link href="/properties?type=sale" className="group relative h-80 rounded-3xl overflow-hidden bg-slate-900 shadow-xl md:-translate-y-8">
            <Image
              src="https://images.unsplash.com/photo-1682773083915-5375145f99e5?q=80&w=800&auto=format&fit=crop"
              alt="City Apartments"
              fill
              className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8">
              <h3 className="text-2xl font-bold text-white mb-2">City Apartments</h3>
              <p className="text-slate-300 font-medium">Modern high-rises in the heart of Kigali's business district.</p>
            </div>
          </Link>

          {/* Category 3 */}
          <Link href="/properties?type=sale" className="group relative h-80 rounded-3xl overflow-hidden bg-slate-900 shadow-xl">
            <Image
              src="https://images.unsplash.com/photo-1756245994834-61974c290b61?q=80&w=800&auto=format&fit=crop"
              alt="Family Homes"
              fill
              className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8">
              <h3 className="text-2xl font-bold text-white mb-2">Family Homes</h3>
              <p className="text-slate-300 font-medium">Quiet neighborhoods with great schools and spacious yards.</p>
            </div>
          </Link>

        </div>
      </section>

      {/* Featured Homes for Sale */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Homes for sale right now</h2>
            <p className="text-slate-500 text-lg">A sample of what&apos;s currently listed across Rwanda.</p>
          </div>
          <Link
            href="/properties?type=sale"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-[#2ec440] text-white font-semibold text-sm px-6 py-3 rounded-full transition-all self-start sm:self-auto"
          >
            <span>View all for-sale homes</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuredForSale.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      {/* Mortgage Cross-Sell */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 pb-24">
        <div className="bg-slate-900 rounded-3xl p-10 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Not sure what you can afford?</h3>
            <p className="text-slate-300">Estimate your monthly payment with our mortgage calculator before you start touring homes.</p>
          </div>
          <Link
            href="/mortgages"
            className="inline-flex items-center gap-2 bg-white hover:bg-[#2ec440] hover:text-white text-slate-900 font-bold px-8 py-3.5 rounded-xl transition-colors whitespace-nowrap"
          >
            Calculate my mortgage
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
          </Link>
        </div>
      </section>


    </div>
  );
}
