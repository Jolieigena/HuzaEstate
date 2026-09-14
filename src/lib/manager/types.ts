import type { Property } from '@/lib/properties/types';

// ---------- Mock data ----------

export interface Listing {
  id: string;
  title: string;
  rent: number;
  status: 'Active' | 'Pending' | 'Leased';
  views: number;
  saves: number;
  leads: number;
  image: string;
  trend: number[];
  /** Full source record — SellerTourControl needs more than id/image to
   *  build a good generation prompt (bedrooms, bathrooms, location, ...). */
  property: Property;
  /** Only seller-posted listings (ids always "seller-<uuid>", see
   *  src/lib/sellerListings/store.ts) can be deleted — the curated
   *  mockProperties are static seed data a seller doesn't own. */
  isSellerPosted: boolean;
}

export type ManagerTab = 'overview' | 'listings' | 'applications' | 'payments';
export type ListingStatusFilter = Listing['status'] | 'all';
export type ListingStatusCounts = Record<Listing['status'], number>;
