"use client";

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import RequireAuth from '@/components/shared/RequireAuth';
import ApplyGate from '@/components/manager/ApplyGate';
import PostingPaywall from '@/components/postingPlans/PostingPaywall';
import { useAuth } from '@/lib/auth-context';
import CategorizedPhotoUpload from '@/components/CategorizedPhotoUpload';
import { deriveImageFields, type CategorizedPhoto, type PhotoCategory } from '@/lib/photoCategories';
import { uploadMedia } from '@/lib/media/upload';
import { AMENITY_OPTIONS, PROPERTY_TYPE_OPTIONS, type Property } from '@/lib/properties/types';
import { PropertyApi } from '@/lib/properties/api';
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY } from '@/lib/countries';
import { regionsForCountry } from '@/lib/regions';
import DistrictSelect from '@/components/shared/DistrictSelect';
import { useCurrencyOptions } from '@/lib/currencies';
import { notifyPropertiesChanged } from '@/lib/sellerListings/hooks';
import { useToast } from '@/lib/toast-context';
import Select from "@/components/shared/Select";

const SUPPORTED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop';
const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || 'http://localhost:8081/api/property-service';

function PostPropertyForm() {
  const router = useRouter();
  const { token, isApprovedSeller } = useAuth();
  const { showToast } = useToast();
  // ?edit=<id> resumes an existing draft — see ListingActionsMenu.tsx's "Submit for Review"
  // action, which is the only place this link is generated.
  const editId = useSearchParams().get('edit');
  const [loadingDraft, setLoadingDraft] = useState(!!editId);
  const [draftLoadError, setDraftLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);

  const [title, setTitle] = useState('');
  const [listingType, setListingType] = useState<'' | Property['type']>('');
  // Tracks the specific label the seller picked (e.g. "Villa"), not just its
  // underlying bucket — several labels share one bucket (see
  // PROPERTY_TYPE_OPTIONS), so a plain <select> keyed on the bucket would
  // lose which exact label was chosen on every re-render.
  const [propertyTypeLabel, setPropertyTypeLabel] = useState('');
  // Options always include 5 major currencies plus the seller's own local
  // one (geo-detected) — see lib/currencies.ts. The selected value defaults
  // to that local currency once detection resolves, but only if the seller
  // hasn't already changed it themselves.
  const { options: currencyOptions, defaultCurrency } = useCurrencyOptions();
  const [currency, setCurrency] = useState('USD');
  const [currencyTouched, setCurrencyTouched] = useState(false);
  if (!currencyTouched && defaultCurrency !== currency) setCurrency(defaultCurrency);
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY.name);
  const [district, setDistrict] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  // Always the source of truth in sqm — matches Property.sqm and the
  // /properties Area Size filter, which is sqm-only. sqKm is purely a
  // display/entry convenience (useful for large land plots) layered on top;
  // see sqmDisplayValue/handleSqmChange below.
  const [sqm, setSqm] = useState('');
  const [sqmUnit, setSqmUnit] = useState<'sqm' | 'sqkm'>('sqm');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<CategorizedPhoto[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Resuming a draft — pre-fill everything it already has. A draft can be missing almost any
  // field (see lib/properties/types.ts's Property comment), so every setter below falls back to
  // this form's own empty default rather than assuming the value is present.
  useEffect(() => {
    if (!editId || !token) return;
    let cancelled = false;
    PropertyApi.byId(editId, token).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setDraftLoadError(result.error);
        setLoadingDraft(false);
        return;
      }
      const p = result.data;
      if (p.status !== 'draft') {
        setDraftLoadError('This listing has already been submitted.');
        setLoadingDraft(false);
        return;
      }
      setTitle(p.title || '');
      setListingType(p.type || '');
      const matchedLabel = PROPERTY_TYPE_OPTIONS.find((o) => o.bucket === p.propertyType)?.label;
      setPropertyTypeLabel(p.propertyLabel || matchedLabel || '');
      if (p.currency) {
        setCurrency(p.currency.replace(/\/month$/, ''));
        setCurrencyTouched(true);
      }
      setPrice(p.price ? String(p.price) : '');
      setLocation(p.location ? (p.city ? `${p.location}, ${p.city}` : p.location) : '');
      setCountry(p.country || DEFAULT_COUNTRY.name);
      setDistrict(p.district || '');
      setBedrooms(p.bedrooms ? String(p.bedrooms) : '');
      setBathrooms(p.bathrooms ? String(p.bathrooms) : '');
      setSqm(p.sqm ? String(p.sqm) : '');
      setDescription(p.description || '');
      setAmenities(p.amenities || []);
      setPhotos((p.photos || []).map((ph) => ({ url: ph.url, category: (ph.category as PhotoCategory) || 'interior_other' })));
      setLoadingDraft(false);
    });
    return () => {
      cancelled = true;
    };
  }, [editId, token]);

  if (!isApprovedSeller) {
    return <ApplyGate />;
  }

  if (loadingDraft) {
    return <div className="min-h-[60vh] flex items-center justify-center text-sm font-semibold text-slate-400">Loading your draft…</div>;
  }

  if (draftLoadError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-slate-600">{draftLoadError}</p>
        <Link href="/manager" className="font-bold text-[#2ec440] hover:text-[#28b039] transition-colors">Back to Manager Portal</Link>
      </div>
    );
  }

  // No pre-emptive quota check here any more — property-service is the authoritative check
  // (it calls payment-service's quota/consume immediately before creating the listing) and
  // returns 403 if the account is over its monthly cap, which handleSubmit below catches and
  // switches to the paywall instead of trying to predict the answer client-side.
  if (showPaywall) {
    return <PostingPaywall onClose={() => setShowPaywall(false)} />;
  }

  // Furnishing status matters most for apartment-style listings (Apartment/
  // Condo/Studio share the "apartment" bucket) — surfaced as its own toggle
  // there instead of leaving it to be found inside the generic Amenities
  // checklist below. Both read/write the exact same "Furnished" amenity tag,
  // so it stays filterable on /properties either way — no new field.
  const isApartmentType = PROPERTY_TYPE_OPTIONS.find((o) => o.label === propertyTypeLabel)?.bucket === 'apartment';
  const isFurnished = amenities.some((a) => a.toLowerCase() === 'furnished');

  const toggleAmenity = (label: string) => {
    setAmenities((prev) => (prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label]));
  };

  // 1 sq km = 1,000,000 sqm. sqm itself never changes when the unit toggle
  // changes — only how it's displayed/typed — so switching units just
  // reformats the same number instead of losing or corrupting it.
  const sqmDisplayValue = sqm === '' ? '' : sqmUnit === 'sqkm' ? String(Number(sqm) / 1_000_000) : sqm;
  function handleSqmChange(raw: string) {
    if (raw === '') { setSqm(''); return; }
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    setSqm(String(sqmUnit === 'sqkm' ? n * 1_000_000 : n));
  }

  // Shared by both the full submit and the draft save — the only differences between the two
  // calls are which endpoint they hit and the `draft` flag (see handleSubmit/handleSaveDraft).
  async function buildFields() {
    const propertyType = PROPERTY_TYPE_OPTIONS.find((o) => o.label === propertyTypeLabel)?.bucket;
    // The single "City / Location" input (e.g. "Nyarutarama, Kigali") carries both the
    // neighborhood and the city — split it here rather than asking for two form fields.
    const [neighborhood, ...cityParts] = location.split(',');
    const city = cityParts.length ? cityParts.join(',').trim() : neighborhood.trim();
    const { imageUrl, galleryImages } = deriveImageFields(photos, FALLBACK_IMAGE);
    let videoUrl: string | undefined;
    if (videoFile) {
      if (!SUPPORTED_VIDEO_TYPES.has(videoFile.type)) throw new Error('Video must be MP4, WebM, or MOV.');
      videoUrl = await uploadMedia(videoFile, videoFile.type, token);
    }
    return {
      title,
      description: description || (propertyTypeLabel ? `A ${propertyTypeLabel.toLowerCase()} listed in ${location}.` : ''),
      price: Number(price) || 0,
      currency: listingType === 'rent' ? `${currency}/month` : currency,
      location: neighborhood.trim(),
      city,
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 0,
      sqm: Number(sqm) || 0,
      imageUrl,
      galleryImages,
      photos,
      type: listingType || undefined,
      propertyType,
      propertyLabel: propertyType ? propertyTypeLabel : undefined,
      videoUrl,
      country,
      district: district || undefined,
      amenities,
    };
  }

  // Submits for review/publishing — either creating a brand-new listing, or, when resuming a
  // draft (?edit=<id>), the first point its data is fully validated (see property-service's
  // submitProperty). This is also where the seller's posting quota actually gets consumed.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const propertyType = PROPERTY_TYPE_OPTIONS.find((o) => o.label === propertyTypeLabel)?.bucket;
    if (!listingType || !propertyType || submitting || savingDraft || uploadingPhotos) return;

    setError('');
    setSubmitting(true);
    try {
      const fields = await buildFields();
      if (editId) {
        const result = await PropertyApi.submitDraft(token || '', editId, fields);
        if (!result.ok) {
          setError(result.error);
          setSubmitting(false);
          return;
        }
        notifyPropertiesChanged();
        router.push(`/properties/${result.data.id}`);
        return;
      }
      const res = await fetch(`${PROPERTY_API_URL}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(fields),
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
      notifyPropertiesChanged();
      router.push(`/properties/${data.property.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the server. Please try again.');
      setSubmitting(false);
    }
  };

  // Saves without submitting — only `title` is required (see parsePropertyFields in
  // property-service), no quota consumed, never goes to review. Creates a new draft, or updates
  // the one already being resumed.
  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setError('Give your draft a title before saving.');
      return;
    }
    if (submitting || savingDraft || uploadingPhotos) return;
    setError('');
    setSavingDraft(true);
    try {
      const fields = await buildFields();
      if (editId) {
        const res = await fetch(`${PROPERTY_API_URL}/properties/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(fields),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.message || 'Could not save your draft. Please try again.');
          setSavingDraft(false);
          return;
        }
      } else {
        const res = await fetch(`${PROPERTY_API_URL}/properties`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...fields, draft: true }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.message || 'Could not save your draft. Please try again.');
          setSavingDraft(false);
          return;
        }
      }
      notifyPropertiesChanged();
      showToast('Draft saved.');
      router.push('/manager');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the server. Please try again.');
      setSavingDraft(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Form */}
      <section className="max-w-3xl mx-auto px-6 sm:px-10 pt-32 pb-20">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">{editId ? 'Finish your draft' : 'List your property'}</h1>
          <p className="text-slate-500">
            {editId
              ? "Fill in what's missing, then submit it for review."
              : "Fill in the details below. Most listings are reviewed before going live — save as a draft if you're not ready to submit yet."}
          </p>
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
                <Select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value as Property['type'])}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900"
                  required
                >
                  <option value="" disabled>Select type</option>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Property Type</label>
                <Select
                  value={propertyTypeLabel}
                  onChange={(e) => setPropertyTypeLabel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900"
                  required
                >
                  <option value="" disabled>Select type</option>
                  {PROPERTY_TYPE_OPTIONS.map(({ label }) => (
                    <option key={label} value={label}>{label}</option>
                  ))}
                </Select>
              </div>

              {isApartmentType && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Furnishing</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => !isFurnished && toggleAmenity('Furnished')}
                      className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-colors ${
                        isFurnished ? 'border-[#2ec440] bg-[#2ec440]/5 text-[#2ec440]' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Fully Furnished
                    </button>
                    <button
                      type="button"
                      onClick={() => isFurnished && toggleAmenity('Furnished')}
                      className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-colors ${
                        !isFurnished ? 'border-[#2ec440] bg-[#2ec440]/5 text-[#2ec440]' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Unfurnished
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Price</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 350000"
                    min="0"
                    className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                    required
                  />
                  <Select
                    value={currency}
                    onChange={(e) => { setCurrency(e.target.value); setCurrencyTouched(true); }}
                    aria-label="Currency"
                    className="w-24 px-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900"
                  >
                    {currencyOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>
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
                <Select
                  value={country}
                  onChange={(e) => { setCountry(e.target.value); setDistrict(''); }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900"
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.name}>{c.name}</option>
                  ))}
                </Select>
              </div>

              {regionsForCountry(country) && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">District</label>
                  <DistrictSelect country={country} value={district} onChange={setDistrict} />
                </div>
              )}

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
                <label className="block text-sm font-bold text-slate-700 mb-2">Size</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={sqmDisplayValue}
                    onChange={(e) => handleSqmChange(e.target.value)}
                    min="0"
                    step="any"
                    placeholder={sqmUnit === 'sqkm' ? 'e.g. 0.5' : 'e.g. 450'}
                    className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                  />
                  <Select
                    value={sqmUnit}
                    onChange={(e) => setSqmUnit(e.target.value as 'sqm' | 'sqkm')}
                    aria-label="Size unit"
                    className="w-28 px-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900"
                  >
                    <option value="sqm">sqm</option>
                    <option value="sqkm">sq km</option>
                  </Select>
                </div>
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
                  {AMENITY_OPTIONS.filter((label) => !(isApartmentType && label === 'Furnished')).map((label) => (
                    <label key={label} className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                      <input type="checkbox" checked={amenities.includes(label)} onChange={() => toggleAmenity(label)} className="accent-[#2ec440] w-4 h-4 cursor-pointer" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting || savingDraft || uploadingPhotos}
              className="w-full sm:w-auto sm:px-8 border-2 border-slate-200 text-slate-700 font-bold py-4 rounded-xl transition-colors hover:border-slate-300 disabled:opacity-60"
            >
              {savingDraft ? 'Saving…' : 'Save as Draft'}
            </button>
            <button type="submit" disabled={submitting || savingDraft || uploadingPhotos} className="w-full flex-1 bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-4 rounded-xl transition-colors shadow-lg disabled:opacity-60">
              {submitting ? 'Submitting…' : uploadingPhotos ? 'Uploading photos…' : editId ? 'Submit for Review' : 'Publish Listing'}
            </button>
          </div>

          <p className="text-center text-slate-500 text-sm">
            Submitted listings are reviewed before going live, unless auto-publish applies to your area. Track its status from your{' '}
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
      <Suspense fallback={null}>
        <PostPropertyForm />
      </Suspense>
    </RequireAuth>
  );
}
