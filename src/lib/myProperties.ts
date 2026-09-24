import type { OccupancyStatus, PropertyType } from "./renovate/types";

// "My Properties" data source shared by the customer dashboard's "Owned & Rented Properties"
// tab and the Renovate module's property-selection step.

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
  /** What the owner paid, in the same currency as the property's district
   *  market data (USD) — the basis a resale recommendation compares the
   *  current estimated value against. Undefined for a rented (not owned)
   *  entry, which has no purchase price. */
  purchasePrice?: number;
  purchaseDate?: string;
}

// No backend tracks a customer's owned/rented properties yet, so this starts empty.
const MY_PROPERTIES: MyProperty[] = [];

export function getMyProperties(ownerId: string = "demo-user"): MyProperty[] {
  return MY_PROPERTIES.filter((p) => p.ownerId === ownerId);
}

export function getMyPropertyById(id: string): MyProperty | undefined {
  return MY_PROPERTIES.find((p) => p.id === id);
}
