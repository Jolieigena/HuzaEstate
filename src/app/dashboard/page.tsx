"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface PaymentRecord {
  id: string;
  label: string;
  date: string;
  amount: number;
  method: string;
}

const PAYMENT_HISTORY: PaymentRecord[] = [
  { id: 'p1', label: 'November Rent', date: 'Nov 1, 2027', amount: 1200, method: 'MTN Mobile Money' },
  { id: 'p2', label: 'October Rent', date: 'Oct 1, 2027', amount: 1200, method: 'Visa •••• 4242' },
  { id: 'p3', label: 'September Rent', date: 'Sep 1, 2027', amount: 1200, method: 'MTN Mobile Money' },
];

export default function ConsumerDashboard() {
  const [activeTab, setActiveTab] = useState('saved');

  // Rent payment state
  const [rentPaid, setRentPaid] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card'>('momo');
  const [momoProvider, setMomoProvider] = useState('MTN Mobile Money');
  const [momoPhone, setMomoPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const handleMomoPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMomoPhone(e.target.value.replace(/[^0-9+\s]/g, '').slice(0, 16));
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(digits.replace(/(.{4})/g, '$1 ').trim());
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
  };

  const handleCardCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
  };

  const handlePaySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRentPaid(true);
    setIsPaying(false);
  };

  const paymentHistory: PaymentRecord[] = rentPaid
    ? [
        {
          id: 'new',
          label: 'December Rent',
          date: 'Just now',
          amount: 1200,
          method: paymentMethod === 'momo' ? momoProvider : `Card •••• ${cardNumber.replace(/\s/g, '').slice(-4) || '••••'}`,
        },
        ...PAYMENT_HISTORY,
      ]
    : PAYMENT_HISTORY;

  const savedProperties = [
    {
      id: 1,
      title: "Luxury Villa with Pool",
      location: "Nyarutarama, Kigali",
      price: "$350,000",
      specs: "4 Beds • 4 Baths • 450 sqm",
      image: "https://images.unsplash.com/photo-1678225892688-e4a3bd3d9214?q=80&w=800&auto=format&fit=crop",
      status: "For Sale"
    },
    {
      id: 2,
      title: "Modern City Apartment",
      location: "Kiyovu, Kigali",
      price: "$1,200/mo",
      specs: "2 Beds • 2 Baths • 120 sqm",
      image: "https://images.unsplash.com/photo-1689013398652-83eb10e8e9bd?q=80&w=800&auto=format&fit=crop",
      status: "For Rent"
    },
    {
      id: 3,
      title: "Eco-Friendly Family Home",
      location: "Gacuriro, Kigali",
      price: "$280,000",
      specs: "3 Beds • 2 Baths • 320 sqm",
      image: "https://images.unsplash.com/photo-1779900275257-aaadab6d9285?q=80&w=800&auto=format&fit=crop",
      status: "For Sale"
    },
    {
      id: 4,
      title: "Penthouse with City Views",
      location: "Kimihurura, Kigali",
      price: "$2,500/mo",
      specs: "3 Beds • 3 Baths • 200 sqm",
      image: "https://images.unsplash.com/photo-1507427100689-2bf8574e32d4?q=80&w=800&auto=format&fit=crop",
      status: "For Rent"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        
        {/* Dashboard Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-black text-slate-900 mb-2">My HuzaEstate</h1>
          <p className="text-slate-500 font-medium">Manage your saved homes, tours, and applications.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="flex flex-col gap-2 sticky top-28">
              <button 
                onClick={() => setActiveTab('saved')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'saved' ? 'bg-[#2ec440]/10 text-[#2ec440]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <svg className="w-5 h-5" fill={activeTab === 'saved' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                Saved Homes
              </button>

              <button 
                onClick={() => setActiveTab('properties')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'properties' ? 'bg-[#2ec440]/10 text-[#2ec440]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                My Properties
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'payments' ? 'bg-[#2ec440]/10 text-[#2ec440]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Payments
              </button>

              <button
                onClick={() => setActiveTab('tours')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'tours' ? 'bg-[#2ec440]/10 text-[#2ec440]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                My Tours
              </button>

              <button 
                onClick={() => setActiveTab('applications')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'applications' ? 'bg-[#2ec440]/10 text-[#2ec440]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Rental Applications
              </button>

              <button 
                onClick={() => setActiveTab('coshopping')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'coshopping' ? 'bg-[#2ec440]/10 text-[#2ec440]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                Co-shopping
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-grow">
            
            {/* SAVED HOMES TAB */}
            {activeTab === 'saved' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Saved Homes</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-500">Sort by:</span>
                    <select className="bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20">
                      <option>Recently Added</option>
                      <option>Price (High to Low)</option>
                      <option>Price (Low to High)</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {savedProperties.map(property => (
                    <div key={property.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                      <div className="relative h-56 overflow-hidden">
                        <Image src={property.image} alt={property.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-slate-900">
                          {property.status}
                        </div>
                        <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white hover:scale-110 transition-all shadow-sm">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                      <div className="p-6">
                        <div className="text-2xl font-black text-slate-900 mb-1">{property.price}</div>
                        <div className="text-sm font-semibold text-slate-500 mb-3">{property.specs}</div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">{property.title}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mb-6">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path></svg>
                          {property.location}
                        </p>
                        <Link href={`/properties/${property.id}`} className="block text-center w-full bg-white border border-slate-200 hover:border-[#2ec440] hover:bg-[#2ec440]/5 hover:text-[#2ec440] text-slate-700 font-semibold py-3 rounded-xl transition-all">
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MY PROPERTIES TAB */}
            {activeTab === 'properties' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Owned & Rented Properties</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Property 1 */}
                  <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                    <div className="relative h-56 overflow-hidden">
                      <Image src="https://images.unsplash.com/photo-1720605739861-9f5110c7e529?q=80&w=800&auto=format&fit=crop" alt="Active Lease" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#2ec440]"></div>
                        Active Lease
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="text-2xl font-black text-slate-900 mb-1">$1,200/mo</div>
                      <div className="text-sm font-semibold text-slate-500 mb-3">Lease ends: Nov 30, 2027</div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">Downtown Penthouse Suite</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mb-6">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path></svg>
                        Kiyovu, Kigali
                      </p>
                      <div className="mt-auto">
                        <button onClick={() => setActiveTab('payments')} className="block text-center w-full bg-slate-900 hover:bg-[#2ec440] text-white font-semibold py-3 rounded-xl transition-all shadow-sm">
                          Manage Lease
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Property 2 */}
                  <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                    <div className="relative h-56 overflow-hidden">
                      <Image src="https://images.unsplash.com/photo-1682773083908-a0e9ffadd175?q=80&w=800&auto=format&fit=crop" alt="Owned Home" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        Owned Property
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="text-2xl font-black text-slate-900 mb-1">$450,000</div>
                      <div className="text-sm font-semibold text-slate-500 mb-3">Estimated Value</div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">Gacuriro Family Villa</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mb-6">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path></svg>
                        Gacuriro, Kigali
                      </p>
                      <div className="mt-auto">
                        <button className="block text-center w-full bg-white border border-slate-200 hover:border-[#2ec440] hover:bg-[#2ec440]/5 hover:text-[#2ec440] text-slate-700 font-semibold py-3 rounded-xl transition-all">
                          Property Dashboard
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENTS TAB */}
            {activeTab === 'payments' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Rent Payments</h2>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 mb-6">
                  {rentPaid ? (
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-[#2ec440]/10 text-[#2ec440] flex items-center justify-center flex-shrink-0">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">You&apos;re all paid up</h3>
                        <p className="text-slate-500 text-sm">Next payment of $1,200 is due Jan 1, 2028 for Downtown Penthouse Suite.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-500 mb-1">Amount Due</div>
                          <div className="text-3xl font-black text-slate-900">$1,200</div>
                          <div className="text-sm text-slate-500 mt-1">Downtown Penthouse Suite · Due Dec 1, 2027</div>
                        </div>
                        {!isPaying && (
                          <button
                            onClick={() => setIsPaying(true)}
                            className="bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-8 py-3.5 rounded-xl transition-colors shadow-lg whitespace-nowrap"
                          >
                            Pay Rent
                          </button>
                        )}
                      </div>

                      {isPaying && (
                        <form onSubmit={handlePaySubmit} className="mt-6 pt-6 border-t border-slate-100 space-y-5">
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('momo')}
                              className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-colors text-left ${
                                paymentMethod === 'momo' ? 'border-[#2ec440] bg-[#2ec440]/10 text-slate-900' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              Mobile Money
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('card')}
                              className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-colors text-left ${
                                paymentMethod === 'card' ? 'border-[#2ec440] bg-[#2ec440]/10 text-slate-900' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              Debit / Credit Card
                            </button>
                          </div>

                          {paymentMethod === 'momo' ? (
                            <>
                              <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Provider</label>
                                <select
                                  value={momoProvider}
                                  onChange={(e) => setMomoProvider(e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900"
                                >
                                  <option>MTN Mobile Money</option>
                                  <option>Airtel Money</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                                <input
                                  type="tel"
                                  inputMode="tel"
                                  pattern="[0-9+\s]*"
                                  maxLength={16}
                                  value={momoPhone}
                                  onChange={handleMomoPhoneChange}
                                  placeholder="+250 xxx xxx xxx"
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                                  required
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Card Number</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={cardNumber}
                                  onChange={handleCardNumberChange}
                                  maxLength={19}
                                  placeholder="1234 5678 9012 3456"
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-2">Expiry</label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={cardExpiry}
                                    onChange={handleCardExpiryChange}
                                    maxLength={5}
                                    placeholder="MM/YY"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-2">CVV</label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={cardCvv}
                                    onChange={handleCardCvvChange}
                                    maxLength={4}
                                    placeholder="123"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                                    required
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          <div className="flex items-center gap-3 pt-2">
                            <button type="submit" className="flex-1 bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg">
                              Pay $1,200
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsPaying(false)}
                              className="px-6 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
                  <h3 className="font-bold text-slate-900 text-lg mb-6">Payment History</h3>
                  <div className="flex flex-col gap-4">
                    {paymentHistory.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">✓</div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{item.label}</div>
                            <div className="text-xs text-slate-500">{item.method} • {item.date}</div>
                          </div>
                        </div>
                        <div className="font-black text-slate-900">${item.amount.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TOURS TAB */}
            {activeTab === 'tours' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Upcoming Tours</h2>
                
                <div className="flex flex-col gap-6">
                  {/* Tour 1 */}
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 bottom-0 left-0 w-2 bg-[#2ec440]"></div>
                    
                    <div className="text-center md:text-left min-w-[120px]">
                      <div className="text-sm font-bold text-[#2ec440] uppercase tracking-wider mb-1">Tomorrow</div>
                      <div className="text-4xl font-black text-slate-900 mb-1">10:30</div>
                      <div className="text-sm font-semibold text-slate-500">AM</div>
                    </div>
                    
                    <div className="flex-grow flex flex-col md:flex-row items-center gap-6">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden relative flex-shrink-0 shadow-md">
                        <Image src="https://images.unsplash.com/photo-1667504320745-eade6c25e053?q=80&w=400&auto=format&fit=crop" alt="Property" fill className="object-cover" />
                      </div>
                      <div className="text-center md:text-left">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Luxury Villa with Pool</h3>
                        <p className="text-sm font-medium text-slate-500 mb-3">Nyarutarama, Kigali</p>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden relative">
                             <Image src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=100&auto=format&fit=crop" alt="Agent" fill className="object-cover" />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">Meeting with Agent David</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <button className="bg-slate-900 hover:bg-[#2ec440] text-white font-semibold py-2.5 px-6 rounded-xl transition-colors whitespace-nowrap">Reschedule</button>
                      <button className="bg-white hover:bg-red-50 text-red-500 border border-slate-200 hover:border-red-200 font-semibold py-2.5 px-6 rounded-xl transition-colors whitespace-nowrap">Cancel Tour</button>
                    </div>
                  </div>

                  {/* Tour 2 */}
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 bottom-0 left-0 w-2 bg-slate-300"></div>
                    
                    <div className="text-center md:text-left min-w-[120px]">
                      <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Nov 12</div>
                      <div className="text-4xl font-black text-slate-900 mb-1">02:00</div>
                      <div className="text-sm font-semibold text-slate-500">PM</div>
                    </div>
                    
                    <div className="flex-grow flex flex-col md:flex-row items-center gap-6">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden relative flex-shrink-0 shadow-md">
                        <Image src="https://images.unsplash.com/photo-1708772565599-2c4e4b3ed9db?q=80&w=400&auto=format&fit=crop" alt="Property" fill className="object-cover" />
                      </div>
                      <div className="text-center md:text-left">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Modern City Apartment</h3>
                        <p className="text-sm font-medium text-slate-500 mb-3">Kiyovu, Kigali</p>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden relative">
                             <Image src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100&auto=format&fit=crop" alt="Agent" fill className="object-cover" />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">Meeting with Agent Sarah</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <button className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold py-2.5 px-6 rounded-xl transition-colors whitespace-nowrap">Reschedule</button>
                      <button className="bg-white hover:bg-red-50 text-red-500 border border-slate-200 hover:border-red-200 font-semibold py-2.5 px-6 rounded-xl transition-colors whitespace-nowrap">Cancel Tour</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APPLICATIONS TAB */}
            {activeTab === 'applications' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Rental Applications</h2>
                
                <div className="flex flex-col gap-6">
                  {/* Application 1 */}
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden relative shadow-md flex-shrink-0">
                          <Image src="https://images.unsplash.com/photo-6vKo_e01VYY?q=80&w=400&auto=format&fit=crop" alt="Property" fill className="object-cover" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Modern City Apartment</h3>
                          <p className="text-sm font-medium text-slate-500">Kiyovu, Kigali</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900">$1,200/mo</div>
                        <div className="text-xs font-bold text-[#2ec440] bg-[#2ec440]/10 px-2 py-1 rounded-md inline-block mt-1">Under Review</div>
                      </div>
                    </div>

                    {/* Status Bar */}
                    <div className="relative">
                      <div className="absolute top-4 left-0 w-full h-1 bg-slate-100 rounded-full -z-10"></div>
                      <div className="absolute top-4 left-0 w-1/2 h-1 bg-[#2ec440] rounded-full -z-10"></div>
                      
                      <div className="flex justify-between text-center relative z-10">
                        <div className="w-8 h-8 rounded-full bg-[#2ec440] text-white flex items-center justify-center font-bold text-sm shadow-md mx-auto mb-2">✓</div>
                        <div className="w-8 h-8 rounded-full bg-[#2ec440] text-white flex items-center justify-center font-bold text-sm shadow-md mx-auto mb-2">2</div>
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center font-bold text-sm mx-auto mb-2">3</div>
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center font-bold text-sm mx-auto mb-2">4</div>
                      </div>
                      <div className="flex justify-between text-center text-xs font-semibold text-slate-500 mt-2">
                        <div className="flex-1 text-slate-900">Submitted</div>
                        <div className="flex-1 text-slate-900">Screening</div>
                        <div className="flex-1">Landlord Review</div>
                        <div className="flex-1">Lease Sign</div>
                      </div>
                    </div>
                  </div>

                  {/* Application 2 */}
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm opacity-75 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden relative shadow-md flex-shrink-0">
                          <Image src="https://images.unsplash.com/photo-1689013398932-b576a11e07a1?q=80&w=400&auto=format&fit=crop" alt="Property" fill className="object-cover" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Downtown Penthouse Suite</h3>
                          <p className="text-sm font-medium text-slate-500">Kiyovu, Kigali</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900">$1,200/mo</div>
                        <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block mt-1">Approved</div>
                      </div>
                    </div>

                    {/* Status Bar */}
                    <div className="relative">
                      <div className="absolute top-4 left-0 w-full h-1 bg-[#2ec440] rounded-full -z-10"></div>
                      
                      <div className="flex justify-between text-center relative z-10">
                        <div className="w-8 h-8 rounded-full bg-[#2ec440] text-white flex items-center justify-center font-bold text-sm shadow-md mx-auto mb-2">✓</div>
                        <div className="w-8 h-8 rounded-full bg-[#2ec440] text-white flex items-center justify-center font-bold text-sm shadow-md mx-auto mb-2">✓</div>
                        <div className="w-8 h-8 rounded-full bg-[#2ec440] text-white flex items-center justify-center font-bold text-sm shadow-md mx-auto mb-2">✓</div>
                        <div className="w-8 h-8 rounded-full bg-[#2ec440] text-white flex items-center justify-center font-bold text-sm shadow-md mx-auto mb-2">✓</div>
                      </div>
                      <div className="flex justify-between text-center text-xs font-semibold text-slate-500 mt-2">
                        <div className="flex-1 text-slate-900">Submitted</div>
                        <div className="flex-1 text-slate-900">Screening</div>
                        <div className="flex-1 text-slate-900">Landlord Review</div>
                        <div className="flex-1 text-slate-900">Lease Sign</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CO-SHOPPING TAB */}
            {activeTab === 'coshopping' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Co-shopping</h2>
                    <p className="text-slate-500 text-sm font-medium">Invite family or friends to search, save, and vote on homes together.</p>
                  </div>
                  <button className="bg-slate-900 hover:bg-[#2ec440] text-white font-semibold py-2.5 px-6 rounded-xl transition-colors text-sm flex items-center gap-2 shadow-md">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Invite Person
                  </button>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Team Members */}
                  <div className="md:col-span-1 flex flex-col gap-4">
                    <h3 className="font-bold text-slate-900">Your Team</h3>
                    
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden relative">
                           <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" alt="User" fill className="object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Jane Doe (You)</div>
                          <div className="text-xs text-slate-500">Owner</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden relative">
                           <Image src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop" alt="User" fill className="object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Mark Doe</div>
                          <div className="text-xs text-[#2ec440] font-semibold">Joined 2 days ago</div>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-red-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  </div>

                  {/* Shared Activity */}
                  <div className="md:col-span-2">
                     <h3 className="font-bold text-slate-900 mb-4">Recent Activity</h3>
                     <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <div className="flex gap-4 mb-6">
                          <div className="w-8 h-8 rounded-full bg-[#2ec440]/10 text-[#2ec440] flex items-center justify-center flex-shrink-0 mt-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                          </div>
                          <div>
                            <p className="text-sm text-slate-900"><span className="font-bold">Mark Doe</span> favorited a new property.</p>
                            <p className="text-xs text-slate-500 mb-3">2 hours ago</p>
                            <div className="flex gap-4 p-3 border border-slate-100 rounded-xl bg-slate-50">
                              <div className="w-16 h-16 rounded-lg overflow-hidden relative flex-shrink-0">
                                <Image src="https://images.unsplash.com/photo-1708772565588-33785e13aa46?q=80&w=400&auto=format&fit=crop" alt="Property" fill className="object-cover" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm">Eco-Friendly Family Home</div>
                                <div className="text-xs font-semibold text-slate-500">$280,000</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          </div>
                          <div>
                            <p className="text-sm text-slate-900"><span className="font-bold">You</span> scheduled a tour for Luxury Villa.</p>
                            <p className="text-xs text-slate-500">Yesterday at 3:15 PM</p>
                          </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
