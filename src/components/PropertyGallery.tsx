"use client";

import { useState } from 'react';
import Image from '@/components/PropertyImage';
import Dialog from './Dialog';

interface PropertyGalleryProps {
  images: string[];
  title: string;
  badge?: string;
}

export default function PropertyGallery({ images, title, badge }: PropertyGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images.length) return null;

  const extras = images.slice(1, 5);
  const extraCount = images.length - 5;

  const showPrev = () => setLightboxIndex((i) => (i === null ? 0 : (i - 1 + images.length) % images.length));
  const showNext = () => setLightboxIndex((i) => (i === null ? 0 : (i + 1) % images.length));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[400px] md:h-[500px] rounded-3xl overflow-hidden relative">
        {/* Main Big Image */}
        <div
          className={`relative h-full w-full group cursor-pointer ${images.length > 1 ? 'md:col-span-2' : 'md:col-span-4'}`}
          onClick={() => setLightboxIndex(0)}
        >
          <Image
            src={images[0]}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
          {badge && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-slate-900 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-sm z-10">
              {badge}
            </div>
          )}
        </div>

        {/* Up to 4 more thumbnails */}
        {extras.length > 0 && (
          <div className="hidden md:grid grid-cols-2 grid-rows-2 col-span-2 gap-2 h-full">
            {extras.map((src, i) => {
              const isLast = i === extras.length - 1;
              return (
                <div key={i} className="relative h-full w-full group cursor-pointer" onClick={() => setLightboxIndex(i + 1)}>
                  <Image
                    src={src}
                    alt={`${title} photo ${i + 2}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>

                  {isLast && extraCount > 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
                      +{extraCount} more
                    </div>
                  )}

                  {isLast && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(0);
                      }}
                      className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 font-bold px-4 py-2 rounded-xl text-sm shadow-md transition-all flex items-center gap-2 border border-slate-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                      Show all photos
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        labelledBy="property-gallery-lightbox-title"
        panelClassName="max-w-5xl w-full p-4 sm:p-6 bg-slate-950!"
      >
        {lightboxIndex !== null && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 id="property-gallery-lightbox-title" className="text-white font-bold text-sm">
                {lightboxIndex + 1} / {images.length}
              </h2>
              <button onClick={() => setLightboxIndex(null)} data-dialog-close className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30" aria-label="Close">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="relative w-full aspect-[4/3] sm:aspect-video rounded-2xl overflow-hidden bg-black">
              <Image src={images[lightboxIndex]} alt={`${title} photo ${lightboxIndex + 1}`} fill sizes="90vw" className="object-contain" />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrev}
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === lightboxIndex ? 'border-[#2ec440]' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image src={src} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}
