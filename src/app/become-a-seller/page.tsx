"use client";

import React, { useState } from 'react';
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 py-24 px-4 sm:px-6">
      <div className="w-full max-w-[500px]">
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
  );
}
