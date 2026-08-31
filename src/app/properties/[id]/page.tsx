import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { mockProperties } from '@/lib/data';
import { notFound } from 'next/navigation';

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const property = mockProperties.find(p => p.id === resolvedParams.id);
  
  if (!property) {
    notFound();
  }

  return (
    <div className="w-full bg-white min-h-screen pb-24">
      {/* Title Section (Above Grid) */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 md:px-12 pt-8 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {property.title}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-slate-500 text-[15px] font-medium">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {property.location}, {property.city}
            </div>
          </div>
          <div className="text-left md:text-right">
            <div className="text-3xl sm:text-4xl font-black text-slate-900">
              ${property.price.toLocaleString()}
              {property.type === 'rent' && <span className="text-lg text-slate-400 font-medium ml-1">/mo</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Image Gallery */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[400px] md:h-[500px] rounded-3xl overflow-hidden relative">
          
          {/* Main Big Image (Left Half) */}
          <div className="md:col-span-2 relative h-full w-full group cursor-pointer">
            <Image 
              src={property.imageUrl} 
              alt={property.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
            
            {/* Status Badge Overlaid */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-slate-900 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider shadow-sm z-10">
              For {property.type}
            </div>
          </div>

          {/* 4 Smaller Images (Right Half) */}
          <div className="hidden md:grid grid-cols-2 grid-rows-2 col-span-2 gap-2 h-full">
            {/* Sub Image 1 */}
            <div className="relative h-full w-full group cursor-pointer">
              <Image 
                src="https://images.unsplash.com/photo-1682773083924-6f0f5a700d8b?q=80&w=800&auto=format&fit=crop" 
                alt="Property Detail 1"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
            </div>
            
            {/* Sub Image 2 */}
            <div className="relative h-full w-full group cursor-pointer">
              <Image 
                src="https://images.unsplash.com/photo-1756245994882-cf32d49fde5a?q=80&w=800&auto=format&fit=crop" 
                alt="Property Detail 2"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
            </div>

            {/* Sub Image 3 */}
            <div className="relative h-full w-full group cursor-pointer">
              <Image 
                src="https://images.unsplash.com/photo-1609507315751-216f91bc8ffb?q=80&w=800&auto=format&fit=crop" 
                alt="Property Detail 3"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
            </div>

            {/* Sub Image 4 */}
            <div className="relative h-full w-full group cursor-pointer">
              <Image 
                src="https://images.unsplash.com/photo-1682773083915-5375145f99e5?q=80&w=800&auto=format&fit=crop" 
                alt="Property Detail 4"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
              
              {/* Show All Photos Button */}
              <Link href="/signup" className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 font-bold px-4 py-2 rounded-xl text-sm shadow-md transition-all flex items-center gap-2 border border-slate-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                Show all photos
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 md:px-12 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Details */}
        <div className="lg:col-span-8">
          {/* Specs */}
          <div className="flex flex-wrap items-center gap-8 sm:gap-12 py-6 border-y border-gray-100 mb-10">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center text-slate-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{property.bedrooms}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Bedrooms</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center text-slate-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{property.bathrooms}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Bathrooms</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center text-slate-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{property.sqm}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Square Meters</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <h2 className="text-2xl font-bold text-slate-900 mb-6">About this {property.propertyType}</h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-10">
            {property.description}
          </p>

          {/* 3D Virtual Walkthrough */}
          {property.virtualTourUrl && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-[#2ec440]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                Interactive 3D Walkthrough
              </h2>
              <div className="w-full aspect-video rounded-3xl overflow-hidden shadow-lg border border-slate-200 relative">
                {/* Background Preview */}
                <div className="absolute inset-0 bg-slate-900">
                  <Image src={property.imageUrl} alt="Walkthrough Preview" fill className="object-cover opacity-50 blur-[2px]" />
                </div>
                
                {/* Gated Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 shadow-xl border border-white/20">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3 drop-shadow-md">Exclusive 3D Walkthrough</h3>
                  <p className="text-gray-200 max-w-md mb-8 text-[15px] leading-relaxed drop-shadow-sm">
                    Create a free account or sign in to unlock the immersive 3D walkthrough for this property.
                  </p>
                  <Link href="/login" className="px-8 py-3.5 bg-slate-900 hover:bg-[#2ec440] text-white font-bold rounded-xl transition-colors shadow-lg hover:-translate-y-0.5 inline-flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                    Sign In to Unlock
                  </Link>
                </div>
              </div>
            </div>
          )}

          <Link href="/properties" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18"></path></svg>
            Back to properties
          </Link>
        </div>

        {/* Right Column: Contact Info */}
        <div className="lg:col-span-4">
          <div className="bg-[#f8fafc] border border-slate-200 rounded-3xl p-8 sticky top-28">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Interested in this property?</h3>
            <p className="text-slate-500 text-[15px] mb-8 leading-relaxed">
              Contact our team at HuzaEstate to schedule a viewing or get more information.
            </p>

            <button className="w-full bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors mb-4 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Book a Tour
            </button>
            <button className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              Send us a Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
