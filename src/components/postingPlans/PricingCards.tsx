import type { PlanTier } from "@/lib/postingPlans/types";
import { PLAN_EXPIRY_DAYS, PLAN_FEATURES, PLAN_LABELS, PLAN_LIMITS, PLAN_PRICES } from "@/lib/postingPlans/types";
import { formatMoney } from "@/lib/finance/money";

const TIERS: PlanTier[] = ["free", "silver", "gold", "diamond"];

// What really separates the plans, in the order people compare them: how many posts, how long a listing stays up, and
// the two perks. Everything else is kept off the cards.
const PRIORITY = "Priority placement: shown above standard listings";
const FEATURES: Record<PlanTier, string[]> = {
  free: ["2 listing posts / month", `Listings stay live ${PLAN_EXPIRY_DAYS.free} days`, "Extra posts: $3 each"],
  silver: ["3 listing posts / month", `Listings stay live ${PLAN_EXPIRY_DAYS.silver} days`, "Extra posts: $3 each"],
  gold: ["10 listing posts / month", `Listings stay live ${PLAN_EXPIRY_DAYS.gold} days`, PRIORITY, "Market Insights access", "Extra posts: $3 each"],
  diamond: ["Unlimited listing posts", `Listings stay live ${PLAN_EXPIRY_DAYS.diamond} days`, PRIORITY, "Market Insights access"],
};

const RECOMMENDED: PlanTier = "gold";
const RANK: Record<PlanTier, number> = { free: 0, silver: 1, gold: 2, diamond: 3 };

function buttonLabel(tier: PlanTier, currentTier?: PlanTier): string {
  if (currentTier === undefined) return tier === "free" ? "Get Started Free" : `Get Started ${PLAN_LABELS[tier]}`;
  if (tier === currentTier) return "Current Plan";
  if (tier === "free") return "Downgrade";
  return RANK[tier] > RANK[currentTier] ? `Upgrade to ${PLAN_LABELS[tier]}` : `Switch to ${PLAN_LABELS[tier]}`;
}

const yesNo = (value: boolean) => (value ? "Yes" : "—");

/** Claude-pricing-page shaped: a card per tier, a short feature checklist,
 *  one tier visually highlighted, and the current plan shown as disabled
 *  rather than clickable. `currentTier` is optional — omit it entirely on a
 *  pre-account page like /sell, where the visitor has no plan yet and every
 *  card (including Free) should be a live choice, not just the paid ones. */
export default function PricingCards({
  currentTier,
  onSelect,
}: {
  currentTier?: PlanTier;
  onSelect: (tier: PlanTier) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map((tier) => {
          const isCurrent = currentTier !== undefined && tier === currentTier;
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
                {buttonLabel(tier, currentTier)}
              </button>

              {tier !== "free" && <p className="text-[11px] text-slate-500 mt-2">Billed monthly, cancel any time</p>}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs font-medium text-slate-500">Monthly posts reset on the 1st of each month.</p>

      <details className="group mt-4 rounded-2xl border border-slate-200 bg-white">
        <summary className="cursor-pointer list-none px-5 py-3.5 text-sm font-bold text-slate-700 hover:text-slate-900 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between">
            Compare plans
            <svg className="h-4 w-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </summary>
        <div className="overflow-x-auto border-t border-slate-100 px-2 pb-2">
          <table className="w-full min-w-[34rem] text-left text-[13px] text-slate-600">
            <thead>
              <tr className="text-slate-900">
                <th className="px-3 py-3 font-bold" />
                {TIERS.map((tier) => (
                  <th key={tier} className="px-3 py-3 font-bold">
                    {PLAN_LABELS[tier]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <th className="px-3 py-2.5 font-semibold text-slate-700">Price</th>
                {TIERS.map((tier) => (
                  <td key={tier} className="px-3 py-2.5">
                    {tier === "free" ? "$0" : `${formatMoney(PLAN_PRICES[tier])}/month`}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="px-3 py-2.5 font-semibold text-slate-700">Listing posts per month</th>
                {TIERS.map((tier) => (
                  <td key={tier} className="px-3 py-2.5">
                    {PLAN_LIMITS[tier] === null ? "Unlimited" : PLAN_LIMITS[tier]}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="px-3 py-2.5 font-semibold text-slate-700">Listing stays live</th>
                {TIERS.map((tier) => (
                  <td key={tier} className="px-3 py-2.5">
                    {PLAN_EXPIRY_DAYS[tier]} days
                  </td>
                ))}
              </tr>
              <tr>
                <th className="px-3 py-2.5 font-semibold text-slate-700">Priority placement</th>
                {TIERS.map((tier) => (
                  <td key={tier} className="px-3 py-2.5">
                    {yesNo(PLAN_FEATURES[tier].priorityPlacement)}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="px-3 py-2.5 font-semibold text-slate-700">Market Insights</th>
                {TIERS.map((tier) => (
                  <td key={tier} className="px-3 py-2.5">
                    {yesNo(PLAN_FEATURES[tier].marketInsights)}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="px-3 py-2.5 font-semibold text-slate-700">Extra posts</th>
                {TIERS.map((tier) => (
                  <td key={tier} className="px-3 py-2.5">
                    {PLAN_LIMITS[tier] === null ? "Not needed" : "Available anytime"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
