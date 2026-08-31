import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function PostPropertyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative pt-28 pb-20 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="https://images.unsplash.com/photo--kpThV2nkhM?q=80&w=2000&auto=format&fit=crop"
            alt="List your property"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 sm:px-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-xs uppercase tracking-wide mb-6">
            List your property
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
            Reach thousands of buyers and renters across Rwanda.
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto font-medium">
            Fill in a few details below and our team will verify your listing and get it live on HuzaEstate.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-3xl mx-auto px-6 sm:px-10 py-16 sm:py-20">
        <form className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-5">Property details</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Property Title</label>
                <input
                  type="text"
                  placeholder="e.g. Luxury Villa with Pool in Nyarutarama"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Listing Type</label>
                <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900" required defaultValue="">
                  <option value="" disabled>Select type</option>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Property Type</label>
                <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900" required defaultValue="">
                  <option value="" disabled>Select type</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="land">Land</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Price (USD)</label>
                <input
                  type="number"
                  placeholder="e.g. 350000"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">City / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Nyarutarama, Kigali"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Bedrooms</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 4"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Bathrooms</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 3"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Size (sqm)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 450"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea
                  rows={5}
                  placeholder="Tell buyers or renters what makes this property special..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-5">Contact information</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Phone or Email</label>
                <input
                  type="text"
                  placeholder="+250 7XX XXX XXX or you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-4 rounded-xl transition-colors shadow-lg">
            Submit Listing for Review
          </button>

          <p className="text-center text-slate-500 text-sm">
            Every submission is verified by our team before going live. Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#2ec440] hover:text-[#28b039] transition-colors">Sign in</Link> to manage listings from your dashboard.
          </p>
        </form>
      </section>
    </div>
  );
}
