"use client";

import { useState } from "react";
import type { Listing } from "@/lib/manager/types";
import { Card } from "@/components/admin/ui";
import PricingCards from "@/components/postingPlans/PricingCards";
import PlanCheckout from "@/components/postingPlans/PlanCheckout";
import { useAllProperties } from "@/lib/sellerListings/hooks";
import { useSubscription } from "@/lib/postingPlans/hooks";
import { PLAN_FEATURES, PLAN_LABELS, type PlanTier } from "@/lib/postingPlans/types";
import { useLanguage } from "@/lib/i18n/language";

function UpgradeGate({ currentTier }: { currentTier: PlanTier }) {
  const { t } = useLanguage();
  const [checkoutTier, setCheckoutTier] = useState<Exclude<PlanTier, "free"> | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{t("Market Insights")}</h2>
        <p className="text-sm text-slate-500 mt-1">{t("Gold and Diamond plans compare your prices with similar listings in your city.")}</p>
      </div>
      <Card className="text-center py-10">
        <p className="font-bold text-slate-900 mb-1">{t("Market Insights is a Gold/Diamond feature")}</p>
        <p className="text-sm text-slate-500 mb-6">{t("You're on the {plan} plan. Upgrade to see how your listings are priced against the market.", { plan: t(PLAN_LABELS[currentTier]) })}</p>
        {checkoutTier ? (
          <div className="max-w-sm mx-auto text-left">
            <PlanCheckout mode={{ kind: "subscribe", tier: checkoutTier }} onClose={() => setCheckoutTier(null)} />
          </div>
        ) : (
          <PricingCards currentTier={currentTier} onSelect={(tier) => { if (tier !== "free") setCheckoutTier(tier); }} />
        )}
      </Card>
    </div>
  );
}

/** Compares each of this seller's for-sale listings with the other live for-sale listings in the
 *  same city, using real published listings from property-service. Land is left out (its price
 *  per m² sits on a different scale) and so is anything without a floor area. Gated to
 *  Gold/Diamond — see PLAN_FEATURES, the one place tier entitlements are decided. */
export default function MarketInsightsTab({ LISTINGS }: { LISTINGS: Listing[] }) {
  const { t } = useLanguage();
  const subscription = useSubscription();
  const market = useAllProperties();
  const comparable = (p: { type: string; sqm: number; propertyType: string }) => p.type === "sale" && p.sqm > 0 && p.propertyType !== "land";
  const mine = LISTINGS.filter((l) => l.status === "Live" && comparable(l.property));

  if (!PLAN_FEATURES[subscription.tier].marketInsights) {
    return <UpgradeGate currentTier={subscription.tier} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{t("Market Insights")}</h2>
        <p className="text-sm text-slate-500 mt-1">{t("How your for-sale listings compare with other live listings in the same city, by price per m².")}</p>
      </div>

      {mine.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">{t("Comparisons show up here once you have a live for-sale listing.")}</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {mine.map((listing) => {
            const city = listing.property.city;
            const others = market.filter((p) => p.id !== listing.id && p.ownerId !== listing.property.ownerId && comparable(p) && p.city.toLowerCase() === city.toLowerCase());
            const ownPerSqm = Math.round(listing.property.price / listing.property.sqm);
            if (others.length === 0) {
              return (
                <Card key={listing.id}>
                  <h3 className="font-bold text-slate-900 truncate mb-2">{listing.title}</h3>
                  <p className="text-sm text-slate-500">{t("Priced at ${price}/m². There aren't other live for-sale listings in {city} to compare with yet.", { price: ownPerSqm.toLocaleString(), city })}</p>
                </Card>
              );
            }
            const avg = Math.round(others.reduce((sum, p) => sum + p.price / p.sqm, 0) / others.length);
            const diffPct = Math.round(((ownPerSqm - avg) / avg) * 1000) / 10;
            const above = diffPct > 2;
            const below = diffPct < -2;
            return (
              <Card key={listing.id}>
                <div className="flex items-center justify-between mb-2 gap-3">
                  <h3 className="font-bold text-slate-900 truncate">{listing.title}</h3>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg shrink-0 ${above ? "bg-amber-100 text-amber-700" : below ? "bg-[#2ec440]/10 text-[#219b31]" : "bg-slate-100 text-slate-600"}`}>
                    {above ? t("{pct}% above market", { pct: diffPct }) : below ? t("{pct}% below market", { pct: Math.abs(diffPct) }) : t("At market")}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  {t(others.length === 1 ? "Priced at ${price}/m² vs. ${avg}/m² across {count} other listing in {city}." : "Priced at ${price}/m² vs. ${avg}/m² across {count} other listings in {city}.", { price: ownPerSqm.toLocaleString(), avg: avg.toLocaleString(), count: others.length, city })}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
