import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function RentPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-40 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-40">
          <Image 
            src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2000&auto=format&fit=crop"
            alt="Luxury Apartment"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">Rent luxury. <span className="text-[#2ec440]">Live simply.</span></h1>
          <p className="text-xl text-slate-200 max-w-2xl mx-auto mb-12 font-medium">Discover premium apartments and homes for rent with verified landlords and zero hassle.</p>
          
          {/* Search Bar */}
          <div className="max-w-3xl mx-auto bg-white rounded-2xl p-2 sm:p-3 flex flex-col sm:flex-row items-center gap-3 shadow-2xl">
            <div className="flex-grow flex items-center px-4 w-full sm:w-auto">
              <svg className="w-6 h-6 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input 
                type="text" 
                placeholder="Search by neighborhood, city, or zip code"
                className="w-full bg-transparent border-none focus:outline-none text-slate-900 text-lg py-2 font-medium placeholder:font-normal"
              />
            </div>
            <Link href="/properties?type=rent" className="w-full sm:w-auto bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-4 px-10 rounded-xl transition-colors whitespace-nowrap">
              Search Rentals
            </Link>
          </div>
        </div>
      </section>

      {/* Curated Categories */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-24 -mt-20 relative z-10">
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Category 1 */}
          <Link href="/properties?type=rent" className="group relative h-80 rounded-3xl overflow-hidden bg-slate-900 shadow-xl">
            <Image 
              src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop"
              alt="Studio Apartments"
              fill
              className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8">
              <h3 className="text-2xl font-bold text-white mb-2">Studio Apartments</h3>
              <p className="text-slate-300 font-medium">Perfect for young professionals in the city center.</p>
            </div>
          </Link>

          {/* Category 2 */}
          <Link href="/properties?type=rent" className="group relative h-80 rounded-3xl overflow-hidden bg-slate-900 shadow-xl md:-translate-y-8">
            <Image 
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop"
              alt="Shared Homes"
              fill
              className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8">
              <h3 className="text-2xl font-bold text-white mb-2">Serviced Homes</h3>
              <p className="text-slate-300 font-medium">Fully furnished with cleaning and maintenance included.</p>
            </div>
          </Link>

          {/* Category 3 */}
          <Link href="/properties?type=rent" className="group relative h-80 rounded-3xl overflow-hidden bg-slate-900 shadow-xl">
            <Image 
              src="https://images.unsplash.com/photo-1600607687931-cebf5f4bb59b?q=80&w=800&auto=format&fit=crop"
              alt="Short Term"
              fill
              className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8">
              <h3 className="text-2xl font-bold text-white mb-2">Short Term Stays</h3>
              <p className="text-slate-300 font-medium">Flexible leases for digital nomads and expats.</p>
            </div>
          </Link>

        </div>
      </section>

      {/* Value Prop */}
      <section className="bg-slate-50 py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative h-[600px] rounded-3xl overflow-hidden shadow-2xl">
              <Image 
                src="https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=1000&auto=format&fit=crop"
                alt="Happy Renter"
                fill
                className="object-cover"
              />
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2ec440]/10 text-[#2ec440] font-semibold text-xs uppercase tracking-wide mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Secure Leasing
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-6 leading-tight">Renting has never been this easy.</h2>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">Say goodbye to sketchy listings and uncommunicative landlords. We vet every rental property and handle the paperwork digitally so you can move in faster.</p>
              
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-8 h-8 rounded-full bg-[#2ec440]/10 flex items-center justify-center text-[#2ec440]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  Digital lease signing and deposit payments.
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-8 h-8 rounded-full bg-[#2ec440]/10 flex items-center justify-center text-[#2ec440]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  Verified landlords with zero history of disputes.
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-8 h-8 rounded-full bg-[#2ec440]/10 flex items-center justify-center text-[#2ec440]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  24/7 renter support through our concierge team.
                </li>
              </ul>
              
              <Link href="/properties?type=rent" className="inline-flex items-center gap-2 font-bold text-slate-900 hover:text-[#2ec440] transition-colors group">
                Browse rental listings
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
