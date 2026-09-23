"use client";

import { useState } from "react";
import PricingCards from "./PricingCards";
import PlanCheckout from "./PlanCheckout";
import { useSubscription } from "@/lib/postingPlans/hooks";
import { formatMoney } from "@/lib/finance/money";
import { PER_POST_PRICE, type PlanTier } from "@/lib/postingPlans/types";

type CheckoutMode = { kind: "subscribe"; tier: Exclude<PlanTier, "free"> } | { kind: "per_post" } | null;

// Shown when property-service rejects a post because the account's monthly quota is exhausted
// (see post-property/page.tsx's handleSubmit, which attempts the post first and only shows this
// on a 403). Real Stripe Checkout is a redirect flow, so there's no "unlocked" callback any
// more — after payment, Stripe redirects back to the same page and the next post attempt is
// checked fresh against the now-updated quota.
export default function PostingPaywall({ onClose }: { onClose: () => void }) {
  const subscription = useSubscription();
  const [checkout, setCheckout] = useState<CheckoutMode>(null);

  if (checkout) {
    return (
      <div className="max-w-lg mx-auto py-10">
        <PlanCheckout mode={checkout} onClose={() => setCheckout(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-slate-900 mb-2">You&apos;ve used your free posts this month</h2>
        <p className="text-slate-500">Pick a plan below, or pay once to publish just this listing.</p>
      </div>

      <PricingCards
        currentTier={subscription.tier}
        onSelect={(tier) => {
          if (tier === "free") return;
          setCheckout({ kind: "subscribe", tier });
        }}
      />

      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="w-full max-w-sm border-t border-slate-200 pt-6 text-center">
          <p className="text-sm text-slate-500 mb-3">Just this once</p>
          <button
            onClick={() => setCheckout({ kind: "per_post" })}
            className="bg-white border border-slate-300 hover:border-slate-900 text-slate-900 font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Pay {formatMoney(PER_POST_PRICE)} to post once
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
          Back to the form
        </button>
      </div>
    </div>
  );
}
