"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PricingCards from '@/components/postingPlans/PricingCards';
import { SUPPLIER_CATEGORIES } from '@/lib/suppliers/api';

export default function SellPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Kept compact so the plans below are visible without scrolling. */}
      <section className="pt-8 pb-10 md:pt-10 md:pb-12">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-5 leading-[1.1]">
            Sell/Rent your property <br className="hidden sm:block" /> faster, <span className="text-[#2ec440]">for more</span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg leading-relaxed">
            List your property, reach buyers across Rwanda and choose the plan that fits.
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

      {/* For suppliers and manufacturers: open a shop */}
      <section className="px-6 py-12 sm:px-10 sm:py-16">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-slate-900 px-6 py-10 text-white sm:px-12 sm:py-14">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#2ec440]/25 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#2ec440]/10 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-black leading-[1.05] tracking-tight sm:text-5xl">
                You make it.<br />
                You supply it.<br />
                <span className="text-[#2ec440]">Sell it here.</span>
              </h2>
              <p className="mt-5 max-w-xl text-base text-slate-300 sm:text-lg">
                Open your own shop on HuzaEstate and put your furniture and home products in front of people who are building, renovating and furnishing homes.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/open-a-shop" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#2ec440] px-7 font-bold text-white shadow-lg transition-colors hover:bg-[#28b039]">
                  Open your shop
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link href="/shop" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-7 font-bold text-white transition-colors hover:bg-white/10">
                  See the shop
                </Link>
              </div>
            </div>

            <div>
              <ol className="space-y-4">
                {['Open your shop', 'Add your products and prices', 'Get orders and get paid'].map((step, index) => (
                  <li key={step} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2ec440] text-sm font-black text-white">{index + 1}</span>
                    <span className="font-bold">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex flex-wrap gap-2">
                {SUPPLIER_CATEGORIES.slice(0, 6).map((name) => (
                  <span key={name} className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-slate-300">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
