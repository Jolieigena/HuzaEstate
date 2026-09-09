"use client";

import Link from 'next/link';
import { useTourForProperty } from '@/lib/tours/hooks';

interface TourWatchBadgeProps {
  propertyId: string;
  className?: string;
}

/**
 * Small "3D Tour" pill shown anywhere a property is previewed (grid cards,
 * map popups) so a buyer can see at a glance that a tour is ready. Links to
 * the property's own detail page (where the tour is embedded — see
 * PropertyTourSection/PanoramaViewer) rather than out to World Labs
 * directly, keeping the buyer on HuzaEstate. Renders nothing until a tour
 * exists and is actually ready to view — pending/failed/no-tour all render
 * null, matching PropertyTourSection's buyer-facing behavior.
 */
export default function TourWatchBadge({ propertyId, className = '' }: TourWatchBadgeProps) {
  const tour = useTourForProperty(propertyId);

  if (!tour || tour.status !== 'ready') return null;

  return (
    <Link
      href={`/properties/${propertyId}#tour`}
      onClick={(e) => e.stopPropagation()}
      title="Watch the 3D tour"
      className={`inline-flex items-center gap-1.5 bg-slate-900/80 hover:bg-[#2ec440] backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1.5 rounded-lg border border-white/20 shadow-sm transition-colors ${className}`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
      3D Tour
    </Link>
  );
}
