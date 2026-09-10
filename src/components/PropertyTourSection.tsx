"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useTourForProperty } from '@/lib/tours/hooks';
import PanoramaViewer from './PanoramaViewer';
import SplatViewer from './SplatViewer';

interface PropertyTourSectionProps {
  propertyId: string;
  imageUrl: string;
}

// Buyer/renter-facing viewer only — generating a tour costs money and is a
// seller/developer action, done from their listing management screen (see
// SellerTourControl). A visitor here can only ever view a tour that already
// exists; there is no "Generate" button on this side.
export default function PropertyTourSection({ propertyId, imageUrl }: PropertyTourSectionProps) {
  const tour = useTourForProperty(propertyId);
  // The real interactive 3D world (SplatViewer) is the default whenever we
  // have one stored — Pannellum's 360° panorama is a lighter-weight
  // preview, offered as a toggle rather than the primary experience.
  const [mode, setMode] = useState<'splat' | 'pano'>('splat');

  // Nothing to show at all if the seller has never requested a tour.
  if (!tour || tour.status === 'failed') {
    return null;
  }

  const activeMode = tour.spzUrl ? mode : 'pano';

  return (
    <div id="tour" className="mb-10 scroll-mt-28">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <svg className="w-6 h-6 text-[#2ec440]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          AI-Generated 3D Tour
        </h2>

        {tour.status === 'ready' && tour.spzUrl && tour.panoUrl && (
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setMode('splat')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${mode === 'splat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Explore in 3D
            </button>
            <button
              onClick={() => setMode('pano')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${mode === 'pano' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              360° Preview
            </button>
          </div>
        )}
      </div>

      <div className="w-full aspect-video rounded-3xl overflow-hidden shadow-lg border border-slate-200 relative">
        <div className="absolute inset-0 bg-slate-900">
          <Image src={imageUrl} alt="Tour preview" fill className="object-cover opacity-50 blur-[2px]" />
        </div>

        {tour.status === 'pending' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <svg className="w-10 h-10 text-white animate-spin mb-6" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-md">
              {tour.phase === 'downloading_assets' ? 'Saving your 3D tour…' : '3D tour is being prepared'}
            </h3>
            <p className="text-gray-200 max-w-md text-[15px] leading-relaxed drop-shadow-sm">
              {tour.phase === 'downloading_assets'
                ? "World Labs finished generating — we're copying the files to HuzaEstate now."
                : "Check back shortly — this property's 3D tour is on its way."}
            </p>
          </div>
        )}

        {tour.status === 'ready' && (tour.spzUrl || tour.panoUrl) && (
          <>
            {activeMode === 'splat' && tour.spzUrl ? (
              <SplatViewer spzUrl={tour.spzUrl} className="absolute inset-0" />
            ) : tour.panoUrl ? (
              <PanoramaViewer panoUrl={tour.panoUrl} className="absolute inset-0" />
            ) : null}

            {/* World Labs' own hosted viewer — debug/fallback/comparison only.
             *  Normal viewing above already loads assets we stored ourselves,
             *  so this is a secondary, de-emphasized action, never the main CTA. */}
            {tour.viewerUrl && (
              <a
                href={tour.viewerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 z-20 px-3.5 py-2 bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 font-semibold rounded-lg text-xs shadow-sm transition-all inline-flex items-center gap-1.5 border border-slate-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                Open on World Labs
              </a>
            )}
          </>
        )}

        {tour.status === 'ready' && !tour.spzUrl && !tour.panoUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-16 h-16 bg-[#2ec440]/20 backdrop-blur-md rounded-full flex items-center justify-center mb-6 shadow-xl border border-white/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </div>
            <h3 className="text-3xl font-bold text-white mb-3 drop-shadow-md">Take a tour of this property</h3>
            {tour.providerMode === 'mock' && (
              <p className="text-gray-300 max-w-md mb-6 text-sm leading-relaxed drop-shadow-sm">
                Demo mode — this links to World Labs&apos; Marble gallery rather than a tour generated from this exact photo.
              </p>
            )}
            <a
              href={tour.viewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 bg-slate-900 hover:bg-[#2ec440] text-white font-bold rounded-xl transition-colors shadow-lg hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              Take a Tour
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
