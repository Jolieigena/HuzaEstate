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
  lat?: number;
  lng?: number;
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
    imageUrl: "https://images.unsplash.com/photo-1507427100689-2bf8574e32d4?q=80&w=800&auto=format&fit=crop",
    type: "sale",
    propertyType: "house",
    virtualTourUrl: "https://my.matterport.com/show/?m=JGPnGQ6hosj",
    lat: -1.942,
    lng: 30.093
  },
  {
    id: "prop-2",
    title: "Lakeview Apartment",
    description: "Fully furnished 2-bedroom apartment with 24/7 security, high-speed internet, and stunning views of Lake Kivu.",
    price: 1500,
    currency: "USD/month",
    location: "Gisenyi",
    city: "Rubavu",
    bedrooms: 2,
    bathrooms: 2,
    sqm: 120,
    imageUrl: "https://images.unsplash.com/photo-1720605739861-9f5110c7e529?q=80&w=800&auto=format&fit=crop",
    type: "rent",
    propertyType: "apartment",
    virtualTourUrl: "https://my.matterport.com/show/?m=JGPnGQ6hosj",
    lat: -1.693,
    lng: 29.260
  },
  {
    id: "prop-3",
    title: "Mountain Retreat Home",
    description: "Spacious family home in Musanze with a large compound, perfect for tourists or large families visiting the Volcanoes.",
    price: 120000,
    currency: "USD",
    location: "Ruhengeri",
    city: "Musanze",
    bedrooms: 3,
    bathrooms: 2,
    sqm: 300,
    imageUrl: "https://images.unsplash.com/photo-1682773083908-a0e9ffadd175?q=80&w=800&auto=format&fit=crop",
    type: "sale",
    propertyType: "house",
    virtualTourUrl: "https://my.matterport.com/show/?m=JGPnGQ6hosj",
    lat: -1.492,
    lng: 29.620
  },
  {
    id: "prop-4",
    title: "Commercial Land near University",
    description: "Prime commercial land located in Butare, suitable for student housing, office buildings or retail.",
    price: 200000,
    currency: "USD",
    location: "Tumba",
    city: "Huye",
    bedrooms: 0,
    bathrooms: 0,
    sqm: 1000,
    imageUrl: "https://images.unsplash.com/photo-1667504320745-eade6c25e053?q=80&w=800&auto=format&fit=crop",
    type: "sale",
    propertyType: "land",
    virtualTourUrl: "https://my.matterport.com/show/?m=JGPnGQ6hosj",
    lat: -2.595,
    lng: 29.742
  },
  {
    id: "prop-5",
    title: "Downtown Penthouse",
    description: "Incredible penthouse in Kiyovu with 360-degree views of Kigali, modern finishings, and a private elevator.",
    price: 450000,
    currency: "USD",
    location: "Kiyovu",
    city: "Kigali",
    bedrooms: 3,
    bathrooms: 3,
    sqm: 250,
    imageUrl: "https://images.unsplash.com/photo-1708772565599-2c4e4b3ed9db?q=80&w=800&auto=format&fit=crop",
    type: "sale",
    propertyType: "apartment",
    virtualTourUrl: "https://my.matterport.com/show/?m=JGPnGQ6hosj",
    lat: -1.960,
    lng: 30.070
  },
  {
    id: "prop-6",
    title: "Cosy Guesthouse",
    description: "A running guesthouse business in Muhanga with 8 en-suite rooms and a lovely outdoor dining area.",
    price: 280000,
    currency: "USD",
    location: "Nyamabuye",
    city: "Muhanga",
    bedrooms: 8,
    bathrooms: 8,
    sqm: 600,
    imageUrl: "https://images.unsplash.com/photo-1689013398932-b576a11e07a1?q=80&w=800&auto=format&fit=crop",
    type: "sale",
    propertyType: "house",
    virtualTourUrl: "https://my.matterport.com/show/?m=JGPnGQ6hosj",
    lat: -2.083,
    lng: 29.750
  },
  {
    id: "prop-7",
    title: "Eastern Province Farm",
    description: "Large agricultural plot in Nyagatare, perfect for farming or a country estate getaway.",
    price: 85000,
    currency: "USD",
    location: "Nyagatare",
    city: "Nyagatare",
    bedrooms: 0,
    bathrooms: 0,
    sqm: 5000,
    imageUrl: "https://images.unsplash.com/photo-1708772565588-33785e13aa46?q=80&w=800&auto=format&fit=crop",
    type: "sale",
    propertyType: "land",
    virtualTourUrl: "https://my.matterport.com/show/?m=JGPnGQ6hosj",
    lat: -1.300,
    lng: 30.316
  },
  {
    id: "prop-8",
    title: "Rusizi Lakeside Villa",
    description: "Stunning 5-bedroom villa right on the border, featuring private water access and gorgeous sunsets.",
    price: 4000,
    currency: "USD/month",
    location: "Kamembe",
    city: "Rusizi",
    bedrooms: 5,
    bathrooms: 4,
    sqm: 400,
    imageUrl: "https://images.unsplash.com/photo-1682773083896-95176d8aecf8?q=80&w=800&auto=format&fit=crop",
    type: "rent",
    propertyType: "house",
    virtualTourUrl: "https://my.matterport.com/show/?m=JGPnGQ6hosj",
    lat: -2.483,
    lng: 28.895
  }
];
