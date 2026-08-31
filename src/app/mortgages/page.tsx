"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function MortgagesPage() {
  const [homePrice, setHomePrice] = useState<number>(150000);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(16); // High interest rates typical in some African markets, adjust as needed
  const [loanTerm, setLoanTerm] = useState<number>(20); // 20 years

  // Calculations
  const downPayment = (homePrice * downPaymentPct) / 100;
  const principal = homePrice - downPayment;
  const monthlyInterestRate = interestRate / 100 / 12;
  const numberOfPayments = loanTerm * 12;
  
  const monthlyPayment = principal > 0 
    ? (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)
    : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-30">
          <Image 
            src="https://images.unsplash.com/photo-1694771170304-42b0b9b8d80d?q=80&w=2000&auto=format&fit=crop"
            alt="Mortgage Consultation"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#2ec440] font-semibold text-xs uppercase tracking-wide mb-8">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            HuzaEstate Financing
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Finance your dream home.</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">We partner with Rwanda's top banks to secure the best mortgage rates for you. Calculate your payments and get pre-approved today.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-white hover:bg-[#2ec440] text-slate-900 hover:text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg">
              Get Pre-Approved
            </button>
            <a href="#calculator" className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-xl transition-all backdrop-blur-sm border border-white/20">
              Calculate Payments
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section id="calculator" className="max-w-7xl mx-auto px-6 sm:px-10 py-24">
        <div className="grid lg:grid-cols-12 gap-16">
          
          {/* Calculator Form */}
          <div className="lg:col-span-7">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Mortgage Calculator</h2>
            <p className="text-slate-500 mb-10">Estimate your monthly payments based on the property price and your down payment.</p>

            <div className="space-y-8 bg-slate-50 p-8 rounded-2xl border border-slate-100">
              
              {/* Home Price */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">Home Price</label>
                  <span className="text-sm font-semibold text-slate-900">${homePrice.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min="50000" max="1000000" step="5000" 
                  value={homePrice} 
                  onChange={(e) => setHomePrice(Number(e.target.value))}
                  className="w-full accent-[#2ec440] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Down Payment */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">Down Payment ({downPaymentPct}%)</label>
                  <span className="text-sm font-semibold text-slate-900">${downPayment.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" step="1" 
                  value={downPaymentPct} 
                  onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                  className="w-full accent-[#2ec440] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                {/* Interest Rate */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Interest Rate (%)</label>
                  <input 
                    type="number" 
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                  />
                </div>
                {/* Loan Term */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Loan Term (Years)</label>
                  <select 
                    value={loanTerm}
                    onChange={(e) => setLoanTerm(Number(e.target.value))}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors bg-white"
                  >
                    <option value={10}>10 Years</option>
                    <option value={15}>15 Years</option>
                    <option value={20}>20 Years</option>
                    <option value={30}>30 Years</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Results Summary */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 rounded-2xl p-8 lg:p-10 text-white sticky top-28 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-300 mb-6">Estimated Monthly Payment</h3>
              
              <div className="text-4xl font-bold text-[#2ec440] mb-8">
                ${Math.round(monthlyPayment).toLocaleString()} <span className="text-lg font-medium text-slate-400">/mo</span>
              </div>

              <div className="space-y-4 mb-8 text-sm">
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-slate-400">Principal & Interest</span>
                  <span className="font-semibold">${Math.round(monthlyPayment).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-slate-400">Property Tax (Est.)</span>
                  <span className="font-semibold">${Math.round(homePrice * 0.01 / 12).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-slate-400">Home Insurance (Est.)</span>
                  <span className="font-semibold">$50</span>
                </div>
              </div>

              <button className="w-full bg-white hover:bg-[#2ec440] text-slate-900 hover:text-white font-semibold py-3.5 rounded-xl transition-colors mb-4">
                Apply for this Loan
              </button>
              <p className="text-xs text-slate-500 text-center">
                * This is an estimate. Actual rates and payments may vary based on your credit score and bank policies.
              </p>
            </div>
          </div>

        </div>
      </section>
      
      {/* Info Section */}
      <section className="bg-slate-50 py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Why get a mortgage through us?</h2>
            <p className="text-slate-500">We streamline the home buying process by connecting you directly with trusted lenders, getting you approved faster and at better rates.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-[#2ec440]/10 rounded-xl flex items-center justify-center text-[#2ec440] mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Fast Pre-approval</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Know exactly how much you can afford within 24 hours. Stand out to sellers as a serious buyer.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-[#2ec440]/10 rounded-xl flex items-center justify-center text-[#2ec440] mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Trusted Partners</h3>
              <p className="text-sm text-slate-500 leading-relaxed">We work exclusively with Rwanda's top-tier banks to ensure your financing is secure and reliable.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-[#2ec440]/10 rounded-xl flex items-center justify-center text-[#2ec440] mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Competitive Rates</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Benefit from our volume and relationships to negotiate better interest rates than walking into a branch.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
