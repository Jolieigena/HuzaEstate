"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function BecomeASellerPage() {
  const router = useRouter();
  const { applyAsSeller } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^0-9+\s]/g, '').slice(0, 16);
    setPhone(sanitized);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    applyAsSeller();
    router.push('/manager');
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side: Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="https://images.unsplash.com/photo-1577971132997-c10be9372519?q=80&w=1200&auto=format&fit=crop"
          alt="List your property with HuzaEstate"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">Sell or rent out your property.</h2>
          <p className="text-slate-300 text-lg">Get approved as a HuzaEstate seller or landlord and manage every listing from one dashboard.</p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-slate-50">
        <div className="w-full max-w-[480px]">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Apply to become a seller</h1>
          <p className="text-slate-500 mb-8">Tell us a bit about yourself. Once approved, you&apos;ll get access to the Manager Portal to list and manage your properties.</p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Contact Information</h2>

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
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  inputMode="tel"
                  pattern="[0-9+\s]*"
                  maxLength={16}
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+250 xxx xxx xxx"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                  required
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-5">Listing Preferences</h2>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">I want to</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>Select an option</option>
                  <option value="sell">Sell my properties</option>
                  <option value="rent">Rent out my properties</option>
                  <option value="both">Both sell and rent out properties</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg disabled:opacity-60">
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>

            <p className="text-center text-slate-500 text-sm">
              By applying, you agree to HuzaEstate&apos;s seller terms and verification process.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
