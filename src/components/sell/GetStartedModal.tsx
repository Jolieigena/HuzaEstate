"use client";

import { useState } from "react";
import Dialog from "@/components/Dialog";
import { fieldClass, PrimaryButton, SecondaryButton } from "@/components/finance/ui";
import PlanCheckout from "@/components/postingPlans/PlanCheckout";
import { PLAN_LABELS, type PlanTier } from "@/lib/postingPlans/types";

// Same fixture seller identity used throughout Manager Portal — see
// LandlordProfileTab.tsx / OverviewTab.tsx for the same convention.
const DEMO_SELLER_ID = "seller-user";

/** Collects the minimal info needed to identify the customer, then redirects
 *  to a real Stripe Checkout session (src/app/api/stripe/create-checkout-session)
 *  for the actual payment. If STRIPE_SECRET_KEY isn't configured, the API
 *  route says so and this falls back to the existing simulated PlanCheckout
 *  flow instead of erroring — same "unset key = demo mode" convention as
 *  WORLD_LABS_API_KEY / GEMINI_API_KEY elsewhere in this app. */
export default function GetStartedModal({ tier, onClose }: { tier: Exclude<PlanTier, "free">; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, name, email, phone }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.demo) {
        setDemoMode(true);
        setSubmitting(false);
        return;
      }
      setError(data.error || "Could not start checkout. Please try again.");
      setSubmitting(false);
    } catch {
      setError("Could not reach the server. Please try again.");
      setSubmitting(false);
    }
  }

  if (demoMode) {
    return (
      <Dialog open onClose={onClose} labelledBy="get-started-title" panelClassName="max-w-lg p-6 sm:p-8">
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Stripe isn&apos;t configured yet, so this is a demonstration checkout — no real charge will be made.
        </div>
        <PlanCheckout accountId={DEMO_SELLER_ID} mode={{ kind: "subscribe", tier }} onClose={onClose} onDone={onClose} />
      </Dialog>
    );
  }

  return (
    <Dialog open onClose={onClose} labelledBy="get-started-title" panelClassName="max-w-md p-6 sm:p-8">
      <h2 id="get-started-title" className="text-xl font-bold text-slate-900 mb-1">
        Get started with {PLAN_LABELS[tier]}
      </h2>
      <p className="text-sm text-slate-500 mb-6">Tell us who you are, then you&apos;ll complete payment securely with Stripe.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={fieldClass} />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={fieldClass} />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
        </div>
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <div className="flex items-center gap-3 pt-2">
          <PrimaryButton type="submit" disabled={submitting} className="flex-1">
            {submitting ? "Redirecting…" : "Continue to Payment"}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </Dialog>
  );
}
