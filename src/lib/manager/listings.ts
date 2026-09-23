import type { Property } from '@/lib/properties/types';
import type { TenantApplication } from '@/lib/tenantApplications/types';
import { deriveListingStatus } from '@/lib/tenantApplications/store';
import { DEFAULT_META, LISTING_META } from './demoData';
import type { Listing } from './types';

export function toListing(property: Property, applications: TenantApplication[], accountId?: string): Listing {
  const meta = LISTING_META[property.id] ?? DEFAULT_META;
  // A real tenant application decides Pending/Leased when there is one —
  // the hardcoded/default meta status is only ever the fallback for a
  // property nothing has been applied to yet.
  const status = deriveListingStatus(property.id, applications) ?? meta.status;
  return {
    id: property.id,
    title: property.title,
    rent: property.price,
    image: property.imageUrl,
    property,
    // Only a listing this account can actually delete: the legacy local-mock "seller-<uuid>"
    // ids (see src/lib/sellerListings/store.ts, still used by ListPropertyModal.tsx), or a
    // real backend-posted listing this account owns (property.ownerId, set server-side from
    // the JWT at creation — never trust an id shape alone for a real record).
    isSellerPosted: property.id.startsWith('seller-') || (!!accountId && property.ownerId === accountId),
    ...meta,
    status,
  };
}
