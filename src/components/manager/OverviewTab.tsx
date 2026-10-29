'use client';

import Image from 'next/image';
import { useLanguage } from '@/lib/i18n/language';
import Link from 'next/link';
import type { Listing, ListingStatus, ListingStatusCounts } from '@/lib/manager/types';
import StatTile from '@/components/charts/StatTile';
import PortfolioOverview from './PortfolioOverview';
import { useSubscription } from '@/lib/postingPlans/hooks';
import { PLAN_LABELS, PLAN_LIMITS } from '@/lib/postingPlans/types';
import { formatLongDate } from '@/components/postingPlans/RedeemAccessCode';

function PostingPlanCard({ onOpenPlan }: { onOpenPlan: () => void }) {
  const { t } = useLanguage();
  const subscription = useSubscription();
  const limit = PLAN_LIMITS[subscription.tier];
  const used = subscription.postsUsed;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="text-sm font-semibold text-slate-500">{t('Posting Plan')}</div>
        <div className="text-lg font-black text-slate-900">
          {PLAN_LABELS[subscription.tier]} <span className="font-semibold text-slate-500 text-sm">· {t('{count} posts used this month', { count: `${used}${limit === null ? '' : `/${limit + subscription.extraCredits}`}` })}</span>
        </div>
        {subscription.accessGrant && (
          <div className="text-sm font-semibold text-emerald-700 mt-1">
            {t('Access code: {label} until {date}', { label: subscription.accessGrant.label, date: formatLongDate(subscription.accessGrant.endsAt) })}
            {subscription.source === 'code' ? '' : ` ${t('(your paid plan is already as good or better)')}`}
          </div>
        )}
        {subscription.cancelAtPeriodEnd && subscription.renewsOn && (
          <div className="text-sm font-semibold text-amber-600 mt-1">{t("Won't renew — ends {date}", { date: formatLongDate(subscription.renewsOn) })}</div>
        )}
      </div>
      <button onClick={onOpenPlan} className="bg-slate-900 hover:bg-[#2ec440] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap">
        {t('Manage Plan')}
      </button>
    </div>
  );
}

function nextExpiryLabel(listings: Listing[], t: (text: string, values?: Record<string, string | number>) => string): string {
  const times = listings.filter((l) => l.status === 'Live').map((l) => (l.property.expiresAt ? new Date(l.property.expiresAt).getTime() : NaN)).filter((t) => !Number.isNaN(t));
  if (!times.length) return '—';
  const days = Math.ceil((Math.min(...times) - Date.now()) / (24 * 60 * 60 * 1000));
  return days <= 0 ? t('Expired') : days === 1 ? t('1 day') : t('{count} days', { count: days });
}

export default function OverviewTab({ LISTINGS, statusCounts, topListings, onOpenListings, onOpenPlan }: {
  LISTINGS: Listing[];
  statusCounts: ListingStatusCounts;
  topListings: Listing[];
  /** Jump to My Listings, filtered to a status. */
  onOpenListings: (status: ListingStatus | 'all') => void;
  /** Go to the Plan & Billing tab. */
  onOpenPlan: () => void;
}) {
  const { t } = useLanguage();
  const subscription = useSubscription();
  const limit = PLAN_LIMITS[subscription.tier];

  return (
    <div className="flex flex-col gap-6">
      <PostingPlanCard onOpenPlan={onOpenPlan} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatTile label={t('Live Listings')} value={String(statusCounts.Live)} />
        <StatTile label={t('Posts This Month')} value={limit === null ? `${subscription.postsUsed}` : `${subscription.postsUsed} / ${limit + subscription.extraCredits}`} />
        <StatTile label={t('Current Plan')} value={t(PLAN_LABELS[subscription.tier])} />
        <StatTile label={t('Next Listing Expiry')} value={nextExpiryLabel(LISTINGS, t)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 pb-4">
            <h3 className="font-bold text-slate-900 text-lg mb-1">{t('Your Listings')}</h3>
            <p className="text-sm text-slate-500">{t('Inquiries from buyers and renters show up as leads.')}</p>
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
                    <div className="text-xs text-slate-500">{t('{views} views · {leads} leads', { views: listing.views.toLocaleString(), leads: listing.leads })}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 md:px-8 pb-8 text-sm text-slate-500">
              {t("You haven't posted anything yet.")} <Link href="/post-property" className="font-bold text-[#219b31] hover:underline">{t('Add your first property')}</Link>.
            </div>
          )}
        </div>

        <PortfolioOverview listings={LISTINGS} statusCounts={statusCounts} onOpenListings={onOpenListings} />
      </div>
    </div>
  );
}
