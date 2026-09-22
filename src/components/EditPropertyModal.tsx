"use client";

import { useState } from 'react';
import Dialog from './Dialog';
import CategorizedPhotoUpload from './CategorizedPhotoUpload';
import { PropertyOverridesStoreEngine } from '@/lib/propertyOverrides/store';
import { deriveImageFields, isPhotoCategory, type CategorizedPhoto } from '@/lib/photoCategories';
import type { Property } from '@/lib/properties/types';
import { COUNTRY_OPTIONS, getPropertyCountry } from '@/lib/countries';

interface EditPropertyModalProps {
  property: Property | null;
  onClose: () => void;
}

/**
 * Edits any property — curated mock listings and seller-posted ones alike —
 * by writing a per-id patch to the propertyOverrides store rather than
 * mutating mockProperties (which is a static import and can't be mutated).
 * useAllProperties() applies these overrides everywhere a property is
 * read, so a changed title/price/image shows up on the buyer-facing pages
 * too, not just here.
 */
export default function EditPropertyModal({ property, onClose }: EditPropertyModalProps) {
  const [form, setForm] = useState(() => toFormState(property));

  // Reset local form state whenever a different property is opened.
  const [openedFor, setOpenedFor] = useState(property?.id);
  if (property && property.id !== openedFor) {
    setOpenedFor(property.id);
    setForm(toFormState(property));
  }

  if (!property) return null;

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { imageUrl, galleryImages } = deriveImageFields(form.photos, property.imageUrl);
    PropertyOverridesStoreEngine.set(property.id, {
      title: form.title,
      description: form.description,
      price: Number(form.price) || property.price,
      location: form.location,
      city: form.city,
      country: form.country,
      bedrooms: Number(form.bedrooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      sqm: Number(form.sqm) || 0,
      imageUrl,
      galleryImages,
      photos: form.photos,
      type: form.type,
      propertyType: form.propertyType,
    });
    onClose();
  };

  return (
    <Dialog open={Boolean(property)} onClose={onClose} labelledBy="edit-property-title" panelClassName="max-w-2xl p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 id="edit-property-title" className="text-xl font-bold text-slate-900">Edit Property</h2>
        <button onClick={onClose} data-dialog-close className="text-slate-400 hover:text-slate-900 transition-colors" aria-label="Close">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Property Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Listing Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Property['type'] }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900"
            >
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Property Type</label>
            <select
              value={form.propertyType}
              onChange={(e) => setForm((f) => ({ ...f, propertyType: e.target.value as Property['propertyType'] }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900"
            >
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="land">Land</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Price (USD)</label>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">City / Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Country</label>
            <select
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900"
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Property Photos</label>
          <CategorizedPhotoUpload photos={form.photos} onChange={(photos) => setForm((f) => ({ ...f, photos }))} />
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Bedrooms</label>
            <input
              type="number"
              min="0"
              value={form.bedrooms}
              onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Bathrooms</label>
            <input
              type="number"
              min="0"
              value={form.bathrooms}
              onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Size (sqm)</label>
            <input
              type="number"
              min="0"
              value={form.sqm}
              onChange={(e) => setForm((f) => ({ ...f, sqm: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="flex-1 bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg">
            Save Changes
          </button>
          <button type="button" onClick={onClose} className="px-6 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function toFormState(property: Property | null) {
  return {
    title: property?.title ?? '',
    description: property?.description ?? '',
    price: property ? String(property.price) : '',
    location: property?.location ?? '',
    city: property?.city ?? '',
    country: property ? getPropertyCountry(property).name : COUNTRY_OPTIONS[0].name,
    bedrooms: property ? String(property.bedrooms) : '',
    bathrooms: property ? String(property.bathrooms) : '',
    sqm: property ? String(property.sqm) : '',
    photos: property ? toPhotos(property) : [],
    type: (property?.type ?? 'sale') as Property['type'],
    propertyType: (property?.propertyType ?? 'house') as Property['propertyType'],
  };
}

/** Property.photos is looser than the upload form needs ({url, category?:
 *  string} — seeded data isn't guaranteed to use a category we recognize),
 *  and older/seeded properties may only have galleryImages or a single
 *  imageUrl with no photos array at all — bucket those into a starting
 *  category (first photo as the presumed exterior front shot, the rest as
 *  "Other Room") so nothing already there is lost when the form opens;
 *  the seller can freely re-sort by removing and re-adding into the right
 *  slot. */
function toPhotos(property: Property): CategorizedPhoto[] {
  if (property.photos?.length) {
    return property.photos.map((p, i) => ({
      url: p.url,
      category: p.category && isPhotoCategory(p.category) ? p.category : i === 0 ? 'exterior_front' : 'interior_other',
    }));
  }

  const fallbackImages = property.galleryImages?.length ? property.galleryImages : [property.imageUrl];
  return fallbackImages.map((url, i) => ({ url, category: i === 0 ? 'exterior_front' : 'interior_other' }));
}
