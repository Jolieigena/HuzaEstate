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
  lat?: number;
  lng?: number;
}
