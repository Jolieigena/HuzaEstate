"use client";

import { useState } from 'react';
import Dialog from '../Dialog';
import { useAuth } from '@/lib/auth-context';
import { formatMoney } from '@/lib/finance/money';
import { PROMOTION_PACKAGES, isPromotedNow, promotionDaysLeft } from '@/lib/promotion/types';
import { createPromoteCheckout } from '@/lib/promotion/api';
import { getGalleryImages } from '@/lib/properties/gallery';
import type { Property } from '@/lib/properties/types';

// Kept in sync with property-service's own PUBLIC_PHOTO_LIMIT (capMedia in
// modules/properties/service.ts) — buyers see this many photos, no video, until promoted.
const PUBLIC_PHOTO_LIMIT = 2;

interface PromoteListingModalProps {
  property: Property | null;
  onClose: () => void;
}

/** Pay to pin a listing to the top of /properties for a set number of days — see
 *  lib/promotion/types.ts. Real Stripe Checkout, same end-to-end pattern as become-a-seller's
 *  paid-tier flow: redirect to Stripe, land back on /manager, reconcile there (see
 *  ManagerDashboard's own reconcile effect). promotedUntil itself is only ever set by
 *  property-service's internal, payment-verified endpoint — never directly by this page. */
export default function PromoteListingModal({ property, onClose }: PromoteListingModalProps) {
  const { token } = useAuth();
  const [selectedDays, setSelectedDays] = useState(PROMOTION_PACKAGES[1].days);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [demoMode, setDemoMode] = useState(false);

  const [openedFor, setOpenedFor] = useState(property?.id);
  if (property && property.id !== openedFor) {
    setOpenedFor(property.id);
    setSelectedDays(PROMOTION_PACKAGES[1].days);
    setError('');
    setDemoMode(false);
  }

  if (!property) return null;

  const alreadyActive = isPromotedNow(property);
  const daysLeft = promotionDaysLeft(property);
  const selectedPackage = PROMOTION_PACKAGES.find((p) => p.days === selectedDays) ?? PROMOTION_PACKAGES[0];
  const hiddenPhotos = Math.max(0, getGalleryImages(property).length - PUBLIC_PHOTO_LIMIT);
  const hasHiddenVideo = !!property.videoUrl;

  const handleConfirm = async () => {
    if (!token || submitting) return;
    setSubmitting(true);
    setError('');
    const successUrl = `${window.location.origin}/manager?promoted=1`;
    const cancelUrl = `${window.location.origin}/manager`;
    const result = await createPromoteCheckout(token, property.id, selectedDays, successUrl, cancelUrl);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    if ('demo' in result) {
      setDemoMode(true);
      setSubmitting(false);
      return;
    }
    window.location.href = result.url;
  };

  if (demoMode) {
    return (
      <Dialog open onClose={onClose} labelledBy="promote-demo-title" panelClassName="max-w-md p-6 sm:p-8" backdropClassName="bg-slate-900/25">
        <h2 id="promote-demo-title" className="text-lg font-black text-slate-900 mb-3">Payments aren&apos;t configured yet</h2>
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Checkout for promoting a listing isn&apos;t available in this environment yet — no charge was made. An administrator can promote it manually in the meantime.
        </div>
        <button onClick={onClose} className="w-full bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3 rounded-xl transition-colors">
          Close
        </button>
      </Dialog>
    );
  }

  return (
    <Dialog open={Boolean(property)} onClose={onClose} labelledBy="promote-listing-title" panelClassName="max-w-lg p-6 sm:p-8" backdropClassName="bg-slate-900/25">
      <div className="flex items-center justify-between mb-2">
        <h2 id="promote-listing-title" className="text-xl font-bold text-slate-900">Promote this listing</h2>
        <button onClick={onClose} data-dialog-close className="text-slate-400 hover:text-slate-900 transition-colors" aria-label="Close">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-5">
        Pin <span className="font-semibold text-slate-700">{property.title}</span> to the top row of Browse Properties for buyers, with an eye-catching badge on the card
        {!alreadyActive && (hiddenPhotos > 0 || hasHiddenVideo) ? (
          <>
            {' '}— and show buyers {hiddenPhotos > 0 ? `all ${hiddenPhotos + PUBLIC_PHOTO_LIMIT} of your photos` : ''}
            {hiddenPhotos > 0 && hasHiddenVideo ? ' and ' : ''}
            {hasHiddenVideo ? 'your video' : ''}, not just a preview.
          </>
        ) : '.'}
      </p>

      {alreadyActive && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-medium">
          Already promoted — {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left. Confirming below extends it from today.
        </div>
      )}

      {error && (
        <p className="mb-5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3">{error}</p>
      )}

      <div className="grid grid-cols-3 gap-3 mb-5">
        {PROMOTION_PACKAGES.map((pkg) => (
          <button
            key={pkg.days}
            type="button"
            onClick={() => setSelectedDays(pkg.days)}
            className={`rounded-xl border-2 px-3 py-4 text-center transition-colors ${
              selectedDays === pkg.days ? 'border-[#2ec440] bg-[#2ec440]/5' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-lg font-black text-slate-900">{pkg.days}d</div>
            <div className="text-sm font-bold text-slate-700 mt-1">{formatMoney(pkg.price)}</div>
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400 mb-2">You&apos;ll complete payment securely with Stripe next.</p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="flex-1 bg-slate-900 hover:bg-[#2ec440] text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-lg disabled:opacity-60 whitespace-nowrap"
        >
          {submitting ? 'Redirecting…' : `Continue to Payment — ${formatMoney(selectedPackage.price)}`}
        </button>
        <button type="button" onClick={onClose} className="px-6 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
          Cancel
        </button>
      </div>
    </Dialog>
  );
}
