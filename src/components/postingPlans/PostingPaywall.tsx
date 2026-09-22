"use client";

import { useState } from "react";
import PricingCards from "./PricingCards";
import PlanCheckout from "./PlanCheckout";
import { useSubscription } from "@/lib/postingPlans/hooks";
import { formatMoney } from "@/lib/finance/money";
import { PER_POST_PRICE, type PlanTier } from "@/lib/postingPlans/types";

type CheckoutMode = { kind: "subscribe"; tier: Exclude<PlanTier, "free"> } | { kind: "per_post" } | null;

/** Shown instead of the post-property form once PostingPlanService.canPost()
 *  is false. `onUnlocked` re-checks canPost() in the caller so the real
 *  form takes back over the moment a purchase succeeds — no page reload. */
export default function PostingPaywall({ accountId, onUnlocked }: { accountId: string; onUnlocked: () => void }) {
  const subscription = useSubscription(accountId);
  const [checkout, setCheckout] = useState<CheckoutMode>(null);

  if (checkout) {
    return (
      <div className="max-w-lg mx-auto py-10">
        <PlanCheckout
          accountId={accountId}
          mode={checkout}
          onClose={() => setCheckout(null)}
          onDone={() => {
            setCheckout(null);
            onUnlocked();
          }}
        />
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
    </div>
  );
}
