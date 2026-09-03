"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Dialog from "./Dialog";
import type { ProcessVideoData } from "@/lib/videos";

function PlayIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86a1 1 0 00-1.5.86z" />
    </svg>
  );
}

function VideoFallback({ video }: { video: ProcessVideoData }) {
  return (
    <div className="absolute inset-0">
      <Image src={video.poster} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
      <div className="absolute inset-0 bg-slate-900/55 flex flex-col items-center justify-center gap-3 text-center px-6">
        <span className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-xl">
          <PlayIcon className="w-5 h-5 text-slate-400 ml-0.5" />
        </span>
        <div>
          <p className="text-white font-semibold text-sm">{video.title}</p>
          <p className="text-slate-300 text-xs mt-1">Demo video coming soon</p>
        </div>
      </div>
    </div>
  );
}

interface ProcessVideoCardProps {
  video: ProcessVideoData;
  autoplayPreview?: boolean;
  className?: string;
  aspectClassName?: string;
}

/**
 * Poster/preview card. Selecting it (mouse or keyboard) opens the full video
 * modal. When `autoplayPreview` is set, a muted/looping/playsInline preview
 * plays while the card is in view; if the source can't load, it falls back
 * to a poster image with a "Demo video coming soon" notice instead of a
 * broken video element.
 */
export function ProcessVideoCard({ video, autoplayPreview = false, className = "", aspectClassName = "aspect-video" }: ProcessVideoCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!autoplayPreview) return;
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // Autoplay can be rejected by the browser; the poster stays visible.
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoplayPreview]);

  const showLivePreview = autoplayPreview && !previewError;

  return (
    <div ref={containerRef} className={`relative w-full ${aspectClassName} rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 ${className}`}>
      {showLivePreview ? (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            loop
            playsInline
            preload="metadata"
            poster={video.poster}
            onError={() => setPreviewError(true)}
            onLoadedData={() => setPreviewReady(true)}
          >
            <source src={video.src} type="video/mp4" />
          </video>
          {!previewReady && (
            <div className="absolute inset-0 bg-slate-200 animate-pulse" aria-hidden="true" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" aria-hidden="true" />
        </>
      ) : (
        <VideoFallback video={video} />
      )}

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Play video: ${video.title}`}
        className="absolute inset-0 flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2ec440]/50 group"
      >
        {showLivePreview && (
          <span className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-200">
            <PlayIcon className="w-5 h-5 text-slate-900 ml-0.5" />
          </span>
        )}
      </button>

      {video.duration && (
        <span className="absolute bottom-3 right-3 bg-slate-900/70 text-white text-xs font-semibold px-2.5 py-1 rounded-lg pointer-events-none">
          {video.duration}
        </span>
      )}

      <VideoModal video={video} open={modalOpen} onClose={() => setModalOpen(false)} titleId={titleId} descId={descId} />
    </div>
  );
}

interface VideoModalProps {
  video: ProcessVideoData;
  open: boolean;
  onClose: () => void;
  titleId?: string;
  descId?: string;
}

/**
 * Full video modal used both by ProcessVideoCard and by standalone
 * "Watch Full Demo" buttons. Native controls only; the video never starts
 * playing until the modal itself is opened.
 */
export function VideoModal({ video, open, onClose, titleId, descId }: VideoModalProps) {
  const [videoError, setVideoError] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  const generatedTitleId = useId();
  const generatedDescId = useId();
  const resolvedTitleId = titleId ?? generatedTitleId;
  const resolvedDescId = descId ?? generatedDescId;

  // Reset transient state when the modal transitions from closed to open,
  // so a previous viewing's error/transcript state never leaks into the next.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setVideoError(false);
      setShowTranscript(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} labelledBy={resolvedTitleId} describedBy={resolvedDescId} panelClassName="max-w-3xl">
      <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100">
        <h2 id={resolvedTitleId} className="text-xl font-bold text-slate-900">
          {video.title}
        </h2>
        <button
          type="button"
          data-dialog-close
          onClick={onClose}
          aria-label="Close video"
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ec440]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6">
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900">
          {!videoError ? (
            <video
              key={video.src}
              className="w-full h-full"
              controls
              poster={video.poster}
              preload="metadata"
              onError={() => setVideoError(true)}
              aria-label={video.title}
            >
              <source src={video.src} type="video/mp4" />
              Your browser does not support embedded video.
            </video>
          ) : (
            <VideoFallback video={video} />
          )}
        </div>

        <p id={resolvedDescId} className="text-slate-600 text-[15px] leading-relaxed mt-5">
          {video.description}
        </p>

        {video.transcript && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowTranscript((v) => !v)}
              aria-expanded={showTranscript}
              className="text-sm font-bold text-[#2ec440] hover:text-[#28b039] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ec440] rounded"
            >
              {showTranscript ? "Hide transcript" : "Show transcript"}
            </button>
            {showTranscript && (
              <p className="mt-3 text-sm text-slate-500 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                {video.transcript}
              </p>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
