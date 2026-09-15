"use client";

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SparkRenderer, SplatMesh, SplatFileType } from '@sparkjsdev/spark';

interface SplatViewerProps {
  /** Same-origin (or Vercel Blob) URL of our own stored .spz file — see
   *  src/lib/tours/assetPipeline.ts. Never a raw World Labs URL. */
  spzUrl: string;
  className?: string;
}

// Generous — a full-resolution splat file can be tens of MB (a real one
// generated in this app came to ~28MB), and decoding it client-side takes
// real time on top of the download. New tours default to a lighter tier
// (see pickPrimarySpzSourceUrl in assetPipeline.ts) so this should rarely
// be needed in practice going forward.
const LOAD_TIMEOUT_MS = 90_000;

/**
 * The real interactive 3D tour: renders our own stored Gaussian-splat
 * (.spz) file with Spark (https://sparkjs.dev — the same three.js-based
 * renderer World Labs' own site uses), so a buyer can orbit/pan/zoom
 * through the actual generated environment. Pannellum (PanoramaViewer)
 * stays as a lighter-weight 360° preview/fallback — see
 * PropertyTourSection, which prefers this whenever spzUrl is available.
 */
export default function SplatViewer(props: SplatViewerProps) {
  return <SplatViewerContent key={props.spzUrl} {...props} />;
}

function SplatViewerContent({ spzUrl, className = '' }: SplatViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let animationRunning = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 1000);
    camera.position.set(0, 0, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const spark = new SparkRenderer({ renderer });
    scene.add(spark);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 0.1;
    controls.maxDistance = 50;

    // onLoad clears this on success, so reaching here means loading never
    // actually finished (clearTimeout is not called anywhere else).
    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      cancelled = true;
      setStatus('error');
    }, LOAD_TIMEOUT_MS);

    let splatMesh: SplatMesh | null = null;
    try {
      splatMesh = new SplatMesh({
        url: spzUrl,
        // Our stored URL is /api/tours/asset?propertyId=...&file=world.spz —
        // the .spz only shows up in the query string, not the URL's actual
        // path, so Spark's own path-extension sniffing can't detect the
        // format from the URL alone. Telling it explicitly avoids relying
        // on that (or on content-sniffing, which may not run at all).
        fileName: 'world.spz',
        fileType: SplatFileType.SPZ,
        onLoad: () => {
          if (cancelled) return;
          window.clearTimeout(timeoutId);
          setStatus('ready');
        },
        onProgress: (event) => {
          if (cancelled || !event.total) return;
          setProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      scene.add(splatMesh);
    } catch {
      window.clearTimeout(timeoutId);
      // Report the external viewer's initialization failure after this effect completes.
      queueMicrotask(() => { if (!cancelled) setStatus('error'); });
    }

    const resize = () => {
      if (!container) return;
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    renderer.setAnimationLoop(() => {
      if (!animationRunning) return;
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      cancelled = true;
      animationRunning = false;
      window.clearTimeout(timeoutId);
      resizeObserver.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      splatMesh?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [spzUrl]);

  return (
    <div className={className}>
      {/* Own positioning context, separate from `className` above — that
       *  prop is always the caller's own positioning (e.g. "absolute
       *  inset-0" to fill a parent panel), so putting `relative` directly
       *  on the same element produced conflicting position classes and the
       *  canvas/overlays below never actually filled the parent. */}
      <div className="relative w-full h-full">
        <div ref={containerRef} className="absolute inset-0" />

        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 pointer-events-none gap-3">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {progress > 0 && <span className="text-xs font-semibold text-slate-300">{progress}%</span>}
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-400 text-sm px-6 text-center">
            Couldn&apos;t load the 3D world.
          </div>
        )}
      </div>
    </div>
  );
}
