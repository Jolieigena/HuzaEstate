"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState('listings');

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        
        {/* Dashboard Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">Landlord Mode</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Rental Manager</h1>
            <p className="text-slate-500 font-medium">Manage your listings, screen tenants, and collect rent.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-slate-900 hover:bg-[#2ec440] text-white font-semibold py-2.5 px-6 rounded-xl transition-colors shadow-sm text-sm">
              + Add Property
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="flex flex-col gap-2 sticky top-28">
              <button 
                onClick={() => setActiveTab('listings')}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'listings' ? 'bg-blue-600/10 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  My Listings
                </div>
                <span className="bg-white text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm border border-slate-100">3</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('applications')}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'applications' ? 'bg-blue-600/10 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Applications
                </div>
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">12</span>
              </button>

              <button 
                onClick={() => setActiveTab('payments')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'payments' ? 'bg-blue-600/10 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Payments
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-grow">
            
            {/* LISTINGS TAB */}
            {activeTab === 'listings' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Active Listings</h2>
                
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="py-4 px-6 font-semibold text-sm text-slate-500">Property</th>
                          <th className="py-4 px-6 font-semibold text-sm text-slate-500">Status</th>
                          <th className="py-4 px-6 font-semibold text-sm text-slate-500">Views</th>
                          <th className="py-4 px-6 font-semibold text-sm text-slate-500">Saves</th>
                          <th className="py-4 px-6 font-semibold text-sm text-slate-500">Leads</th>
                          <th className="py-4 px-6 font-semibold text-sm text-slate-500 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Listing 1 */}
                        <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0">
                                <Image src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=200&auto=format&fit=crop" alt="Property" fill className="object-cover" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">Modern City Apartment</div>
                                <div className="text-xs text-slate-500">$1,200/mo</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-md">Active</span>
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-700">1,240</td>
                          <td className="py-4 px-6 font-semibold text-slate-700">84</td>
                          <td className="py-4 px-6 font-bold text-blue-600">12</td>
                          <td className="py-4 px-6 text-right">
                            <button className="text-slate-400 hover:text-slate-900 font-semibold text-sm transition-colors">Edit</button>
                          </td>
                        </tr>

                        {/* Listing 2 */}
                        <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0">
                                <Image src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=200&auto=format&fit=crop" alt="Property" fill className="object-cover" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">Luxury Villa with Pool</div>
                                <div className="text-xs text-slate-500">$3,500/mo</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-md">Pending</span>
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-700">3,420</td>
                          <td className="py-4 px-6 font-semibold text-slate-700">215</td>
                          <td className="py-4 px-6 font-bold text-blue-600">8</td>
                          <td className="py-4 px-6 text-right">
                            <button className="text-slate-400 hover:text-slate-900 font-semibold text-sm transition-colors">Edit</button>
                          </td>
                        </tr>
                        
                        {/* Listing 3 */}
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0 opacity-50 grayscale">
                                <Image src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=200&auto=format&fit=crop" alt="Property" fill className="object-cover" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-slate-400">Eco-Friendly Home</div>
                                <div className="text-xs text-slate-400">$850/mo</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2.5 py-1 rounded-md">Leased</span>
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-400">940</td>
                          <td className="py-4 px-6 font-semibold text-slate-400">42</td>
                          <td className="py-4 px-6 font-bold text-slate-400">0</td>
                          <td className="py-4 px-6 text-right">
                            <button className="text-slate-400 hover:text-slate-900 font-semibold text-sm transition-colors">Relist</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* APPLICATIONS TAB */}
            {activeTab === 'applications' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Tenant Screening</h2>
                  <select className="bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option>Modern City Apartment</option>
                    <option>Luxury Villa with Pool</option>
                  </select>
                </div>
                
                {/* Kanban Board */}
                <div className="grid md:grid-cols-3 gap-6 overflow-x-auto pb-4">
                  
                  {/* Column: New */}
                  <div className="bg-slate-100 rounded-2xl p-4 min-w-[280px]">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <h3 className="font-bold text-slate-700">New (2)</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      {/* Card */}
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="font-bold text-slate-900">Michael Smith</div>
                          <span className="text-xs font-bold text-slate-500">2h ago</span>
                        </div>
                        <div className="text-xs text-slate-600 mb-1">Income: <span className="font-semibold text-green-600">$85k/yr</span></div>
                        <div className="text-xs text-slate-600 mb-3">Credit: <span className="font-semibold">720</span></div>
                        <div className="flex gap-2">
                          <button className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold py-1.5 rounded-lg text-xs transition-colors">Screen</button>
                        </div>
                      </div>
                      
                      {/* Card */}
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="font-bold text-slate-900">Sarah Johnson</div>
                          <span className="text-xs font-bold text-slate-500">1d ago</span>
                        </div>
                        <div className="text-xs text-slate-600 mb-1">Income: <span className="font-semibold text-green-600">$110k/yr</span></div>
                        <div className="text-xs text-slate-600 mb-3">Credit: <span className="font-semibold">780</span></div>
                        <div className="flex gap-2">
                          <button className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold py-1.5 rounded-lg text-xs transition-colors">Screen</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column: Screening */}
                  <div className="bg-slate-100 rounded-2xl p-4 min-w-[280px]">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <h3 className="font-bold text-slate-700">Screening (1)</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      {/* Card */}
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 border-l-4 border-l-yellow-400 cursor-pointer">
                        <div className="flex justify-between items-start mb-3">
                          <div className="font-bold text-slate-900">David & Emma</div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded mb-3">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Awaiting background check
                        </div>
                        <div className="text-xs text-slate-600">Income: <span className="font-semibold text-green-600">$140k/yr</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Column: Approved */}
                  <div className="bg-slate-100 rounded-2xl p-4 min-w-[280px]">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <h3 className="font-bold text-slate-700">Approved (1)</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      {/* Card */}
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 border-l-4 border-l-[#2ec440] cursor-pointer">
                        <div className="flex justify-between items-start mb-3">
                          <div className="font-bold text-slate-900">Alex Thompson</div>
                        </div>
                        <div className="text-xs text-slate-600 mb-1">Income: <span className="font-semibold text-green-600">$95k/yr</span></div>
                        <div className="text-xs text-slate-600 mb-4">Credit: <span className="font-semibold text-green-600">810</span></div>
                        <button className="w-full bg-[#2ec440] hover:bg-[#28b039] text-white font-semibold py-2 rounded-lg text-xs transition-colors shadow-sm">
                          Send Lease Agreement
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
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Financial Overview</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="text-sm font-semibold text-slate-500 mb-1">Total Collected</div>
                    <div className="text-2xl font-black text-slate-900">$4,700</div>
                    <div className="text-xs font-bold text-[#2ec440] mt-2">↑ +8% this month</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="text-sm font-semibold text-slate-500 mb-1">Outstanding</div>
                    <div className="text-2xl font-black text-red-500">$1,200</div>
                    <div className="text-xs font-bold text-red-500 mt-2">1 tenant late</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm md:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-semibold text-slate-500">Next Payout</div>
                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded">Nov 1st</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-2">$3,500</div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900">Recent Transactions</h3>
                    <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">Download CSV</button>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">✓</div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Rent Payment - Apt 4B</div>
                          <div className="text-xs text-slate-500">Jane Doe • Today</div>
                        </div>
                      </div>
                      <div className="font-black text-slate-900">+$1,200</div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">✓</div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Security Deposit - Villa</div>
                          <div className="text-xs text-slate-500">Alex Thompson • Yesterday</div>
                        </div>
                      </div>
                      <div className="font-black text-slate-900">+$3,500</div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-red-100 bg-red-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">!</div>
                        <div>
                          <div className="font-bold text-red-900 text-sm">Overdue Rent - Eco Home</div>
                          <div className="text-xs text-red-600">Mark Smith • 3 days late</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button className="text-xs font-bold text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-red-50">Send Reminder</button>
                        <div className="font-black text-red-600">-$850</div>
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
