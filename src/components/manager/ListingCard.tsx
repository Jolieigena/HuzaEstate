import Link from 'next/link';
import Image from 'next/image';
import type { Listing } from '@/lib/manager/types';
import type { Property } from '@/lib/properties/types';
import type { ListingModerationStatus } from '@/lib/admin/types';
import { useListingModerationStatus } from '@/lib/admin/listings';
import SellerTourControl from '@/components/SellerTourControl';
import ListingActionsMenu from './ListingActionsMenu';
import Sparkline from './Sparkline';
import { SERIES_COLOR } from './styles';

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
