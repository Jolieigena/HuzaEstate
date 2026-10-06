import { useState } from 'react';
import Dialog from '@/components/Dialog';
import PricingCards from '@/components/postingPlans/PricingCards';
import PlanCheckout from '@/components/postingPlans/PlanCheckout';
import CancelPlanConfirm from '@/components/postingPlans/CancelPlanConfirm';
import SubscriptionPanel from '@/components/postingPlans/SubscriptionPanel';
import RedeemAccessCode from '@/components/postingPlans/RedeemAccessCode';
import { formatMoney } from '@/lib/finance/money';
import { useSubscription } from '@/lib/postingPlans/hooks';
import { PER_POST_PRICE, type PlanTier } from '@/lib/postingPlans/types';

type Checkout = { kind: 'subscribe'; tier: Exclude<PlanTier, 'free'> } | { kind: 'per_post' } | null;

/** Plan & billing: where a seller sees what they're on, changes it, and manages payment. A page of its
 *  own (not a pop-up) because there's a lot on it: the current plan, four plans to compare, an access
 *  code, and billing controls. Only the short steps (paying, confirming a cancellation) open as dialogs. */
export default function PlanTab() {
  const subscription = useSubscription();
  const [checkout, setCheckout] = useState<Checkout>(null);
  const [cancelling, setCancelling] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <SubscriptionPanel onCancel={() => setCancelling(true)} onUpgrade={(tier) => setCheckout({ kind: 'subscribe', tier })} />

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Plans</h3>
            <p className="text-sm text-slate-500">Change plan any time. Upgrades apply straight away.</p>
          </div>
        </div>
        <PricingCards
          currentTier={subscription.paidTier}
          onSelect={(tier) => {
            if (tier === 'free') {
              if (subscription.paidTier !== 'free' && !subscription.cancelAtPeriodEnd) setCancelling(true);
            } else {
              setCheckout({ kind: 'subscribe', tier });
            }
          }}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">Access code</h3>
          <p className="mb-3 text-sm text-slate-500">Redeem a code to use a paid plan for a set number of days.</p>
          <RedeemAccessCode defaultOpen />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">Just one more post?</h3>
          <p className="mb-3 text-sm text-slate-500">Pay {formatMoney(PER_POST_PRICE)} for a single extra listing without changing plan.</p>
          <button type="button" onClick={() => setCheckout({ kind: 'per_post' })} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-900">
            Buy one extra post
          </button>
        </div>
      </section>

      <Dialog open={checkout !== null} onClose={() => setCheckout(null)} labelledBy="plan-checkout-title" panelClassName="max-w-lg p-2">
        {checkout && <PlanCheckout mode={checkout} onClose={() => setCheckout(null)} />}
      </Dialog>

      <Dialog open={cancelling} onClose={() => setCancelling(false)} labelledBy="plan-cancel-title" panelClassName="max-w-md">
        {cancelling && <CancelPlanConfirm tier={subscription.paidTier} renewsOn={subscription.renewsOn} onClose={() => setCancelling(false)} />}
      </Dialog>
    </div>
  );
}
