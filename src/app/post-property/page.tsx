"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/shared/RequireAuth';
import ApplyGate from '@/components/manager/ApplyGate';
import PostingPaywall from '@/components/postingPlans/PostingPaywall';
import { useAuth } from '@/lib/auth-context';
import CategorizedPhotoUpload from '@/components/CategorizedPhotoUpload';
import { deriveImageFields, type CategorizedPhoto } from '@/lib/photoCategories';
import { uploadMedia } from '@/lib/media/upload';
import { AMENITY_OPTIONS, type Property } from '@/lib/properties/types';
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY } from '@/lib/countries';
import { PropertyOverridesStoreEngine } from '@/lib/propertyOverrides/store';
import { notifyPropertiesChanged } from '@/lib/sellerListings/hooks';

const SUPPORTED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop';
const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || 'http://localhost:8081/api/property-service';

function PostPropertyForm() {
  const router = useRouter();
  const { token, isApprovedSeller } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);

  const [title, setTitle] = useState('');
  const [listingType, setListingType] = useState<'' | Property['type']>('');
  const [propertyType, setPropertyType] = useState<'' | Property['propertyType']>('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY.name);
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [sqm, setSqm] = useState('');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<CategorizedPhoto[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  if (!isApprovedSeller) {
    return <ApplyGate />;
  }

  // No pre-emptive quota check here any more — property-service is the authoritative check
  // (it calls payment-service's quota/consume immediately before creating the listing) and
  // returns 403 if the account is over its monthly cap, which handleSubmit below catches and
  // switches to the paywall instead of trying to predict the answer client-side.
  if (showPaywall) {
    return <PostingPaywall onClose={() => setShowPaywall(false)} />;
  }

  const toggleAmenity = (label: string) => {
    setAmenities((prev) => (prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label]));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!listingType || !propertyType || submitting || uploadingPhotos) return;

    setError('');
    setSubmitting(true);

    // The single "City / Location" input (e.g. "Nyarutarama, Kigali") carries both the
    // neighborhood and the city — split it here rather than asking for two form fields.
    const [neighborhood, ...cityParts] = location.split(',');
    const city = cityParts.length ? cityParts.join(',').trim() : neighborhood.trim();
    const { imageUrl, galleryImages } = deriveImageFields(photos, FALLBACK_IMAGE);

    try {
      let videoUrl: string | undefined;
      if (videoFile) {
        if (!SUPPORTED_VIDEO_TYPES.has(videoFile.type)) {
          setError('Video must be MP4, WebM, or MOV.');
          setSubmitting(false);
          return;
        }
        videoUrl = await uploadMedia(videoFile, videoFile.type, token);
      }

      const res = await fetch(`${PROPERTY_API_URL}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          description: description || `A ${propertyType} listed in ${location}.`,
          price: Number(price) || 0,
          currency: listingType === 'rent' ? 'USD/month' : 'USD',
          location: neighborhood.trim(),
          city,
          bedrooms: Number(bedrooms) || 0,
          bathrooms: Number(bathrooms) || 0,
          sqm: Number(sqm) || 0,
          imageUrl,
          galleryImages,
          photos,
          type: listingType,
          propertyType,
          videoUrl,
          country,
          amenities,
        }),
      });
      if (!res.ok) {
        if (res.status === 403) {
          // property-service's own quota check (via payment-service) rejected this post —
          // switch to the paywall instead of showing it as a generic form error.
          setShowPaywall(true);
          setSubmitting(false);
          return;
        }
        const data = await res.json().catch(() => null);
        setError(data?.message || 'Could not publish your listing. Please try again.');
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      // country is now a real backend field (see property-service's model); amenities isn't
      // yet, so this override still carries just that one frontend-only field — the same
      // mechanism EditPropertyModal.tsx uses for frontend-only edits layered on top of
      // backend-sourced properties.
      PropertyOverridesStoreEngine.set(data.property.id, { amenities });
      notifyPropertiesChanged();
      router.push(`/properties/${data.property.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the server. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Form */}
      <section className="max-w-3xl mx-auto px-6 sm:px-10 pt-32 pb-20">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">List your property</h1>
          <p className="text-slate-500">Fill in the details below and your listing will go live immediately.</p>
        </div>
        {error && (
          <p className="mb-6 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3">
            {error}
          </p>
        )}
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-5">Property details</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Property Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Luxury Villa with Pool in Nyarutarama"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Listing Type</label>
                <select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value as Property['type'])}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900"
                  required
                >
                  <option value="" disabled>Select type</option>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as Property['propertyType'])}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900"
                  required
                >
                  <option value="" disabled>Select type</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="land">Land</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Price (USD)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 350000"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">City / Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Nyarutarama, Kigali"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900"
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Property Photos</label>
                <CategorizedPhotoUpload photos={photos} onChange={setPhotos} onUploadingChange={setUploadingPhotos} disabled={submitting} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Property Video (Optional)</label>
                <div className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#2ec440]/10 text-[#2ec440] rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  </div>
                  <div className="flex-grow min-w-0">
                    <input 
                      type="file" 
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2ec440]/10 file:text-[#2ec440] hover:file:bg-[#2ec440]/20 transition-colors" 
                    />
                    {videoFile && <p className="text-xs text-slate-500 mt-2 truncate">Selected: {videoFile.name}</p>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Bedrooms</label>
                <input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  min="0"
                  placeholder="e.g. 4"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Bathrooms</label>
                <input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  min="0"
                  placeholder="e.g. 3"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Size (sqm)</label>
                <input
                  type="number"
                  value={sqm}
                  onChange={(e) => setSqm(e.target.value)}
                  min="0"
                  placeholder="e.g. 450"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Tell buyers or renters what makes this property special..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors resize-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Amenities</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border border-slate-200 rounded-xl">
                  {AMENITY_OPTIONS.map((label) => (
                    <label key={label} className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                      <input type="checkbox" checked={amenities.includes(label)} onChange={() => toggleAmenity(label)} className="accent-[#2ec440] w-4 h-4 cursor-pointer" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting || uploadingPhotos} className="w-full bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-4 rounded-xl transition-colors shadow-lg disabled:opacity-60">
            {submitting ? 'Publishing…' : uploadingPhotos ? 'Uploading photos…' : 'Publish Listing'}
          </button>

          <p className="text-center text-slate-500 text-sm">
            Your listing goes live immediately and appears in your{' '}
            <Link href="/manager" className="font-bold text-[#2ec440] hover:text-[#28b039] transition-colors">Manager Portal</Link>.
          </p>
        </form>
      </section>
    </div>
  );
}

export default function PostPropertyPage() {
  return (
    <RequireAuth>
      <PostPropertyForm />
    </RequireAuth>
  );
}
