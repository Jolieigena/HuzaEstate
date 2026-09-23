"use client";

import { useState } from "react";
import type { Listing } from "@/lib/manager/types";
import { getDistrictTrend } from "@/lib/marketAnalytics/analyticsService";
import { MARKET_ANALYTICS_DISCLAIMER } from "@/lib/marketAnalytics/types";
import { Card } from "@/components/admin/ui";
import PricingCards from "@/components/postingPlans/PricingCards";
import PlanCheckout from "@/components/postingPlans/PlanCheckout";
import { useSubscription } from "@/lib/postingPlans/hooks";
import { PLAN_FEATURES, PLAN_LABELS, type PlanTier } from "@/lib/postingPlans/types";

function UpgradeGate({ currentTier }: { currentTier: PlanTier }) {
  const [checkoutTier, setCheckoutTier] = useState<Exclude<PlanTier, "free"> | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Market Insights</h2>
        <p className="text-sm text-slate-500 mt-1">Gold and Diamond plans include pricing comparisons against district averages.</p>
      </div>
      <Card className="text-center py-10">
        <p className="font-bold text-slate-900 mb-1">Market Insights is a Gold/Diamond feature</p>
        <p className="text-sm text-slate-500 mb-6">You&apos;re on the {PLAN_LABELS[currentTier]} plan. Upgrade to see how your listings are priced against the market.</p>
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

/** Manager-side tailoring of the same market data the customer Dashboard's
 *  Market Insights tab shows: instead of "should I sell", it's "how is my
 *  own listing priced against this district" — only meaningful for
 *  for-sale listings, since a district's $/m² trend is a sale-price series,
 *  not comparable to a monthly rent figure. Land is excluded too: bare land
 *  prices per m² sit on a completely different scale from a built house or
 *  apartment, so comparing a land listing's $/m² against a district average
 *  blended across property types produced wildly misleading percentages
 *  (1000%+) rather than a meaningful signal.
 *
 *  Gated to Gold/Diamond — see src/lib/postingPlans/types.ts's PLAN_FEATURES,
 *  the one place tier entitlements are decided. */
export default function MarketInsightsTab({ LISTINGS }: { LISTINGS: Listing[] }) {
  const subscription = useSubscription();
  const saleListings = LISTINGS.filter((l) => l.property.type === "sale" && l.property.sqm > 0 && l.property.propertyType !== "land");

  if (!PLAN_FEATURES[subscription.tier].marketInsights) {
    return <UpgradeGate currentTier={subscription.tier} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Market Insights</h2>
        <p className="text-sm text-slate-500 mt-1">How your for-sale listings compare to their district&apos;s average price per m².</p>
      </div>

      {saleListings.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">Pricing comparisons will show up here once you have a for-sale listing.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {saleListings.map((listing) => {
            const trend = getDistrictTrend(listing.property.city || listing.property.location);
            const districtPricePerSqm = trend.history[trend.history.length - 1].avgPricePerSqm;
            const listingPricePerSqm = Math.round(listing.property.price / listing.property.sqm);
            const diffPct = Math.round(((listingPricePerSqm - districtPricePerSqm) / districtPricePerSqm) * 1000) / 10;
            const above = diffPct > 2;
            const below = diffPct < -2;

            return (
              <Card key={listing.id}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 truncate">{listing.title}</h3>
                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-lg flex-shrink-0 ${
                      above ? "bg-amber-100 text-amber-700" : below ? "bg-[#2ec440]/10 text-[#219b31]" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {above ? `${diffPct}% above market` : below ? `${Math.abs(diffPct)}% below market` : "At market"}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  Priced at ${listingPricePerSqm.toLocaleString()}/m² vs. ${districtPricePerSqm.toLocaleString()}/m² average in {trend.district}
                  {trend.yoyChangePct !== 0 && ` (${trend.yoyChangePct > 0 ? "+" : ""}${trend.yoyChangePct}% YoY)`}.
                </p>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-400">{MARKET_ANALYTICS_DISCLAIMER}</p>
    </div>
  );
}
