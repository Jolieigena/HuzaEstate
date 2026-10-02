import type { Property } from '@/lib/properties/types';
import type { Listing, ListingStatus } from './types';

/** How a listing looks to its owner. Views/saves/leads aren't tracked by any backend yet, so
 *  they stay at zero rather than showing invented numbers. */
export function listingStatusOf(property: Property): ListingStatus {
  if (property.status === 'draft') return 'Draft';
  if (property.status === 'under_review') return 'Under Review';
  if (property.status === 'changes_requested' || property.status === 'rejected') return 'Needs attention';
  if (property.status === 'unpublished' || property.status === 'archived') return 'Off market';
  if (property.expired || (property.expiresAt && new Date(property.expiresAt).getTime() < Date.now())) return 'Expired';
  return 'Live';
}

export function toListing(property: Property): Listing {
  return {
    id: property.id,
    // A draft can genuinely be missing both of these at the API level (see Property's own
    // comment on why they're typed required anyway) — guard them here, the one place a draft
    // actually reaches this code.
    title: property.title || 'Untitled draft',
    rent: property.price ?? 0,
    image: property.imageUrl || '',
    property,
    views: 0,
    saves: 0,
    leads: 0,
    status: listingStatusOf(property),
  };
}
