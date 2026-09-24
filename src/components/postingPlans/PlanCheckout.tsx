"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { formatMoney } from "@/lib/finance/money";
import { PLAN_LABELS, PLAN_PRICES, PER_POST_PRICE, type PlanTier } from "@/lib/postingPlans/types";
import { createPerPostCheckout, createSubscribeCheckout } from "@/lib/postingPlans/api";
import { notifySubscriptionChanged } from "@/lib/postingPlans/hooks";
import { Card, PrimaryButton, SecondaryButton } from "@/components/finance/ui";

type Mode = { kind: "subscribe"; tier: Exclude<PlanTier, "free"> } | { kind: "per_post" };

// Real Stripe Checkout is a redirect flow — clicking "Continue to Payment" navigates away, and
// Stripe redirects back to this same page (successUrl/cancelUrl are both the current URL) once
// done. There's no in-app "payment succeeded" step any more: the account's tier/quota only
// actually changes once payment-service's webhook processes the completed session, so the next
// post attempt (or a reload of this page) is what reflects it, not a callback fired from here.
//
// Switching between two paid tiers while already subscribed is different: payment-service
// applies that in place (no Stripe redirect) and reports it back immediately via `updated`, so
// that case shows an inline success message instead of navigating away.
export default function PlanCheckout({ mode, onClose }: { mode: Mode; onClose: () => void }) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [updatedTier, setUpdatedTier] = useState<PlanTier | null>(null);

  const amount = mode.kind === "subscribe" ? PLAN_PRICES[mode.tier] : PER_POST_PRICE;
  const title = mode.kind === "subscribe" ? `Subscribe to ${PLAN_LABELS[mode.tier]}` : "Pay for one extra post";

  const handleCheckout = async () => {
    if (!token || busy) return;
    setBusy(true);
    setError("");
    const redirectUrl = window.location.href;
    const result = mode.kind === "subscribe"
      ? await createSubscribeCheckout(token, mode.tier, redirectUrl, redirectUrl)
      : await createPerPostCheckout(token, redirectUrl, redirectUrl);

    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    if ("demo" in result) {
      setError("Payments aren't configured in this environment yet — checkout is unavailable.");
      setBusy(false);
      return;
    }
    if ("updated" in result) {
      notifySubscriptionChanged();
      setUpdatedTier(result.tier);
      setBusy(false);
      return;
    }
    window.location.href = result.url;
  };

  if (updatedTier) {
    return (
      <Card className="border-2 border-slate-900/5">
        <h3 className="text-lg font-black text-slate-900 mb-4">Plan updated</h3>
        <p className="text-sm text-slate-600 mb-6">
          You&apos;re now on the <span className="font-bold text-slate-900">{PLAN_LABELS[updatedTier]}</span> plan. The change applied immediately — any price
          difference is prorated on your next Stripe invoice.
        </p>
        <div className="flex justify-end">
          <PrimaryButton onClick={onClose}>Done</PrimaryButton>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-slate-900/5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
        <button onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-slate-800" aria-label="Close checkout">
          Cancel
        </button>
      </div>

      <div className="space-y-4">
        <p className="text-2xl font-black text-slate-900">
          {formatMoney(amount)}
          {mode.kind === "subscribe" && <span className="text-sm font-semibold text-slate-500">/month</span>}
        </p>
        <p className="text-sm text-slate-500">You&apos;ll complete payment securely with Stripe next.</p>

        {error && (
          <p className="rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleCheckout} disabled={busy}>
            {busy ? "Redirecting…" : "Continue to Payment"}
          </PrimaryButton>
        </div>
      </div>
    </Card>
  );
}
