import type { PlanTier } from "@/lib/postingPlans/types";
import { PLAN_LABELS, PLAN_LIMITS, PLAN_PRICES } from "@/lib/postingPlans/types";
import { formatMoney } from "@/lib/finance/money";

const TIERS: PlanTier[] = ["free", "silver", "gold", "diamond"];

const FEATURES: Record<PlanTier, string[]> = {
  free: ["2 listing posts / month", "Standard listing placement", "Pay-per-post available anytime"],
  silver: ["3 listing posts / month", "Standard listing placement", "Pay-per-post available anytime"],
  gold: ["10 listing posts / month", "Priority listing placement", "Market Insights access", "Pay-per-post available anytime"],
  diamond: ["Unlimited listing posts", "Priority listing placement", "Market Insights access", "No pay-per-post needed"],
};

const RECOMMENDED: PlanTier = "gold";

/** Claude-pricing-page shaped: a card per tier, a short feature checklist,
 *  one tier visually highlighted, and the current plan shown as disabled
 *  rather than clickable. */
export default function PricingCards({
  currentTier,
  onSelect,
}: {
  currentTier: PlanTier;
  onSelect: (tier: PlanTier) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {TIERS.map((tier) => {
        const isCurrent = tier === currentTier;
        const isRecommended = tier === RECOMMENDED;
        const price = tier === "free" ? null : PLAN_PRICES[tier];

        return (
          <div
            key={tier}
            className={`relative flex flex-col rounded-2xl border p-5 ${
              isRecommended ? "border-[#2ec440] bg-[#2ec440]/[0.03] shadow-md" : "border-slate-200 bg-white"
            }`}
          >
            {isRecommended && (
              <span className="absolute -top-3 left-5 bg-[#2ec440] text-white text-[11px] font-bold px-2.5 py-1 rounded-full">Most Popular</span>
            )}

            <h3 className="font-bold text-slate-900 text-[15px]">{PLAN_LABELS[tier]}</h3>
            <div className="mt-2 mb-4">
              <span className="text-2xl font-black text-slate-900">{price ? formatMoney(price) : "$0"}</span>
              <span className="text-slate-500 text-sm font-medium">{tier === "free" ? "" : "/month"}</span>
            </div>

            <ul className="flex flex-col gap-2 mb-6 flex-1">
              {FEATURES[tier].map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-slate-600">
                  <svg className="w-4 h-4 text-[#2ec440] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <button
              type="button"
              disabled={isCurrent}
              onClick={() => onSelect(tier)}
              className={`w-full py-2.5 rounded-xl font-bold text-[13px] transition-colors ${
                isCurrent
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : isRecommended
                  ? "bg-[#2ec440] hover:bg-[#28b039] text-white"
                  : "bg-slate-900 hover:bg-[#2ec440] text-white"
              }`}
            >
              {isCurrent ? "Current Plan" : tier === "free" ? "Downgrade" : `Choose ${PLAN_LABELS[tier]}`}
            </button>

            <p className="text-[11px] text-slate-400 mt-2">{PLAN_LIMITS[tier] === null ? "No monthly cap" : `Up to ${PLAN_LIMITS[tier]}/month`}</p>
          </div>
        );
      })}
    </div>
  );
}
