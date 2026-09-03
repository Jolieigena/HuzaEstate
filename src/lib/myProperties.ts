import type { OccupancyStatus, PropertyType } from "./renovate/types";

// A small prototype "My Properties" data source shared by the customer
// dashboard's "Owned & Rented Properties" tab and the Renovate module's
// property-selection step. There is no real backend, so this is a static,
// per-owner list — not tied to `mockProperties` in `data.ts`, which models
// public marketplace listings with no ownership concept.

export type MyPropertyOwnership = "owned" | "rented" | "unconfirmed";

export interface MyProperty {
  id: string;
  ownerId: string;
  name: string;
  imageUrl: string;
  location: string;
  propertyType: PropertyType;
  ownershipStatus: MyPropertyOwnership;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  floors: number;
  constructionYear: number;
  occupancy: OccupancyStatus;
}

const MY_PROPERTIES: MyProperty[] = [
  {
    id: "myprop-gacuriro-villa",
    ownerId: "demo-user",
    name: "Gacuriro Family Villa",
    imageUrl: "/hero-house.jpg",
    location: "Gacuriro, Kigali",
    propertyType: "villa",
    ownershipStatus: "owned",
    bedrooms: 4,
    bathrooms: 3,
    areaSqm: 320,
    floors: 2,
    constructionYear: 2014,
    occupancy: "occupied",
  },
  {
    id: "myprop-downtown-penthouse",
    ownerId: "demo-user",
    name: "Downtown Penthouse Suite",
    imageUrl: "/hero-house-white.jpg",
    location: "Kiyovu, Kigali",
    propertyType: "apartment",
    ownershipStatus: "rented",
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 110,
    floors: 1,
    constructionYear: 2019,
    occupancy: "occupied",
  },
  {
    id: "myprop-kiyovu-apartment",
    ownerId: "demo-user",
    name: "Kiyovu Apartment",
    imageUrl: "/hero-house-final.jpg",
    location: "Kiyovu, Kigali",
    propertyType: "apartment",
    ownershipStatus: "owned",
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 145,
    floors: 1,
    constructionYear: 2017,
    occupancy: "occupied",
  },
];

export function getMyProperties(ownerId: string = "demo-user"): MyProperty[] {
  return MY_PROPERTIES.filter((p) => p.ownerId === ownerId);
}

export function getMyPropertyById(id: string): MyProperty | undefined {
  return MY_PROPERTIES.find((p) => p.id === id);
}
