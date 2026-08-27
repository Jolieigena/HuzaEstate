import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function BuyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-40 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-40">
          <Image 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop"
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
          <div className="max-w-3xl mx-auto bg-white rounded-2xl p-2 sm:p-3 flex flex-col sm:flex-row items-center gap-3 shadow-2xl">
            <div className="flex-grow flex items-center px-4 w-full sm:w-auto">
              <svg className="w-6 h-6 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input 
                type="text" 
                placeholder="Search by neighborhood, city, or zip code"
                className="w-full bg-transparent border-none focus:outline-none text-slate-900 text-lg py-2 font-medium placeholder:font-normal"
              />
            </div>
            <Link href="/properties" className="w-full sm:w-auto bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-4 px-10 rounded-xl transition-colors whitespace-nowrap">
              Search Homes
            </Link>
          </div>
        </div>
      </section>

      {/* Curated Categories */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-24 -mt-20 relative z-10">
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Category 1 */}
          <Link href="/properties" className="group relative h-80 rounded-3xl overflow-hidden bg-slate-900 shadow-xl">
            <Image 
              src="https://images.unsplash.com/photo-1613490908592-fd5e6f520c4c?q=80&w=800&auto=format&fit=crop"
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
          <Link href="/properties" className="group relative h-80 rounded-3xl overflow-hidden bg-slate-900 shadow-xl md:-translate-y-8">
            <Image 
              src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop"
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
          <Link href="/properties" className="group relative h-80 rounded-3xl overflow-hidden bg-slate-900 shadow-xl">
            <Image 
              src="https://images.unsplash.com/photo-1576941089067-2de3c901e126?q=80&w=800&auto=format&fit=crop"
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

      {/* Value Prop */}
      <section className="bg-slate-50 py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2ec440]/10 text-[#2ec440] font-semibold text-xs uppercase tracking-wide mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                Verified Listings
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-6 leading-tight">Buy with absolute confidence.</h2>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">Every property listed on HuzaEstate undergoes a rigorous verification process. We ensure the title is clean, the photos are accurate, and the seller is verified before you even book a tour.</p>
              
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-8 h-8 rounded-full bg-[#2ec440]/10 flex items-center justify-center text-[#2ec440]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  No hidden fees or surprise agency costs.
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-8 h-8 rounded-full bg-[#2ec440]/10 flex items-center justify-center text-[#2ec440]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  Direct access to dedicated buying agents.
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-8 h-8 rounded-full bg-[#2ec440]/10 flex items-center justify-center text-[#2ec440]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  Exclusive 3D Walkthroughs for every property.
                </li>
              </ul>
              
              <Link href="/properties" className="inline-flex items-center gap-2 font-bold text-slate-900 hover:text-[#2ec440] transition-colors group">
                Start browsing properties
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </Link>
            </div>
            
            <div className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl">
              <Image 
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop"
                alt="Happy Homeowner"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
