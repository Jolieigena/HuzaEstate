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
}
