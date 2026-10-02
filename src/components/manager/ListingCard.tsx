import Link from 'next/link';
import Image from 'next/image';
import { Component, type ReactNode } from 'react';
import type { Listing } from '@/lib/manager/types';
import type { Property } from '@/lib/properties/types';
import type { PropertyStatus } from '@/lib/properties/types';
import SellerTourControl from '@/components/SellerTourControl';
import ListingActionsMenu from './ListingActionsMenu';
import { useSubscription } from '@/lib/postingPlans/hooks';
import { PLAN_FEATURES } from '@/lib/postingPlans/types';
import { isPromotedNow, promotionDaysLeft } from '@/lib/promotion/types';
import { getGalleryImages } from '@/lib/properties/gallery';

const STATUS_BADGE: Record<Listing['status'], string> = {
  Draft: 'bg-slate-100 text-slate-500',
  'Under Review': 'bg-blue-100 text-blue-700',
  Live: 'bg-green-100 text-green-700',
  'Off market': 'bg-slate-100 text-slate-500',
  'Needs attention': 'bg-red-100 text-red-700',
  Expired: 'bg-yellow-100 text-yellow-700',
};

// next/image throws synchronously during render (not just a network onError) when a listing's
// imageUrl isn't from an allowed host (see next.config.ts's remotePatterns) — one bad/stale
// record would otherwise crash this whole list, not just its own card. A plain onError handler
// can't catch this; only a render-phase error boundary can.
class ImageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      );
    }
    return this.props.children;
  }
}

const MARKET_STATUS_BADGE: Partial<Record<PropertyStatus, string>> = {
  draft: 'Draft',
  under_review: 'Under Review',
  unpublished: 'Off Market',
  archived: 'Archived',
  changes_requested: 'Changes Requested',
  rejected: 'Rejected',
};

// Draft/under_review aren't "something's wrong" the way rejected/unpublished/archived are — a
// draft is just unfinished, under_review is just pending. Only those latter three get the
// dimmed/grayscale "off market" treatment below.
const PROBLEM_STATUSES: PropertyStatus[] = ['unpublished', 'archived', 'changes_requested', 'rejected'];

// Set at posting time from the poster's plan tier (see payment-service's PLAN_EXPIRY_DAYS).
function expiryLabel(expiresAt?: string): string | null {
  if (!expiresAt) return null;
  const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (daysLeft <= 0) return 'Expired';
  if (daysLeft === 1) return 'Expires tomorrow';
  return `Expires in ${daysLeft} days`;
}

export default function ListingCard({
  listing,
  onEdit,
  onDelete,
  onSetMarketStatus,
  onAttachExistingWorld,
  onPromote,
  onSubmitDraft,
}: {
  listing: Listing;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onSetMarketStatus: (property: Property, status: PropertyStatus) => void;
  onAttachExistingWorld: (property: Property) => void;
  onPromote: (property: Property) => void;
  onSubmitDraft: (property: Property) => void;
}) {
  const isLeased = listing.status === 'Off market';
  const marketStatus: PropertyStatus = listing.property.status ?? 'published';
  const marketBadge = MARKET_STATUS_BADGE[marketStatus];
  const isOffMarket = PROBLEM_STATUSES.includes(marketStatus);
  const isDraft = marketStatus === 'draft';
  const reason = listing.property.statusReason;
  const subscription = useSubscription();
  const isPriority = PLAN_FEATURES[subscription.tier].priorityPlacement;
  const expiry = expiryLabel(listing.property.expiresAt);
  const promoted = isPromotedNow(listing.property);
  // Buyers only ever see 2 photos and no video on an unpromoted listing (enforced server-side,
  // see property-service's capMedia) — this is the seller's own view (always the full,
  // uncapped data), so it's the one place that can tell them what promoting would unlock.
  const PUBLIC_PHOTO_LIMIT = 2;
  const totalPhotos = getGalleryImages(listing.property).length;
  const hiddenPhotos = Math.max(0, totalPhotos - PUBLIC_PHOTO_LIMIT);
  const hasHiddenVideo = !!listing.property.videoUrl;
  const hasHiddenMedia = !promoted && (hiddenPhotos > 0 || hasHiddenVideo);

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
        ) : listing.image ? (
          <ImageErrorBoundary>
            <Image src={listing.image} alt={listing.title} fill className="object-cover" />
          </ImageErrorBoundary>
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
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
          <div className={`text-xs mt-0.5 ${isLeased ? 'text-slate-400' : 'text-slate-500'}`}>${listing.rent.toLocaleString()}{listing.property.type === 'rent' ? '/mo' : ''}</div>
          {isDraft && (
            <button type="button" onClick={() => onSubmitDraft(listing.property)} className="mt-1 text-left text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              Finish and submit this draft
            </button>
          )}
          {reason && marketStatus !== 'published' && (
            <div className="text-xs mt-1 font-semibold text-red-600">{reason}</div>
          )}
          {expiry && (
            <div className={`text-xs mt-1 font-semibold ${expiry === 'Expired' ? 'text-red-600' : 'text-slate-400'}`}>{expiry}</div>
          )}
          {promoted && (
            <div className="text-xs mt-1 font-semibold text-amber-600">Promoted · {promotionDaysLeft(listing.property)}d left</div>
          )}
          {hasHiddenMedia && (
            <button
              type="button"
              onClick={() => onPromote(listing.property)}
              className="mt-1 text-left text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              {hiddenPhotos > 0 && hasHiddenVideo
                ? `Buyers see 2 of ${totalPhotos} photos, no video — promote to show it all`
                : hiddenPhotos > 0
                  ? `Buyers see 2 of ${totalPhotos} photos — promote to show them all`
                  : 'Buyers can\'t see your video yet — promote to show it'}
            </button>
          )}
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
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <SellerTourControl property={listing.property} />
          <ListingActionsMenu listing={listing} marketStatus={marketStatus} onEdit={onEdit} onDelete={onDelete} onSetMarketStatus={onSetMarketStatus} onAttachExistingWorld={onAttachExistingWorld} onPromote={onPromote} onSubmitDraft={onSubmitDraft} />
        </div>
      </div>
    </div>
  );
}
