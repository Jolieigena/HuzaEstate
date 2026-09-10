"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SellerListingsStoreEngine } from '@/lib/sellerListings/store';
import CategorizedPhotoUpload from '@/components/CategorizedPhotoUpload';
import { deriveImageFields } from '@/lib/photoCategories';
import type { Property, PropertyPhoto } from '@/lib/data';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop';

export default function PostPropertyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [listingType, setListingType] = useState<'' | Property['type']>('');
  const [propertyType, setPropertyType] = useState<'' | Property['propertyType']>('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [sqm, setSqm] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<PropertyPhoto[]>([]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!listingType || !propertyType) return;

    setSubmitting(true);

    const [cityPart, ...rest] = city.split(',');
    const { imageUrl, images } = deriveImageFields(photos, FALLBACK_IMAGE);
    const property = SellerListingsStoreEngine.add({
      title,
      description: description || `A ${propertyType} listed in ${location}.`,
      price: Number(price) || 0,
      currency: listingType === 'rent' ? 'USD/month' : 'USD',
      location,
      city: rest.length ? rest.join(',').trim() : cityPart.trim(),
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 0,
      sqm: Number(sqm) || 0,
      imageUrl,
      images,
      photos,
      type: listingType,
      propertyType,
    });

    router.push(`/properties/${property.id}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative pt-28 pb-20 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="https://images.unsplash.com/photo-1727797716658-469836019c90?q=80&w=2000&auto=format&fit=crop"
            alt="List your property"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 sm:px-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-xs uppercase tracking-wide mb-6">
            List your property
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
            Reach thousands of buyers and renters across Rwanda.
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto font-medium">
            Fill in a few details below and your listing goes live immediately.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-3xl mx-auto px-6 sm:px-10 py-16 sm:py-20">
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Property Photos</label>
                <CategorizedPhotoUpload photos={photos} onChange={setPhotos} />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Bedrooms</label>
                <input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  min="0"
                  placeholder="e.g. 4"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Tell buyers or renters what makes this property special..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-4 rounded-xl transition-colors shadow-lg disabled:opacity-60">
            {submitting ? 'Publishing…' : 'Publish Listing'}
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
