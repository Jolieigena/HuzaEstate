"use client";

import { useState } from "react";
import PricingCards from "./PricingCards";
import PlanCheckout from "./PlanCheckout";
import RedeemAccessCode from "./RedeemAccessCode";
import { useSubscription } from "@/lib/postingPlans/hooks";
import { usePlanMoney } from "@/lib/postingPlans/usePlanMoney";
import { PER_POST_PRICE, type PlanTier } from "@/lib/postingPlans/types";
import { useAuth } from "@/lib/auth-context";
import { discounted, useMyDiscount } from "@/lib/clientDiscounts/api";
import ConfirmEmailForDiscount from "@/components/shared/ConfirmEmailForDiscount";
import { useLanguage } from "@/lib/i18n/language";
import { useIsNativeIosApp } from "@/lib/nativeApp";

type CheckoutMode = { kind: "subscribe"; tier: Exclude<PlanTier, "free"> } | { kind: "per_post" } | null;

// Shown when property-service rejects a post because the account's monthly quota is exhausted
// (see post-property/page.tsx's handleSubmit, which attempts the post first and only shows this
// on a 403). Real Stripe Checkout is a redirect flow, so there's no "unlocked" callback any
// more — after payment, Stripe redirects back to the same page and the next post attempt is
// checked fresh against the now-updated quota.
export default function PostingPaywall({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const { show } = usePlanMoney();
  const { token: discountToken } = useAuth();
  const postDiscount = useMyDiscount(discountToken, "extra_post");
  const postPrice = postDiscount ? discounted(PER_POST_PRICE, postDiscount.percent) : PER_POST_PRICE;
  const subscription = useSubscription();
  const [checkout, setCheckout] = useState<CheckoutMode>(null);
  const iosApp = useIsNativeIosApp();

  // The iPhone app does not sell plans or extra posts (App Store rule 3.1.1): only say the limit was reached.
  if (iosApp) {
    return (
      <div className="max-w-lg mx-auto py-10 text-center">
        <h2 className="text-2xl font-black text-slate-900 mb-2">{t("You've used your free posts this month")}</h2>
        <p className="text-slate-500 mb-6">{t("You can't add more listings right now.")}</p>
        <button onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-slate-800">{t("Back to the form")}</button>
      </div>
    );
  }

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
        <h2 className="text-2xl font-black text-slate-900 mb-2">{t("You've used your free posts this month")}</h2>
        <p className="text-slate-500">{t("Pick a plan below, or pay once to publish just this listing.")}</p>
      </div>

      <ConfirmEmailForDiscount token={discountToken} className="mb-8" />

      <PricingCards
        currentTier={subscription.paidTier}
        onSelect={(tier) => {
          if (tier === "free") return;
          setCheckout({ kind: "subscribe", tier });
        }}
      />

      <div className="mt-6 mx-auto max-w-xl">
        <RedeemAccessCode defaultOpen />
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="w-full max-w-sm border-t border-slate-200 pt-6 text-center">
          <p className="text-sm text-slate-500 mb-3">{t("Just this once")}</p>
          <button
            onClick={() => setCheckout({ kind: "per_post" })}
            className="bg-white border border-slate-300 hover:border-slate-900 text-slate-900 font-bold px-6 py-3 rounded-xl transition-colors"
          >
            {t("Pay {price} to post once", { price: show(postPrice) })}
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
          {t("Back to the form")}
        </button>
      </div>
    </div>
  );
}
