"use client";

import { useState } from 'react';
import { filesToCompressedDataUrls, MAX_IMAGES_PER_PROPERTY } from '@/lib/imageUpload';

interface PhotoPickerProps {
  images: string[];
  onChange: (images: string[]) => void;
  /** Optional caption shown under the grid (e.g. tour-generation hint). */
  hint?: string;
}

/**
 * Multi-photo picker used by both the "Add Property" form and the Manager
 * Portal's Edit Property modal. images[0] is always the cover photo (the
 * one used as Property.imageUrl everywhere a single thumbnail is needed);
 * reordering to front via "Make cover" changes which photo that is.
 */
export default function PhotoPicker({ images, onChange, hint }: PhotoPickerProps) {
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;

    const remainingSlots = MAX_IMAGES_PER_PROPERTY - images.length;
    if (remainingSlots <= 0) {
      setError(`You can upload up to ${MAX_IMAGES_PER_PROPERTY} photos.`);
      return;
    }

    const toProcess = files.slice(0, remainingSlots);
    setError(files.length > toProcess.length ? `Only the first ${toProcess.length} photo(s) were added — ${MAX_IMAGES_PER_PROPERTY} photo limit reached.` : '');
    setProcessing(true);
    try {
      const { dataUrls, failedCount } = await filesToCompressedDataUrls(toProcess);
      onChange([...images, ...dataUrls]);
      if (failedCount > 0) {
        setError(`${failedCount} photo(s) couldn't be read and were skipped.`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const removeAt = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const makeCover = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [chosen] = next.splice(index, 1);
    next.unshift(chosen);
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {images.map((src, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
            {/* eslint-disable-next-line @next/next/no-img-element -- locally-uploaded data: URL, not a static/known-domain asset */}
            <img src={src} alt={`Property photo ${i + 1}`} className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute top-1.5 left-1.5 bg-[#2ec440] text-white text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md">
                Cover
              </span>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => makeCover(i)}
                  className="bg-white/90 hover:bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded-md transition-colors"
                >
                  Make cover
                </button>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="bg-white/90 hover:bg-white text-red-600 text-[10px] font-bold px-2 py-1 rounded-md transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        {images.length < MAX_IMAGES_PER_PROPERTY && (
          <label className="aspect-square flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#2ec440] hover:bg-[#2ec440]/5 transition-colors cursor-pointer text-center px-2">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            <span className="text-xs font-semibold text-slate-600">
              {processing ? 'Processing…' : images.length ? 'Add more' : 'Upload photos'}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleSelect}
              disabled={processing}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      {hint && <p className="text-xs text-slate-400 mt-2">{hint}</p>}
    </div>
  );
}
