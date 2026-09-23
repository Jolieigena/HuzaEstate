export interface Property {
  id: string;
  /** Set server-side from the poster's JWT at creation — absent on the curated mockProperties
   *  fixtures, which have no real owner account. */
  ownerId?: string;
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
  /** Set at posting time from the poster's plan tier (see payment-service's PLAN_EXPIRY_DAYS) —
   *  optional because listings from before this field existed have none. Public browse/search
   *  and GET-by-id already exclude anything past this on the backend; `expired` is a
   *  pre-computed convenience the backend derives from it so the frontend never needs its own
   *  clock-skew-prone "is it past expiresAt" check. */
  expiresAt?: string;
  expired?: boolean;
}

// Shared between the /properties Amenities filter, the post-property form,
// and EditPropertyModal, so every place a seller can set an amenity and a
// buyer can filter by one offers exactly the same list.
export const AMENITY_OPTIONS = [
  'Pool', 'Garden', 'Furnished', 'Parking', 'Gym', 'Security',
  'Balcony', 'Air Conditioning', 'Elevator', 'Pet Friendly',
  'Solar Power', 'Generator', 'CCTV', 'WiFi',
];
