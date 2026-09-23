export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  imageUrl: string;
  galleryImages?: string[];
  photos?: { url: string; category?: string }[];
  type: "sale" | "rent";
  propertyType: "house" | "apartment" | "land";
  virtualTourUrl?: string;
  videoUrl?: string;
  lat?: number;
  lng?: number;
  /** Country name (see src/lib/countries.ts's COUNTRY_OPTIONS) — optional
   *  because every listing before multi-country support predates this
   *  field; getPropertyCountry() defaults an absent value to Rwanda. */
  country?: string;
  /** Free-form tags, typically ticked from AMENITY_OPTIONS below but not
   *  restricted to it (see the Amenities filter's own free-text field) —
   *  optional because every listing before this field predates it. */
  amenities?: string[];
}

// Shared between the /properties Amenities filter, the post-property form,
// and EditPropertyModal, so every place a seller can set an amenity and a
// buyer can filter by one offers exactly the same list.
export const AMENITY_OPTIONS = [
  'Pool', 'Garden', 'Furnished', 'Parking', 'Gym', 'Security',
  'Balcony', 'Air Conditioning', 'Elevator', 'Pet Friendly',
  'Solar Power', 'Generator', 'CCTV', 'WiFi',
];
