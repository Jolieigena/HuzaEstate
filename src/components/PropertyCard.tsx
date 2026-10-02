"use client";

import React from 'react';
import Image from '@/components/PropertyImage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Property } from '@/lib/properties/types';
import { getGalleryImages } from '@/lib/properties/gallery';
import TourWatchBadge from '@/components/TourWatchBadge';
import { useIsFavorite, useToggleFavorite } from '@/lib/favorites/hooks';
import { useToast } from '@/lib/toast-context';
import { isPromotedNow } from '@/lib/promotion/types';

interface PropertyCardProps {
  property: Property;
  isFeatured?: boolean;
}

const listedDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

// A promoted listing has earned real traction once it's drawn this many inquiries — below this
// it's still just "Featured" (the baseline every paid promotion gets), at or above it the badge
// upgrades to "Popular" since that's now a true, earned signal rather than a paid-placement one.
const POPULAR_INQUIRY_THRESHOLD = 5;

export default function PropertyCard({ property, isFeatured }: PropertyCardProps) {
  const isSaved = useIsFavorite(property.id);
  const { showToast } = useToast();
  const router = useRouter();
  const listedDate = property.createdAt ? new Date(property.createdAt) : null;
  const listedLabel = listedDate && !Number.isNaN(listedDate.getTime()) ? listedDateFormatter.format(listedDate) : null;
  const promoted = isPromotedNow(property);
  const isFurnished = property.amenities?.some((a) => a.toLowerCase() === 'furnished') ?? false;
  // Real inquiry activity from property-service, not a fabricated urgency counter. Shown
  // unconditionally on every promoted listing (even "0" on a brand new one) — it's the eyeball
  // count, and also what decides whether the badge below reads "Featured" or "Popular".
  const interestCount = property.inquiryCount ?? 0;
  const isPopular = promoted && interestCount >= POPULAR_INQUIRY_THRESHOLD;
  const galleryImageCount = getGalleryImages(property).length;

  const toggleFavorite = useToggleFavorite();

  async function toggleSaved() {
    const result = await toggleFavorite(property.id);
    if (result === 'signin') showToast('Sign in to save homes to your account.', 'error');
    else if (!result.ok) showToast(result.error, 'error');
    else showToast(result.saved ? 'Saved to your favorites' : 'Removed from favorites', 'success');
  }

  // The cover image already links to the detail page; this lets the rest of
  // the card (title, specs footer, etc.) do the same without nesting a
  // second <a> inside it — invalid HTML that breaks hydration. Clicks on an
  // actual control inside the card (save, map, 3D tour) are left alone so
  // they keep doing their own thing instead of also navigating away.
  function handleCardClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('a, button')) return;
    router.push(`/properties/${property.id}`);
  }

  // A corner badge alone gets lost once a grid has several cards on screen —
  // the whole card gets an accent border, a warm tint and a heavier resting
  // shadow instead, the same "make the whole tile stand out, not just a
  // label" treatment Amazon's Sponsored tiles, Zillow Showcase and Kijiji's
  // Featured ads all use for paid placement.
  return (
    <div
      onClick={handleCardClick}
      className={`rounded-[1.75rem] p-2 sm:p-2.5 pb-4 transition-shadow duration-300 cursor-pointer ${
        promoted
          ? 'bg-gradient-to-b from-amber-50/60 to-white border border-amber-200 shadow-md hover:shadow-2xl'
          : 'bg-white border border-gray-100 hover:shadow-xl'
      }`}
    >
      <div className="relative w-full h-[180px] sm:h-[200px] rounded-2xl overflow-visible mb-3 group">
        {/* Cover media — the only anchor in this block, so overlay badges below
         *  stay as plain positioned siblings rather than nested <a>s. When a video
         *  was uploaded, the cover IS that <video>, showing its own first frame
         *  (preload="metadata", no poster override) — not an unrelated uploaded
         *  photo standing in for it. */}
        <Link href={`/properties/${property.id}`} className="absolute inset-0 block rounded-2xl overflow-hidden">
          {property.videoUrl ? (
            <video
              src={property.videoUrl}
              muted
              playsInline
              preload="metadata"
              aria-label={`Video walkthrough of ${property.title}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <Image
              src={property.imageUrl}
              alt={property.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          )}
          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
          {property.videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-lg">
                <svg className="ml-0.5 h-5 w-5 text-slate-900" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </div>
          )}
        </Link>

        {/* Top Left Badge — every promoted listing (see lib/promotion) gets "Featured" as its
         *  baseline; it only upgrades to "Popular" once real inquiry activity crosses
         *  POPULAR_INQUIRY_THRESHOLD, so "Popular" stays an earned signal rather than something
         *  every paid placement claims from day one. The page-level `isFeatured` flag gets the
         *  same slate "Featured" badge for a non-promoted listing. */}
        {isPopular ? (
          <div className="absolute top-3 left-3 z-10 bg-amber-500/85 border border-white/20 rounded-xl px-2.5 py-1 flex items-center gap-1.5 text-white text-[12px] font-semibold shadow-sm shadow-black/10 pointer-events-none uppercase tracking-wide">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M11.983 1.907a1 1 0 00-1.966 0l-.867 4.63-4.144-2.39a1 1 0 00-1.348 1.348l2.39 4.144-4.63.867a1 1 0 000 1.966l4.63.867-2.39 4.144a1 1 0 001.348 1.348l4.144-2.39.867 4.63a1 1 0 001.966 0l.867-4.63 4.144 2.39a1 1 0 001.348-1.348l-2.39-4.144 4.63-.867a1 1 0 000-1.966l-4.63-.867 2.39-4.144a1 1 0 00-1.348-1.348l-4.144 2.39-.867-4.63z"></path></svg>
            Popular
          </div>
        ) : (promoted || isFeatured) && (
          <div className="absolute top-3 left-3 z-10 bg-slate-900/50 backdrop-blur-md border border-white/20 rounded-xl px-2.5 py-1 flex items-center gap-1.5 text-white text-[12px] font-semibold shadow-sm shadow-black/10 pointer-events-none uppercase tracking-wide">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            Featured
          </div>
        )}

        {/* Top Right: photo count — only worth showing once there's more than one photo to
         *  count; a single-image listing gets no badge at all, same treatment TourWatchBadge
         *  below gets when there's no tour. */}
        {galleryImageCount > 1 && (
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl px-2.5 py-1 flex items-center gap-1.5 text-white text-sm font-semibold border border-white/30 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {galleryImageCount}
            </div>
          </div>
        )}

        {/* Bottom Left: "Watch the 3D Tour" — only rendered once a tour is ready */}
        <TourWatchBadge propertyId={property.id} className="absolute bottom-3 left-3 z-10" />

        {/* Bottom Right: brokerage logo — only ever set for an "agent"-type seller who's added
         *  one (see access-service's User.companyLogoUrl, denormalized onto the listing at post
         *  time), Zillow-style listing-card branding. */}
        {property.companyLogoUrl && (
          <div className="absolute bottom-3 right-3 z-10 h-9 w-9 rounded-lg bg-white/95 shadow-sm border border-white/40 flex items-center justify-center overflow-hidden pointer-events-none" title={property.companyName}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={property.companyLogoUrl} alt={property.companyName ?? ""} className="h-full w-full object-contain p-1" />
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="px-2 pt-2 flex flex-col gap-1">
        {/* Top Row: Price, Title & Actions */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-1 flex-col min-w-0">
            {/* Price and Status Pill */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                ${property.price.toLocaleString()}
              </span>
              {property.type === 'rent' && <span className="text-slate-500 text-sm font-medium -ml-1">/mo</span>}
              <span className="px-2 py-0.5 rounded-md bg-[#2ec440]/10 text-[#2ec440] text-[11px] font-bold tracking-wide whitespace-nowrap ml-1">
                For {property.type}
              </span>
              {isFurnished && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/5 text-slate-700 text-[11px] font-bold tracking-wide whitespace-nowrap">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 5h18v6a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" /></svg>
                  Furnished
                </span>
              )}
            </div>

            {/* Title & Location */}
            <h3 className="text-[15px] font-bold text-slate-800 leading-snug truncate">
              {property.title}
            </h3>
            <p className="text-[14px] text-slate-500 leading-snug truncate mt-0.5">
              {property.location}, {property.city}
            </p>
          </div>

          {/* Action Buttons, with the listed date underneath — set off from the icons by its
           *  own margin above rather than sitting flush against them. */}
          <div className="flex flex-col items-end gap-1.5 shrink-0 pt-1">
            <div className="flex items-center gap-1.5">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.location}, ${property.city}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-[#2ec440]/10 hover:text-[#2ec440] hover:border-[#2ec440] transition-all"
                title="View on Map"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
              </a>
              <button
                onClick={toggleSaved}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isSaved ? 'bg-red-50 border-red-200 text-red-500' : 'border-slate-200 text-slate-400 hover:bg-[#2ec440]/10 hover:text-[#2ec440] hover:border-[#2ec440]'}`}
                title={isSaved ? 'Remove from saved' : 'Save Property'}
                aria-pressed={isSaved}
              >
                <svg className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              </button>
            </div>
            {listedLabel && (
              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap" title={`Listed ${listedLabel}`}>
                Listed {listedLabel}
              </span>
            )}
          </div>
        </div>

        {/* Specs Footer */}
        <div className="flex items-center gap-4 text-[14px] mt-3 pt-3 border-t border-slate-100 text-slate-600 font-medium">
          <div className="flex items-center gap-1.5 shrink-0">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span><strong className="text-slate-900">{property.bedrooms}</strong> bed</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300 shrink-0"></div>
          <div className="flex items-center gap-1.5 shrink-0">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            <span><strong className="text-slate-900">{property.bathrooms}</strong> bath</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300 shrink-0"></div>
          <div className="flex items-center gap-1.5 shrink-0">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
            <span><strong className="text-slate-900">{property.sqm}</strong> sqm</span>
          </div>
          {promoted && (
            // Eyeball/interest count — unconditional on every promoted listing, even "0" on a
            // brand new one, placed in the card body rather than as an image-overlay badge.
            <span className="ml-auto flex items-center gap-1 text-[12px] font-semibold text-slate-500 shrink-0" title="People who have inquired about this property">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {interestCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
