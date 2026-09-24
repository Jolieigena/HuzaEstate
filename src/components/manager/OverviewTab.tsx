import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { Listing, ListingStatusCounts } from '@/lib/manager/types';
import StatTile from '@/components/charts/StatTile';
import BarBreakdown from '@/components/charts/BarBreakdown';
import Dialog from '@/components/Dialog';
import PricingCards from '@/components/postingPlans/PricingCards';
import PlanCheckout from '@/components/postingPlans/PlanCheckout';
import { useSubscription } from '@/lib/postingPlans/hooks';
import { PLAN_LABELS, PLAN_LIMITS, type PlanTier } from '@/lib/postingPlans/types';

function PostingPlanCard() {
  const subscription = useSubscription();
  const [open, setOpen] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState<Exclude<PlanTier, 'free'> | null>(null);

  const limit = PLAN_LIMITS[subscription.tier];
  const used = subscription.postsUsed;

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-500">Posting Plan</div>
          <div className="text-lg font-black text-slate-900">
            {PLAN_LABELS[subscription.tier]} <span className="font-semibold text-slate-500 text-sm">· {used}{limit === null ? '' : `/${limit + subscription.extraCredits}`} posts used this month</span>
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="bg-slate-900 hover:bg-[#2ec440] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap">
          Manage Plan
        </button>
      </div>

      <Dialog open={open} onClose={() => { setOpen(false); setCheckoutTier(null); }} labelledBy="posting-plan-title" panelClassName="max-w-3xl p-6 sm:p-8">
        {checkoutTier ? (
          <PlanCheckout
            mode={{ kind: 'subscribe', tier: checkoutTier }}
            onClose={() => setCheckoutTier(null)}
          />
        ) : (
          <>
            <h2 id="posting-plan-title" className="text-xl font-bold text-slate-900 mb-6">Choose your posting plan</h2>
            <PricingCards currentTier={subscription.tier} onSelect={(tier) => { if (tier !== 'free') setCheckoutTier(tier); }} />
          </>
        )}
      </Dialog>
    </>
  );
}

function nextExpiryLabel(listings: Listing[]): string {
  const times = listings.filter((l) => l.status === 'Live').map((l) => (l.property.expiresAt ? new Date(l.property.expiresAt).getTime() : NaN)).filter((t) => !Number.isNaN(t));
  if (!times.length) return '—';
  const days = Math.ceil((Math.min(...times) - Date.now()) / (24 * 60 * 60 * 1000));
  return days <= 0 ? 'Expired' : days === 1 ? '1 day' : `${days} days`;
}

export default function OverviewTab({ LISTINGS, statusCounts, topListings }: {
  LISTINGS: Listing[];
  statusCounts: ListingStatusCounts;
  topListings: Listing[];
}) {
  const subscription = useSubscription();
  const limit = PLAN_LIMITS[subscription.tier];

  return (
    <div className="flex flex-col gap-6">
      <PostingPlanCard />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatTile label="Live Listings" value={String(statusCounts.Live)} />
        <StatTile label="Posts This Month" value={limit === null ? `${subscription.postsUsed}` : `${subscription.postsUsed} / ${limit + subscription.extraCredits}`} />
        <StatTile label="Current Plan" value={PLAN_LABELS[subscription.tier]} />
        <StatTile label="Next Listing Expiry" value={nextExpiryLabel(LISTINGS)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 pb-4">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Your Listings</h3>
            <p className="text-sm text-slate-500">Inquiries from buyers and renters show up as leads.</p>
          </div>
          {topListings.length ? (
            <div className="divide-y divide-slate-50">
              {topListings.map(listing => (
                <div key={listing.id} className="flex items-center gap-4 px-6 md:px-8 py-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0">
                    <Image src={listing.image} alt={listing.title} fill className="object-cover" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="font-bold text-slate-900 truncate">{listing.title}</div>
                    <div className="text-xs text-slate-500">{listing.views.toLocaleString()} views · {listing.leads} leads</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 md:px-8 pb-8 text-sm text-slate-500">
              You haven&apos;t posted anything yet. <Link href="/post-property" className="font-bold text-[#219b31] hover:underline">Add your first property</Link>.
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
          <h3 className="font-bold text-slate-900 text-lg mb-1">Portfolio Status</h3>
          <p className="text-sm text-slate-500 mb-6">{LISTINGS.length} total {LISTINGS.length === 1 ? 'listing' : 'listings'}</p>
          <BarBreakdown
            items={[
              { label: 'Live', value: statusCounts.Live, color: '#0ca30c' },
              { label: 'Off market', value: statusCounts['Off market'], color: '#94a3b8' },
              { label: 'Needs attention', value: statusCounts['Needs attention'], color: '#d03b3b' },
              { label: 'Expired', value: statusCounts.Expired, color: '#fab219' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
