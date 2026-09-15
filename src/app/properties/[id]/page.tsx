"use client";

import React, { use, useRef, useState } from 'react';
import Link from 'next/link';
import { useAllProperties } from '@/lib/sellerListings/hooks';
import { getGalleryImages } from '@/lib/properties/gallery';
import ListingVisibilityGate from '@/components/ListingVisibilityGate';
import PropertyTourSection from '@/components/PropertyTourSection';
import PropertyGallery from '@/components/PropertyGallery';

/** Poster + a large, unmistakable play button until clicked — native video controls only
 *  appear once playing. Fixes two problems with a bare <video controls poster>: (1) a
 *  paused video with just small native controls reads as "a photo with some odd overlay",
 *  not obviously "click to play"; (2) forcing max-h with w-full on a <video> whose native
 *  aspect ratio doesn't match the container letterboxes it with large black bars — this
 *  instead fixes a 16:9 frame and crops to fill it, like every other cover image here does. */
function PropertyVideoCover({ videoUrl, title }: { videoUrl: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        controls={playing}
        playsInline
        preload="metadata"
        aria-label={`Video walkthrough of ${title}`}
        className="w-full h-full object-cover"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        Your browser does not support video playback. <a href={videoUrl}>Download the video</a>.
      </video>
      {!playing && (
        <button
          type="button"
          onClick={() => videoRef.current?.play()}
          aria-label="Play property video"
          className="group absolute inset-0 flex items-center justify-center bg-black/25 transition-colors hover:bg-black/35"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/95 shadow-xl transition-transform group-hover:scale-110">
            <svg className="ml-1 h-8 w-8 text-slate-900" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          </span>
          <span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Property video
          </span>
        </button>
      )}
    </div>
  );
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const properties = useAllProperties();
  const property = properties.find(p => p.id === id);

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Property not found</h1>
        <p className="text-slate-500">This listing may have been removed or the link is incorrect.</p>
        <Link href="/properties" className="font-bold text-[#2ec440] hover:text-[#28b039] transition-colors">Browse all properties</Link>
      </div>
    );
  }

  return (
    <ListingVisibilityGate propertyId={property.id} propertyTitle={property.title}>
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

      {/* Cover media — the video leads when one was uploaded (matches how most listing
       *  sites feature video first), with the photo gallery always available right after. */}
      {property.videoUrl && (
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 md:px-12 mb-6">
          <PropertyVideoCover videoUrl={property.videoUrl} title={property.title} />
        </div>
      )}

      {/* Photo Gallery */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 md:px-12">
        <PropertyGallery
          images={getGalleryImages(property)}
          title={property.title}
          badge={`For ${property.type}`}
        />
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

          {/* AI-Generated 3D Tour (World Labs Marble) */}
          <PropertyTourSection propertyId={property.id} imageUrl={property.imageUrl} virtualTourUrl={property.virtualTourUrl} />

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
    </ListingVisibilityGate>
  );
}
