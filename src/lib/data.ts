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
  type: 'sale' | 'rent';
  propertyType: 'house' | 'apartment' | 'land';
  virtualTourUrl?: string;
}

export const mockProperties: Property[] = [
  {
    id: "prop-1",
    title: "Luxury Villa with Pool",
    description: "A beautiful 4-bedroom villa located in the heart of Nyarutarama with a stunning view, swimming pool, and a large garden.",
    price: 350000,
    currency: "USD",
    location: "Nyarutarama",
    city: "Kigali",
    bedrooms: 4,
    bathrooms: 4,
    sqm: 450,
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop",
    type: "sale",
    propertyType: "house",
    virtualTourUrl: "https://my.matterport.com/show/?m=JGPnGQ6hosj"
  },
  {
    id: "prop-2",
    title: "Modern Apartment in Gacuriro",
    description: "Fully furnished 2-bedroom apartment with 24/7 security, high-speed internet, and close to Vision City.",
    price: 1500,
    currency: "USD/month",
    location: "Gacuriro",
    city: "Kigali",
    bedrooms: 2,
    bathrooms: 2,
    sqm: 120,
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop",
    type: "rent",
    propertyType: "apartment",
    virtualTourUrl: "https://my.matterport.com/show/?m=JGPnGQ6hosj"
  },
  {
    id: "prop-3",
    title: "Family Home with Garden",
    description: "Spacious family home in Kimironko with a large compound, perfect for families. Close to markets and schools.",
    price: 120000,
    currency: "USD",
    location: "Kimironko",
    city: "Kigali",
    bedrooms: 3,
    bathrooms: 2,
    sqm: 300,
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
    type: "sale",
    propertyType: "house"
  },
  {
    id: "prop-4",
    title: "Commercial Land",
    description: "Prime commercial land located in the bustling area of Remera, suitable for office buildings or retail.",
    price: 200000,
    currency: "USD",
    location: "Remera",
    city: "Kigali",
    bedrooms: 0,
    bathrooms: 0,
    sqm: 1000,
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop",
    type: "sale",
    propertyType: "land"
  }
];
