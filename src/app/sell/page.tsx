"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function SellPage() {
  const [address, setAddress] = useState('');
  const [valuationSubmitted, setValuationSubmitted] = useState(false);

  const handleValuationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (address.trim()) {
      setValuationSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-40 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-40">
          <Image 
            src="https://images.unsplash.com/photo-1605230521018-61f2095a762a?q=80&w=2000&auto=format&fit=crop"
            alt="Luxury Home"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 sm:px-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-xs uppercase tracking-wide mb-8">
            Sell with HuzaEstate
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">Sell your home faster, <span className="text-[#2ec440]">for more.</span></h1>
          <p className="text-xl text-slate-200 max-w-2xl mx-auto mb-12 font-medium">Join the thousands of owners who trust HuzaEstate's elite agent network to sell their properties at peak market value.</p>
          
          {/* Valuation Lead Gen Box */}
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 shadow-2xl text-left">
            {valuationSubmitted ? (
              <div className="flex items-start gap-4 py-2">
                <div className="w-10 h-10 rounded-full bg-[#2ec440]/10 flex items-center justify-center text-[#2ec440] flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Valuation on its way</h3>
                  <p className="text-slate-500 text-sm">We&apos;re preparing a free valuation report for <span className="font-semibold text-slate-700">{address}</span> and will email it within 24 hours.</p>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-900 mb-2">What is your home worth?</h3>
                <p className="text-slate-500 text-sm mb-6">Enter your address to receive a free, data-driven home valuation in minutes.</p>

                <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleValuationSubmit}>
                  <div className="flex-grow flex items-center px-4 border border-slate-200 rounded-xl bg-slate-50 focus-within:ring-2 focus-within:ring-[#2ec440]/20 focus-within:border-[#2ec440] transition-colors">
                    <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your property address"
                      className="w-full bg-transparent border-none focus:outline-none text-slate-900 py-3.5 text-sm font-medium placeholder:font-normal"
                      required
                    />
                  </div>
                  <button type="submit" className="w-full sm:w-auto bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 px-8 rounded-xl transition-colors whitespace-nowrap">
                    Get Valuation
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-20 border-b border-slate-100 relative z-10 -mt-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100 bg-white rounded-3xl shadow-xl border border-slate-100 p-10">
            <div>
              <div className="text-4xl font-black text-slate-900 mb-1">$450M+</div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Property Sold</div>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900 mb-1">14</div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Days on Market</div>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900 mb-1">98%</div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">List to Sale Price</div>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900 mb-1">12k+</div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Active Buyers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">How it works</h2>
            <p className="text-lg text-slate-500">Selling your home shouldn't be stressful. Our agents handle the marketing, negotiations, and paperwork so you can focus on your next chapter.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-12 left-24 right-24 h-0.5 bg-slate-200 -z-10"></div>
            
            {/* Step 1 */}
            <div className="text-center relative bg-slate-50">
              <div className="w-24 h-24 mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                <span className="text-3xl font-black text-[#2ec440]">1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Valuation & Prep</h3>
              <p className="text-slate-500">We analyze market data to price your home perfectly, and dispatch our professional photography team (including 3D tours).</p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center relative bg-slate-50">
              <div className="w-24 h-24 mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                <span className="text-3xl font-black text-[#2ec440]">2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Market Launch</h3>
              <p className="text-slate-500">Your property goes live on our platform and is instantly matched with thousands of pre-approved buyers looking in your area.</p>
            </div>

            {/* Step 3 */}
            <div className="text-center relative bg-slate-50">
              <div className="w-24 h-24 mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                <span className="text-3xl font-black text-[#2ec440]">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Closing</h3>
              <p className="text-slate-500">Our agents fiercely negotiate the best offers on your behalf and guide you through a seamless, digital closing process.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-6">Ready to make a move?</h2>
          <p className="text-xl text-slate-500 mb-10">Apply to become a HuzaEstate seller and get access to your dedicated listing dashboard.</p>
          <Link href="/become-a-seller" className="inline-block bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-4 px-10 rounded-xl transition-colors shadow-lg">
            Apply to Become a Seller
          </Link>
        </div>
      </section>
    </div>
  );
}
