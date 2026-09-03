"use client";

import { useCallback, useId, useRef, useState } from "react";
import Image from "next/image";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  className?: string;
}

/**
 * Accessible before/after comparison. Drag or touch the handle, or focus it
 * and use the arrow/Home/End keys. Uses clip-path rather than resizing the
 * image element, so nothing shifts or triggers page scroll while dragging.
 * A stacked <noscript> fallback covers the no-JS case.
 */
export default function BeforeAfterSlider({ beforeSrc, afterSrc, beforeAlt, afterAlt, className = "" }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const labelId = useId();

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updateFromClientX(e.clientX);
  };
  const stopDragging = () => {
    draggingRef.current = false;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPosition((p) => Math.max(0, p - 5));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPosition((p) => Math.min(100, p + 5));
    } else if (e.key === "Home") {
      e.preventDefault();
      setPosition(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setPosition(100);
    }
  };

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden border border-slate-200 shadow-sm select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerLeave={stopDragging}
        onPointerCancel={stopDragging}
      >
        <Image src={afterSrc} alt={afterAlt} fill className="object-cover pointer-events-none" sizes="(max-width: 768px) 100vw, 50vw" />

        <div className="absolute inset-0 pointer-events-none" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <Image src={beforeSrc} alt={beforeAlt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>

        <span className="absolute top-4 left-4 bg-slate-900/70 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg pointer-events-none">
          Before
        </span>
        <span className="absolute top-4 right-4 bg-[#2ec440] text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg pointer-events-none">
          After
        </span>

        <div className="absolute inset-y-0 w-0.5 bg-white pointer-events-none" style={{ left: `${position}%` }} aria-hidden="true" />

        <div
          role="slider"
          tabIndex={0}
          aria-label="Comparison position between before and after"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          aria-labelledby={labelId}
          onKeyDown={handleKeyDown}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-xl border border-slate-200 flex items-center justify-center cursor-ew-resize focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2ec440]/50"
          style={{ left: `${position}%` }}
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l-4 4 4 4m8-12l4 4-4 4" />
          </svg>
        </div>
      </div>
      <span id={labelId} className="sr-only">
        Drag the handle, or focus it and use the arrow keys, to compare the existing space with the renovation concept
      </span>

      <noscript>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Before</p>
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200">
              <Image src={beforeSrc} alt={beforeAlt} fill className="object-cover" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">After</p>
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200">
              <Image src={afterSrc} alt={afterAlt} fill className="object-cover" />
            </div>
          </div>
        </div>
      </noscript>
    </div>
  );
}
