"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import PricingCards from '@/components/postingPlans/PricingCards';

export default function SellPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Kept compact so the plans below are visible without scrolling. */}
      <section className="pt-8 pb-10 md:pt-10 md:pb-12">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 text-center">
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
          <p className="mt-6 text-center text-sm text-slate-500">
            Got an access code?{' '}
            <button type="button" onClick={() => router.push('/become-a-seller?redeem=1')} className="font-bold text-[#2ec440] hover:underline">
              Use it here
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
