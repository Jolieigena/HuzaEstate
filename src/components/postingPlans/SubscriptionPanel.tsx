"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { formatMoney } from "@/lib/finance/money";
import { openBillingPortal, resumeSubscription } from "@/lib/postingPlans/api";
import { notifySubscriptionChanged, useSubscription } from "@/lib/postingPlans/hooks";
import { PLAN_EXPIRY_DAYS, PLAN_FEATURES, PLAN_LABELS, PLAN_PRICES, type PlanTier } from "@/lib/postingPlans/types";
import { useToast } from "@/lib/toast-context";
import { formatLongDate } from "./RedeemAccessCode";

/** "Your plan": what the seller is on, how much of this month's posting they've used, and the billing
 *  controls that go with a paid plan (automatic monthly payment, card and invoices, cancelling). */
/** The plan the upgrade button offers: the next one up from what the seller pays for. Free goes to Gold, the
 *  one most sellers pick; someone on an access code is offered a subscription to the plan the code gives, to
 *  keep it once the code ends. Nothing is offered on Diamond, the top plan. */
function upgradeTarget(paidTier: PlanTier, effectiveTier: PlanTier, onCode: boolean): { tier: Exclude<PlanTier, "free">; label: string } | null {
  if (onCode && effectiveTier !== "free") return { tier: effectiveTier as Exclude<PlanTier, "free">, label: `Subscribe to keep ${PLAN_LABELS[effectiveTier]}` };
  const next: Partial<Record<PlanTier, Exclude<PlanTier, "free">>> = { free: "gold", silver: "gold", gold: "diamond" };
  const tier = next[paidTier];
  return tier ? { tier, label: `Upgrade to ${PLAN_LABELS[tier]}` } : null;
}

export default function SubscriptionPanel({ onCancel, onUpgrade }: { onCancel: () => void; onUpgrade: (tier: Exclude<PlanTier, "free">) => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const subscription = useSubscription();
  const [busy, setBusy] = useState<"resume" | "portal" | null>(null);

  const tier = subscription.tier;
  const paid = subscription.paidTier !== "free" && subscription.status !== "canceled";
  const autoRenew = !subscription.cancelAtPeriodEnd;
  const pastDue = subscription.status === "past_due";
  const renewDate = subscription.renewsOn ? formatLongDate(subscription.renewsOn) : null;

  const cap = subscription.postsLimit === null ? null : subscription.postsLimit + subscription.extraCredits;
  const used = subscription.postsUsed;
  const percent = cap === null || cap === 0 ? 0 : Math.min(Math.round((used / cap) * 100), 100);
  const features = PLAN_FEATURES[tier];
  const upgrade = upgradeTarget(subscription.paidTier, tier, subscription.source === "code");

  const turnOn = async () => {
    if (!token || busy) return;
    setBusy("resume");
    const result = await resumeSubscription(token);
    setBusy(null);
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    notifySubscriptionChanged();
    showToast("Automatic monthly payment is on.");
  };

  const managePayment = async () => {
    if (!token || busy) return;
    setBusy("portal");
    const result = await openBillingPortal(token, window.location.href);
    if (!result.ok) {
      setBusy(null);
      showToast(result.error, "error");
      return;
    }
    window.location.href = result.url;
  };

  const status = pastDue ? { label: "Payment failed", style: "bg-amber-50 text-amber-700" } : paid && !autoRenew ? { label: "Ends soon", style: "bg-amber-50 text-amber-700" } : { label: "Active", style: "bg-emerald-50 text-emerald-700" };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-semibold text-slate-900">{PLAN_LABELS[tier]}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.style}`}>{status.label}</span>
            {subscription.source === "code" && <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">Access code</span>}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {subscription.source === "code" && subscription.accessGrant
              ? `Included until ${formatLongDate(subscription.accessGrant.endsAt)}`
              : paid
                ? `${formatMoney(PLAN_PRICES[subscription.paidTier as keyof typeof PLAN_PRICES])} per month · ${autoRenew ? (renewDate ? `renews ${renewDate}` : "renews monthly") : renewDate ? `ends ${renewDate}` : "ends this period"}`
                : "Free forever. Upgrade any time."}
          </p>

          <div className="mt-5 max-w-md">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-slate-700">Posts this month</span>
              <span className="text-slate-500">{cap === null ? `${used} used · unlimited` : `${used} of ${cap} used`}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={cap ?? undefined} aria-valuenow={used} aria-label="Posts used this month">
              <div className={`h-full rounded-full transition-all ${percent >= 100 ? "bg-red-400" : percent >= 80 ? "bg-amber-400" : "bg-[#2ec440]"}`} style={{ width: cap === null ? "8%" : `${percent}%` }} />
            </div>
          </div>

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-600">
            <li>Listings live {PLAN_EXPIRY_DAYS[tier]} days</li>
            {features.priorityPlacement && <li>Priority placement</li>}
            {features.marketInsights && <li>Market Insights</li>}
          </ul>

          {upgrade && (
            <button type="button" onClick={() => onUpgrade(upgrade.tier)} className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2ec440]">
              {upgrade.label}
            </button>
          )}
        </div>

        {paid && (
          <div className="md:w-72">
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <span>
                <span className="block text-sm font-medium text-slate-800">Automatic monthly payment</span>
                <span className="block text-xs text-slate-500">{autoRenew ? "On" : "Off"}</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={autoRenew}
                disabled={busy === "resume"}
                onClick={() => (autoRenew ? onCancel() : turnOn())}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${autoRenew ? "bg-[#2ec440]" : "bg-slate-300"}`}
              >
                <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${autoRenew ? "translate-x-4" : ""}`} />
              </button>
            </label>
            <div className="mt-3 flex flex-col items-start gap-1.5 text-sm font-medium">
              <button type="button" onClick={managePayment} disabled={busy === "portal"} className="text-[#219b31] hover:underline disabled:opacity-50">
                {busy === "portal" ? "Opening…" : "Update payment method & invoices"}
              </button>
              {autoRenew && (
                <button type="button" onClick={onCancel} className="text-red-600 hover:underline">
                  Cancel subscription
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {pastDue && <p className="border-t border-amber-100 bg-amber-50 px-6 py-3 text-sm text-amber-800">Your last payment didn&apos;t go through. Update your payment method to keep your plan.</p>}
    </section>
  );
}
