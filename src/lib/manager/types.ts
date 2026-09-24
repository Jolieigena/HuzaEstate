import type { Property } from '@/lib/properties/types';

export type ListingStatus = 'Live' | 'Off market' | 'Needs attention' | 'Expired';

export interface Listing {
  id: string;
  title: string;
  rent: number;
  status: ListingStatus;
  views: number;
  saves: number;
  leads: number;
  image: string;
  /** Full source record — SellerTourControl needs more than id/image to
   *  build a good generation prompt (bedrooms, bathrooms, location, ...). */
  property: Property;
}

export type ManagerTab = 'overview' | 'listings' | 'inquiries' | 'insights' | 'profile';
export type ListingStatusFilter = ListingStatus | 'all';
export type ListingStatusCounts = Record<ListingStatus, number>;
