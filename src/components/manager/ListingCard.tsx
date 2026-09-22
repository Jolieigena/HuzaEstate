import Link from 'next/link';
import Image from 'next/image';
import type { Listing } from '@/lib/manager/types';
import type { Property } from '@/lib/properties/types';
import type { ListingModerationStatus } from '@/lib/admin/types';
import { useListingModerationStatus } from '@/lib/admin/listings';
import SellerTourControl from '@/components/SellerTourControl';
import ListingActionsMenu from './ListingActionsMenu';
import Sparkline from '@/components/charts/Sparkline';
import { SERIES_COLOR } from '@/components/charts/styles';
import { useSubscription } from '@/lib/postingPlans/hooks';
import { PLAN_FEATURES } from '@/lib/postingPlans/types';

// Same fixture landlord identity used elsewhere in Manager Portal.
const DEMO_SELLER_ID = 'seller-user';

const STATUS_BADGE: Record<Listing['status'], string> = {
  Active: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Leased: 'bg-slate-100 text-slate-500',
};

const MARKET_STATUS_BADGE: Partial<Record<ListingModerationStatus, string>> = {
  unpublished: 'Off Market',
  archived: 'Archived',
};

export default function ListingCard({
  listing,
  onEdit,
  onDelete,
  onSetMarketStatus,
  onAttachExistingWorld,
}: {
  listing: Listing;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onSetMarketStatus: (property: Property, status: ListingModerationStatus) => void;
  onAttachExistingWorld: (property: Property) => void;
}) {
  const isLeased = listing.status === 'Leased';
  const marketStatus = useListingModerationStatus(listing.id);
  const marketBadge = MARKET_STATUS_BADGE[marketStatus];
  const isOffMarket = marketStatus !== 'published';
  const subscription = useSubscription(DEMO_SELLER_ID);
  const isPriority = PLAN_FEATURES[subscription.tier].priorityPlacement;

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow ${isOffMarket ? 'opacity-75' : ''}`}>
      <Link href={`/properties/${listing.id}`} className={`block relative w-full h-36 hover:opacity-90 transition-opacity ${isLeased || isOffMarket ? 'opacity-50 grayscale' : ''}`}>
        {listing.property.videoUrl ? (
          <video
            src={listing.property.videoUrl}
            muted
            playsInline
            preload="metadata"
            aria-label={`Video walkthrough of ${listing.title}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <Image src={listing.image} alt={listing.title} fill className="object-cover" />
        )}
        {listing.property.videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <svg className="ml-0.5 h-4 w-4 text-slate-900" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            </span>
          </div>
        )}
        <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm ${STATUS_BADGE[listing.status]}`}>
          {listing.status}
        </span>
        {isPriority && (
          <span className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm bg-amber-400 text-amber-900">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            Priority
          </span>
        )}
        {marketBadge && (
          <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm bg-slate-900/80 text-white">
            {marketBadge}
          </span>
        )}
      </Link>

      <div className="p-5 flex flex-col gap-4">
        <div>
          <Link href={`/properties/${listing.id}`} className={`block font-bold leading-snug hover:text-blue-600 transition-colors ${isLeased ? 'text-slate-400' : 'text-slate-900'}`}>{listing.title}</Link>
          <div className={`text-xs mt-0.5 ${isLeased ? 'text-slate-400' : 'text-slate-500'}`}>${listing.rent.toLocaleString()}/mo</div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div>
              <div className={`font-bold ${isLeased ? 'text-slate-400' : 'text-slate-700'}`}>{listing.views.toLocaleString()}</div>
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Views</div>
            </div>
            <div>
              <div className={`font-bold ${isLeased ? 'text-slate-400' : 'text-slate-700'}`}>{listing.saves}</div>
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Saves</div>
            </div>
            <div>
              <div className={`font-bold ${isLeased ? 'text-slate-400' : 'text-blue-600'}`}>{listing.leads}</div>
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Leads</div>
            </div>
          </div>
          <Sparkline data={listing.trend} color={isLeased ? '#94a3b8' : SERIES_COLOR} />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <SellerTourControl property={listing.property} />
          <ListingActionsMenu listing={listing} marketStatus={marketStatus} onEdit={onEdit} onDelete={onDelete} onSetMarketStatus={onSetMarketStatus} onAttachExistingWorld={onAttachExistingWorld} />
        </div>
      </div>
    </div>
  );
}
