import type { Property } from '@/lib/properties/types';
import type { TenantApplication } from '@/lib/tenantApplications/types';
import { deriveListingStatus } from '@/lib/tenantApplications/store';
import { DEFAULT_META, LISTING_META } from './demoData';
import type { Listing } from './types';

export function toListing(property: Property, applications: TenantApplication[]): Listing {
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
    isSellerPosted: property.id.startsWith('seller-'),
    ...meta,
    status,
  };
}
