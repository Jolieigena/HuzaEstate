"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import PricingCards from '@/components/postingPlans/PricingCards';

export default function SellPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Landing Page Split Hero */}
      {/* Kept compact so the plans below are visible without scrolling. */}
      <section className="relative pt-8 pb-10 md:pt-10 md:pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">

            {/* Left: Copy */}
            <div className="max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2ec440]/10 text-[#2ec440] font-bold text-xs uppercase tracking-wide mb-5">
                HuzaEstate Seller Network
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-5 leading-[1.1]">
                Sell/Rent your property <br className="hidden sm:block" /> faster, <span className="text-[#2ec440]">for more</span>
              </h1>
              <p className="text-slate-500 text-base sm:text-lg leading-relaxed">
                Join thousands of owners who trust our elite network to seamlessly list, market, and sell their properties at peak market value.
              </p>
            </div>

            {/* Right: Visual */}
            <div className="relative w-full max-w-lg mx-auto md:max-w-none md:ml-auto">
              <div className="aspect-[16/10] max-h-[320px] w-full rounded-[2rem] overflow-hidden shadow-2xl relative z-10 border-4 border-white">
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
                  <div className="text-lg sm:text-xl font-bold text-slate-900">98%</div>
                  <div className="text-[11px] sm:text-xs font-semibold text-slate-500">List to Sale Price</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="py-10 sm:py-12 bg-slate-50 border-t border-slate-100 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">Choose your selling plan</h2>
            <p className="text-base text-slate-500">Start free, or subscribe to post more and get priority placement.</p>
          </div>

          <PricingCards
            onSelect={(tier) => {
              router.push(`/become-a-seller?plan=${tier}`);
            }}
          />
        </div>
      </section>
    </div>
  );
}
