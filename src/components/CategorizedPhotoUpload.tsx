"use client";

import { useState } from 'react';
import { filesToCompressedDataUrls, MAX_IMAGES_PER_PROPERTY } from '@/lib/imageUpload';
import { PHOTO_CATEGORIES, type PhotoCategory, type CategorizedPhoto } from '@/lib/photoCategories';

interface CategorizedPhotoUploadProps {
  photos: CategorizedPhoto[];
  onChange: (photos: CategorizedPhoto[]) => void;
}

// Shown by themselves at first, one per group, so a seller isn't faced with
// ten empty tiles before they've uploaded a single photo. The rest of each
// group appears once both of these have a photo (see `showAll` below) —
// there's also a manual "show all" escape hatch for anyone who wants to
// jump straight to, say, the kitchen without a living room shot first.
const PRIMARY_CATEGORIES: PhotoCategory[] = ['exterior_front', 'living_room'];

/**
 * Replaces a single flat "upload some photos" picker with one upload slot
 * per specific shot — front of the house, kitchen, backyard, etc. — so a
 * tour can later be generated from multiple real angles of the exterior
 * (front/side/back carry a compass azimuth, see photoCategories.ts) instead
 * of one arbitrary cover photo, while buyers still get a properly labeled
 * gallery either way.
 */
export default function CategorizedPhotoUpload({ photos, onChange }: CategorizedPhotoUploadProps) {
  const [error, setError] = useState('');
  const [processingCategory, setProcessingCategory] = useState<PhotoCategory | null>(null);
  const [manuallyExpanded, setManuallyExpanded] = useState(false);

  const totalCount = photos.length;

  // Once revealed, categories never hide again while photos exist in them —
  // editing a property that already has, say, a kitchen photo shows the
  // full grid immediately rather than looking like that photo vanished.
  const primaryFilled = PRIMARY_CATEGORIES.every((id) => photos.some((p) => p.category === id));
  const hasNonPrimaryPhoto = photos.some((p) => !PRIMARY_CATEGORIES.includes(p.category));
  const showAll = manuallyExpanded || primaryFilled || hasNonPrimaryPhoto;

  const handleSelect = async (category: PhotoCategory, files: File[]) => {
    if (!files.length) return;

    const remainingSlots = MAX_IMAGES_PER_PROPERTY - totalCount;
    if (remainingSlots <= 0) {
      setError(`You can upload up to ${MAX_IMAGES_PER_PROPERTY} photos in total.`);
      return;
    }

    const toProcess = files.slice(0, remainingSlots);
    setError(files.length > toProcess.length ? `Only ${toProcess.length} of those were added — ${MAX_IMAGES_PER_PROPERTY} photo limit reached.` : '');
    setProcessingCategory(category);
    try {
      const { dataUrls, failedCount } = await filesToCompressedDataUrls(toProcess);
      onChange([...photos, ...dataUrls.map((url) => ({ url, category }))]);
      if (failedCount > 0) setError(`${failedCount} photo(s) couldn't be read and were skipped.`);
    } finally {
      setProcessingCategory(null);
    }
  };

  const removePhoto = (category: PhotoCategory, url: string) => {
    onChange(photos.filter((p) => !(p.category === category && p.url === url)));
  };

  const renderCategory = (category: PhotoCategory, label: string) => {
    const categoryPhotos = photos.filter((p) => p.category === category);
    const processing = processingCategory === category;

    return (
      <div key={category}>
        <div className="text-xs font-semibold text-slate-600 mb-1.5">{label}</div>
        <div className="flex flex-wrap gap-2">
          {categoryPhotos.map((photo) => (
            <div key={photo.url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
              {/* eslint-disable-next-line @next/next/no-img-element -- locally-uploaded data: URL, not a static/known-domain asset */}
              <img src={photo.url} alt={label} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(category, photo.url)}
                className="absolute inset-0 bg-black/0 group-hover:bg-black/50 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
              >
                Remove
              </button>
            </div>
          ))}

          {totalCount < MAX_IMAGES_PER_PROPERTY && (
            <label className="w-20 h-20 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 hover:border-[#2ec440] hover:bg-[#2ec440]/5 transition-colors cursor-pointer text-center px-1">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              <span className="text-[10px] font-semibold text-slate-500 leading-tight">{processing ? '…' : 'Add'}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={processing}
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = '';
                  handleSelect(category, files);
                }}
                className="sr-only"
              />
            </label>
          )}
        </div>
      </div>
    );
  };

  if (!showAll) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-slate-400">Start with these two — the rest will show up right after, including more angles for a better 3D tour.</p>
        <div className="grid grid-cols-2 gap-4">
          {PRIMARY_CATEGORIES.map((id) => renderCategory(id, PHOTO_CATEGORIES.find((c) => c.id === id)!.label))}
        </div>
        <button
          type="button"
          onClick={() => setManuallyExpanded(true)}
          className="text-xs font-bold text-[#2ec440] hover:text-[#28b039] transition-colors"
        >
          + Show all photo types
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-bold text-slate-700 mb-1">Exterior Photos</div>
        <p className="text-xs text-slate-400 mb-3">Front, side, and back views also power the 3D tour — the more angles you add, the better the generated tour.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {PHOTO_CATEGORIES.filter((c) => c.group === 'exterior').map((c) => renderCategory(c.id, c.label))}
        </div>
      </div>

      <div>
        <div className="text-sm font-bold text-slate-700 mb-3">Interior Photos</div>
        <div className="grid sm:grid-cols-2 gap-4">
          {PHOTO_CATEGORIES.filter((c) => c.group === 'interior').map((c) => renderCategory(c.id, c.label))}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
