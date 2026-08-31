"use client";

import React, { useState } from 'react';
import Image from 'next/image';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [phone, setPhone] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^0-9+\s]/g, '').slice(0, 16);
    setPhone(sanitized);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side: Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="https://images.unsplash.com/photo-1694771170485-e01443be2643?q=80&w=1200&auto=format&fit=crop"
          alt="HuzaEstate Office"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">We&apos;re here to help.</h2>
          <p className="text-slate-300 text-lg">Whether you&apos;re buying, renting, or selling, our local team can answer your questions.</p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-[440px]">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#2ec440]/10 flex items-center justify-center text-[#2ec440] mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-2">Message sent</h1>
              <p className="text-slate-500">Thanks for reaching out — a HuzaEstate team member will get back to you within 24 hours.</p>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-black text-slate-900 mb-2">Get in touch</h1>
              <p className="text-slate-500 mb-8">Send us a message and we&apos;ll respond as soon as we can.</p>

              <form className="space-y-5" onSubmit={handleSubmit}>
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                  <textarea
                    placeholder="How can we help?"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors resize-none"
                    required
                  />
                </div>

                <button type="submit" className="w-full bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg">
                  Send Message
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
