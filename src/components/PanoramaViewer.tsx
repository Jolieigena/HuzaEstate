"use client";

import { useEffect, useId, useRef, useState } from 'react';
import { loadPannellum } from '@/lib/pannellumLoader';

interface PanoramaViewerProps {
  /** Same-origin URL of the cached panorama (see /api/tours/panorama). */
  panoUrl: string;
  className?: string;
}

/** Embedded, click-and-drag 360° look-around viewer for a property's
 *  panorama — served from our own domain via panoUrl, rendered with a
 *  self-hosted copy of Pannellum (no CDN dependency, see pannellumLoader). */
export default function PanoramaViewer({ panoUrl, className = '' }: PanoramaViewerProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const elementId = `pano-${rawId}`;
  const viewerRef = useRef<{ destroy: () => void } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    loadPannellum()
      .then((pannellum) => {
        if (cancelled) return;
        viewerRef.current = pannellum.viewer(elementId, {
          type: 'equirectangular',
          panorama: panoUrl,
          autoLoad: true,
          showZoomCtrl: true,
          compass: false,
        });
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementId, panoUrl]);

  if (status === 'error') {
    return (
      <div className={`flex items-center justify-center bg-slate-900 text-slate-400 text-sm ${className}`}>
        Couldn&apos;t load the 360° view.
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div id={elementId} className="absolute inset-0" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 pointer-events-none">
          <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
    </div>
  );
}
