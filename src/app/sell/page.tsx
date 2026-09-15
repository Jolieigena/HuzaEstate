"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function SellPage() {

  return (
    <div className="min-h-screen bg-white">
      {/* Landing Page Split Hero */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
            
            {/* Left: Copy & CTA */}
            <div className="max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2ec440]/10 text-[#2ec440] font-bold text-xs uppercase tracking-wide mb-6">
                HuzaEstate Seller Network
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.1]">
                Sell your property <br className="hidden sm:block" /> faster, <span className="text-[#2ec440]">for more.</span>
              </h1>
              <p className="text-slate-500 text-base sm:text-lg mb-10 leading-relaxed">
                Join thousands of owners who trust our elite network to seamlessly list, market, and sell their properties at peak market value.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/become-a-seller"
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 text-base"
                >
                  Register as a Seller
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold px-6 py-3.5 rounded-xl transition-all text-base"
                >
                  See How It Works
                </a>
              </div>
            </div>
            
            {/* Right: Visual */}
            <div className="relative w-full max-w-lg mx-auto lg:max-w-none lg:ml-auto mt-8 lg:mt-0">
              <div className="aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl relative z-10 border-4 border-white">
                <Image 
                  src="/card-sell-v2.jpg" 
                  alt="Premium real estate" 
                  fill 
                  className="object-cover"
                  priority
                />
              </div>
              
              {/* Decorative blobs */}
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-[#2ec440]/20 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
              
              {/* Floating Trust Badge */}
              <div className="absolute -bottom-6 -left-6 sm:-bottom-8 sm:-left-8 bg-white p-4 sm:p-5 rounded-2xl shadow-xl border border-slate-100 z-20 flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#2ec440]/10 flex items-center justify-center text-[#2ec440] shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-black text-slate-900">98%</div>
                  <div className="text-[11px] sm:text-xs font-semibold text-slate-500">List to Sale Price</div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Trust Stats Bar */}
      <section className="border-y border-slate-100 bg-slate-50 relative z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-200/60 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">$450M+</div>
              <div className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Property Sold</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">14</div>
              <div className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Days on Market</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">12k+</div>
              <div className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Active Buyers</div>
            </div>
            <div className="hidden md:block">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">24/7</div>
              <div className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Agent Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">How it works</h2>
            <p className="text-base text-slate-500">Selling your property shouldn't be stressful. Our agents handle the marketing, negotiations, and paperwork so you can focus on your next chapter.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-12 left-24 right-24 h-0.5 bg-slate-200 -z-10"></div>
            
            {/* Step 1 */}
            <div className="text-center relative bg-slate-50 group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:shadow-md transition-shadow">
                <span className="text-2xl font-black text-[#2ec440]">1</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Valuation & Prep</h3>
              <p className="text-sm text-slate-500 px-4">We analyze market data to price your property perfectly, and dispatch our professional photography team (including 3D tours).</p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center relative bg-slate-50 group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:shadow-md transition-shadow">
                <span className="text-2xl font-black text-[#2ec440]">2</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Market Launch</h3>
              <p className="text-sm text-slate-500 px-4">Your property goes live on our platform and is instantly matched with thousands of pre-approved buyers looking in your area.</p>
            </div>

            {/* Step 3 */}
            <div className="text-center relative bg-slate-50 group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:shadow-md transition-shadow">
                <span className="text-2xl font-black text-[#2ec440]">3</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Closing</h3>
              <p className="text-sm text-slate-500 px-4">Our agents fiercely negotiate the best offers on your behalf and guide you through a seamless, digital closing process.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Pricing Section */}
      <section className="bg-slate-900 py-24 text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-xs uppercase tracking-wide mb-6">
                Clear & Transparent
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-5 tracking-tight">No hidden fees.<br/>Just better results.</h2>
              <p className="text-slate-300 text-base mb-8 leading-relaxed">
                Traditional brokerages keep you in the dark. We believe in total transparency so you know exactly what you'll net at closing before you even register.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-200">
                  <svg className="w-5 h-5 text-[#2ec440] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span className="text-sm">Free professional photography & 3D tours</span>
                </li>
                <li className="flex items-start gap-3 text-slate-200">
                  <svg className="w-5 h-5 text-[#2ec440] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span className="text-sm">Zero upfront listing costs or marketing fees</span>
                </li>
                <li className="flex items-start gap-3 text-slate-200">
                  <svg className="w-5 h-5 text-[#2ec440] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span className="text-sm">Simple flat commission only when your property sells</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl text-slate-900 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-[#2ec440]"></div>
              <h3 className="text-xl font-bold mb-2">HuzaEstate Fee</h3>
              <div className="text-5xl sm:text-6xl font-black text-[#2ec440] mb-2 tracking-tighter">2.5%</div>
              <p className="text-slate-500 text-sm font-medium mb-8">Paid at closing. Never before.</p>
              
              <Link href="/become-a-seller" className="block w-full bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-md text-base">
                Register as a Seller
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-50 py-20 border-t border-slate-200/60">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-5">Ready to make a move?</h2>
          <p className="text-base sm:text-lg text-slate-500 mb-8">Register your seller account today to unlock your dedicated listing dashboard.</p>
          <Link href="/become-a-seller" className="inline-block bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 px-8 rounded-xl transition-colors shadow-md text-base">
            Create Seller Account
          </Link>
        </div>
      </section>
    </div>
  );
}
