"use client";

import { useState } from 'react';
import Dialog from './Dialog';
import CategorizedPhotoUpload from './CategorizedPhotoUpload';
import { useAuth } from '@/lib/auth-context';
import { notifyPropertiesChanged } from '@/lib/sellerListings/hooks';
import { deriveImageFields, isPhotoCategory, type CategorizedPhoto } from '@/lib/photoCategories';
import { AMENITY_OPTIONS, PROPERTY_TYPE_OPTIONS, type Property } from '@/lib/properties/types';
import { COUNTRY_OPTIONS, getPropertyCountry } from '@/lib/countries';
import { useCurrencyOptions } from '@/lib/currencies';

const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || 'http://localhost:8081/api/property-service';

interface EditPropertyModalProps {
  property: Property | null;
  onClose: () => void;
}

/** Edits a listing by PATCHing property-service; the owner-or-administrator check happens server-side. */
export default function EditPropertyModal({ property, onClose }: EditPropertyModalProps) {
  const { token } = useAuth();
  const [form, setForm] = useState(() => toFormState(property));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Display/entry convenience only — form.sqm stays the sqm source of truth
  // (matches Property.sqm and the /properties Area Size filter, sqm-only),
  // same pattern as post-property/page.tsx.
  const [sqmUnit, setSqmUnit] = useState<'sqm' | 'sqkm'>('sqm');
  // Hooks can't be called after the `if (!property) return null;` below, so
  // this runs unconditionally here even though it's only used once that
  // guard passes.
  const { options: baseCurrencyOptions } = useCurrencyOptions();

  // Reset local form state whenever a different property is opened.
  const [openedFor, setOpenedFor] = useState(property?.id);
  if (property && property.id !== openedFor) {
    setOpenedFor(property.id);
    setForm(toFormState(property));
    setError('');
    setSqmUnit('sqm');
  }

  if (!property) return null;

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    const { imageUrl, galleryImages } = deriveImageFields(form.photos, property.imageUrl);
    const propertyType = PROPERTY_TYPE_OPTIONS.find((o) => o.label === form.propertyTypeLabel)?.bucket ?? 'house';
    const patch = {
      title: form.title,
      description: form.description,
      price: Number(form.price) || property.price,
      currency: form.type === 'rent' ? `${form.currency}/month` : form.currency,
      location: form.location,
      city: form.city,
      country: form.country,
      bedrooms: Number(form.bedrooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      sqm: Number(form.sqm) || 0,
      imageUrl,
      galleryImages,
      photos: form.photos,
      amenities: form.amenities,
      type: form.type,
      propertyType,
      propertyLabel: form.propertyTypeLabel,
    };

    if (!token) {
      setError('Please sign in again.');
      setSaving(false);
      return;
    }
    try {
      const res = await fetch(`${PROPERTY_API_URL}/properties/${property.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message || 'Could not save your changes. Please try again.');
        setSaving(false);
        return;
      }
    } catch {
      setError('Could not reach the server. Please try again.');
      setSaving(false);
      return;
    }

    notifyPropertiesChanged();
    setSaving(false);
    onClose();
  };

  const toggleAmenity = (label: string) => {
    setForm((f) => ({ ...f, amenities: f.amenities.includes(label) ? f.amenities.filter((a) => a !== label) : [...f.amenities, label] }));
  };

  // Same "Furnished" tag as the generic Amenities checklist, just surfaced as
  // its own toggle for apartment-style listings — see post-property/page.tsx.
  const isApartmentType = PROPERTY_TYPE_OPTIONS.find((o) => o.label === form.propertyTypeLabel)?.bucket === 'apartment';
  const isFurnished = form.amenities.some((a) => a.toLowerCase() === 'furnished');

  // 5 majors + the seller's own local currency (see lib/currencies.ts), plus
  // whatever currency the listing already has — even an uncommon one — so
  // editing never silently drops it from the dropdown.
  const currencyOptions = Array.from(new Set([...baseCurrencyOptions, form.currency]));

  // 1 sq km = 1,000,000 sqm — form.sqm never changes when the unit toggle
  // changes, only how it's displayed/typed.
  const sqmDisplayValue = form.sqm === '' ? '' : sqmUnit === 'sqkm' ? String(Number(form.sqm) / 1_000_000) : form.sqm;
  function handleSqmChange(raw: string) {
    if (raw === '') { setForm((f) => ({ ...f, sqm: '' })); return; }
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    setForm((f) => ({ ...f, sqm: String(sqmUnit === 'sqkm' ? n * 1_000_000 : n) }));
  }

  return (
    <Dialog open={Boolean(property)} onClose={onClose} labelledBy="edit-property-title" panelClassName="max-w-2xl p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 id="edit-property-title" className="text-xl font-bold text-slate-900">Edit Property</h2>
        <button onClick={onClose} data-dialog-close className="text-slate-400 hover:text-slate-900 transition-colors" aria-label="Close">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      {error && (
        <p className="mb-5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3">{error}</p>
      )}

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
              value={form.propertyTypeLabel}
              onChange={(e) => setForm((f) => ({ ...f, propertyTypeLabel: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900"
            >
              {PROPERTY_TYPE_OPTIONS.map(({ label }) => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {isApartmentType && (
          <div>
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

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Price</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                required
              />
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                aria-label="Currency"
                className="w-24 px-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900"
              >
                {currencyOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
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
                <option key={c.code} value={c.name}>{c.name}</option>
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
            <label className="block text-sm font-bold text-slate-700 mb-2">Size</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="any"
                value={sqmDisplayValue}
                onChange={(e) => handleSqmChange(e.target.value)}
                placeholder={sqmUnit === 'sqkm' ? 'e.g. 0.5' : 'e.g. 450'}
                className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
              />
              <select
                value={sqmUnit}
                onChange={(e) => setSqmUnit(e.target.value as 'sqm' | 'sqkm')}
                aria-label="Size unit"
                className="w-28 px-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900"
              >
                <option value="sqm">sqm</option>
                <option value="sqkm">sq km</option>
              </select>
            </div>
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

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Amenities</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border border-slate-200 rounded-xl">
            {AMENITY_OPTIONS.filter((label) => !(isApartmentType && label === 'Furnished')).map((label) => (
              <label key={label} className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                <input type="checkbox" checked={form.amenities.includes(label)} onChange={() => toggleAmenity(label)} className="accent-[#2ec440] w-4 h-4 cursor-pointer" />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="flex-1 bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
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
  // The backend only ever stores the bucket (house/apartment/land), so which
  // specific label (e.g. "Villa" vs "House") the seller originally picked
  // isn't recoverable — default to that bucket's first/plainest label.
  const propertyTypeLabel = property?.propertyLabel ?? PROPERTY_TYPE_OPTIONS.find((o) => o.bucket === (property?.propertyType ?? 'house'))?.label ?? 'House';
  // Preserved as-is, whatever it is — the currency dropdown always includes
  // the listing's actual current value (see currencyOptions above), so this
  // no longer needs to coerce an unrecognized currency down to USD.
  const currency = (property?.currency ?? 'USD').replace(/\/month$/, '');
  return {
    title: property?.title ?? '',
    description: property?.description ?? '',
    price: property ? String(property.price) : '',
    currency,
    location: property?.location ?? '',
    city: property?.city ?? '',
    country: property ? getPropertyCountry(property).name : COUNTRY_OPTIONS[0].name,
    bedrooms: property ? String(property.bedrooms) : '',
    bathrooms: property ? String(property.bathrooms) : '',
    sqm: property ? String(property.sqm) : '',
    photos: property ? toPhotos(property) : [],
    type: (property?.type ?? 'sale') as Property['type'],
    propertyTypeLabel,
    amenities: property?.amenities ?? [],
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
