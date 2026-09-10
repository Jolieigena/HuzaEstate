"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useTourForProperty } from '@/lib/tours/hooks';
import { TourService } from '@/lib/tours/tourService';
import type { Property } from '@/lib/data';

interface SellerTourControlProps {
  property: Property;
}

// Seller/developer-facing control — generating a 3D tour costs real money
// per call to World Labs, so only this side (listing management) can kick
// one off. Buyers only ever see PropertyTourSection, which is view-only.
export default function SellerTourControl({ property }: SellerTourControlProps) {
  const tour = useTourForProperty(property.id);
  const [starting, setStarting] = useState(false);

  const handleGenerate = async () => {
    setStarting(true);
    try {
      await TourService.requestTour(property);
    } finally {
      setStarting(false);
    }
  };

  if (!tour || tour.status === 'failed') {
    return (
      <button
        onClick={handleGenerate}
        disabled={starting}
        title={tour?.status === 'failed' ? tour.error : undefined}
        className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-60 whitespace-nowrap"
      >
        {starting ? 'Starting…' : tour?.status === 'failed' ? 'Retry Tour' : '+ Generate Tour'}
      </button>
    );
  }

  if (tour.status === 'pending') {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 whitespace-nowrap">
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {tour.phase === 'downloading_assets' ? 'Saving…' : 'Generating…'}
        </span>
        <button
          onClick={() => TourService.cancelTour(property.id)}
          className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors whitespace-nowrap"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Links to the property's own tour section (embedded panorama, self-hosted
  // by us — see PropertyTourSection/PanoramaViewer) rather than straight to
  // World Labs: their world_marble_url page requires the browser to be
  // logged into the exact account tied to WORLD_LABS_API_KEY, so a seller
  // opening it in their normal browser hits a permission wall even for a
  // tour they just generated. Viewing through our own embed sidesteps that
  // entirely.
  return (
    <Link
      href={`/properties/${property.id}#tour`}
      target="_blank"
      className="text-xs font-bold text-[#2ec440] hover:text-[#28b039] transition-colors whitespace-nowrap inline-flex items-center gap-1"
    >
      View Tour
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
    </Link>
  );
}
