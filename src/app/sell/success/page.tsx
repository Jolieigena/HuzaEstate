"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { fetchMySubscription, reconcileCheckout } from "@/lib/postingPlans/api";
import { PLAN_LABELS, type PlanTier } from "@/lib/postingPlans/types";

type Status = "checking" | "success" | "error";

// Stripe redirects here once checkout completes carrying ?session_id=... (see
// withSessionIdPlaceholder on the backend) — reconcile directly with Stripe first rather than
// only trusting the webhook already landed, since that's what previously left a paying seller
// looking stuck on Free whenever webhook delivery lagged or dropped. The poll loop below stays
// as a fallback for the rare case reconcile itself sees the session not yet marked paid.
const POLL_ATTEMPTS = 6;
const POLL_DELAY_MS = 1500;

// Once the subscription is confirmed the seller is signed out and sent to log in again,
// landing on Manager Portal afterwards with their new seller role loaded fresh.
const LOGIN_AFTER_SUBSCRIBE = `/login?redirect=${encodeURIComponent("/manager")}`;

function SellSuccessContent() {
  const { token, isAuthReady, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("checking");
  const [tier, setTier] = useState<PlanTier | null>(null);
  // Logging out clears the token, which re-runs the check below — this keeps that
  // re-run from flipping the page to the error state mid-redirect.
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (status !== "success" || redirectingRef.current) return;
    redirectingRef.current = true;
    logout();
    router.replace(LOGIN_AFTER_SUBSCRIBE);
  }, [status, logout, router]);

  useEffect(() => {
    if (!isAuthReady || redirectingRef.current) return;
    let cancelled = false;
    (async () => {
      if (!token) {
        if (!cancelled) setStatus("error");
        return;
      }
      const sessionId = searchParams.get("session_id");
      if (sessionId) {
        const reconciled = await reconcileCheckout(token, sessionId);
        if (cancelled) return;
        if (reconciled && reconciled.tier !== "free") {
          setTier(reconciled.tier);
          setStatus("success");
          return;
        }
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
  }, [token, isAuthReady, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      {status === "checking" && <p className="text-slate-500">Confirming your payment…</p>}

      {status === "success" && (
        <>
          <svg className="w-14 h-14 text-[#2ec440]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <h1 className="text-2xl font-bold text-slate-900">You&apos;re on the {tier ? PLAN_LABELS[tier] : ""} plan</h1>
          <p className="text-slate-500 max-w-md">Your subscription is active. Redirecting you to sign in…</p>
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
