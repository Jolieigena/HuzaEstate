"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useTourForProperty } from '@/lib/tours/hooks';
import PanoramaViewer from './PanoramaViewer';
import SplatViewer from './SplatViewer';

interface PropertyTourSectionProps {
  propertyId: string;
  imageUrl: string;
  virtualTourUrl?: string;
}

// Buyer/renter-facing viewer only — generating a tour costs money and is a
// seller/developer action, done from their listing management screen (see
// SellerTourControl). A visitor here can only ever view a tour that already
// exists; there is no "Generate" button on this side.
export default function PropertyTourSection({ propertyId, imageUrl, virtualTourUrl }: PropertyTourSectionProps) {
  const tour = useTourForProperty(propertyId);
  const [mode, setMode] = useState<'splat' | 'pano'>('splat');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  const hasTourAssets = tour && tour.status === 'ready' && (tour.spzUrl || tour.panoUrl || (tour.scenes && tour.scenes.length > 0));
  const isGenerating = tour && tour.status === 'pending';

  if (!hasTourAssets && !isGenerating) {
    if (virtualTourUrl) {
      return (
        <div id="tour" className="mb-10 scroll-mt-28">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
            <svg className="w-6 h-6 text-[#2ec440]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            Interactive 3D Tour
          </h2>
          <div className="w-full aspect-video rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900">
            <iframe
              width="100%"
              height="100%"
              src={virtualTourUrl}
              frameBorder="0"
              allowFullScreen
              allow="xr-spatial-tracking"
            ></iframe>
          </div>
        </div>
      );
    }
    return null;
  }

  const scenes = tour?.scenes || [];
  const activeScene = scenes[activeSceneIndex] || tour; // Fallback to tour for backwards compatibility if scenes is empty but tour has data
  
  const baseSpzUrl = activeScene.spzUrl || tour.spzUrl;
  const basePanoUrl = activeScene.panoUrl || tour.panoUrl;
  
  const activeSpzUrl = baseSpzUrl ? `${baseSpzUrl}&v=${new Date(tour.updatedAt || Date.now()).getTime()}` : undefined;
  const activePanoUrl = basePanoUrl ? `${basePanoUrl}&v=${new Date(tour.updatedAt || Date.now()).getTime()}` : undefined;
  const activeViewerUrl = activeScene.viewerUrl || tour.viewerUrl;

  const activeMode = activeSpzUrl ? mode : 'pano';

  return (
    <div id="tour" className="mb-10 scroll-mt-28">
      {!isFullscreen && (
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-[#2ec440]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            AI-Generated 3D Tour
          </h2>

          {tour.status === 'ready' && activeSpzUrl && activePanoUrl && (
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
      )}

      {scenes.length > 1 && !isFullscreen && tour.status === 'ready' && (
        <div className="flex gap-2 overflow-x-auto mb-4 pb-2">
          {scenes.map((scene, idx) => (
            <button
              key={scene.id || idx}
              onClick={() => setActiveSceneIndex(idx)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg border text-sm font-semibold whitespace-nowrap transition-colors ${idx === activeSceneIndex ? 'border-[#2ec440] bg-[#2ec440]/10 text-[#2ec440]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              {scene.category ? scene.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : `Scene ${idx + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className={isFullscreen ? "fixed inset-0 z-[100] bg-black" : "w-full aspect-video rounded-3xl overflow-hidden shadow-lg border border-slate-200 relative"}>
        {!isFullscreen && (
          <div className="absolute inset-0 bg-slate-900">
            <Image src={imageUrl} alt="Tour preview" fill className="object-cover opacity-50 blur-[2px]" />
          </div>
        )}

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

        {tour.status === 'ready' && (activeSpzUrl || activePanoUrl) && (
          <>
            {isFullscreen && (
              <button 
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
                title="Exit Fullscreen"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            )}
            
            {activeMode === 'splat' && activeSpzUrl ? (
              <SplatViewer spzUrl={activeSpzUrl} className="absolute inset-0" />
            ) : activePanoUrl ? (
              <PanoramaViewer panoUrl={activePanoUrl} className="absolute inset-0" />
            ) : null}

            {scenes.length > 1 && isFullscreen && (
              <div className="absolute top-4 left-4 z-20 flex gap-2 overflow-x-auto max-w-[calc(100%-80px)]">
                {scenes.map((scene, idx) => (
                  <button
                    key={scene.id || idx}
                    onClick={() => setActiveSceneIndex(idx)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg border text-sm font-semibold whitespace-nowrap transition-colors backdrop-blur-md ${idx === activeSceneIndex ? 'border-[#2ec440] bg-[#2ec440]/80 text-white' : 'border-white/20 bg-black/50 text-white/80 hover:bg-black/70'}`}
                  >
                    {scene.category ? scene.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : `Scene ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}

            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
              {!isFullscreen && (
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="px-3.5 py-2 bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 font-semibold rounded-lg text-xs shadow-sm transition-all inline-flex items-center gap-1.5 border border-slate-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                  Fullscreen
                </button>
              )}
              {activeViewerUrl && (
                <a
                  href={activeViewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 font-semibold rounded-lg text-xs shadow-sm transition-all inline-flex items-center gap-1.5 border border-slate-200"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  Open on World Labs
                </a>
              )}
            </div>
          </>
        )}

        {tour.status === 'ready' && !activeSpzUrl && !activePanoUrl && (
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
              href={activeViewerUrl}
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
