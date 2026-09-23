"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { fetchMySubscription } from "@/lib/postingPlans/api";
import { PLAN_LABELS, type PlanTier } from "@/lib/postingPlans/types";

type Status = "checking" | "success" | "error";

// Stripe redirects here once checkout completes, but the actual tier change only happens once
// payment-service's webhook processes the session — which can lag slightly behind the redirect.
// Poll subscriptions/me a few times rather than trusting it's already reflected on first load.
const POLL_ATTEMPTS = 6;
const POLL_DELAY_MS = 1500;

function SellSuccessContent() {
  const { token, isAuthReady } = useAuth();
  const [status, setStatus] = useState<Status>("checking");
  const [tier, setTier] = useState<PlanTier | null>(null);

  useEffect(() => {
    if (!isAuthReady) return;
    let cancelled = false;
    (async () => {
      if (!token) {
        if (!cancelled) setStatus("error");
        return;
      }
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
        const subscription = await fetchMySubscription(token);
        if (cancelled) return;
        if (subscription && subscription.tier !== "free") {
          setTier(subscription.tier);
          setStatus("success");
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_DELAY_MS));
      }
      if (!cancelled) setStatus("error");
    })();
    return () => {
      cancelled = true;
    };
  }, [token, isAuthReady]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      {status === "checking" && <p className="text-slate-500">Confirming your payment…</p>}

      {status === "success" && (
        <>
          <svg className="w-14 h-14 text-[#2ec440]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <h1 className="text-2xl font-bold text-slate-900">You&apos;re on the {tier ? PLAN_LABELS[tier] : ""} plan</h1>
          <p className="text-slate-500 max-w-md">Your subscription is active. Head to Manager Portal to start posting.</p>
          <Link href="/manager" className="mt-2 bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Go to Manager Portal
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-2xl font-bold text-slate-900">We couldn&apos;t confirm your payment yet</h1>
          <p className="text-slate-500 max-w-md">If you were charged, this can take a minute to reflect — check Manager Portal shortly, or contact support if it doesn&apos;t update.</p>
          <Link href="/manager" className="mt-2 font-bold text-[#2ec440] hover:text-[#28b039]">
            Go to Manager Portal
          </Link>
        </>
      )}
    </div>
  );
}

export default function SellSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SellSuccessContent />
    </Suspense>
  );
}
