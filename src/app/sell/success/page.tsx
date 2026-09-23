"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PostingPlanService } from "@/lib/postingPlans/postingPlanService";
import { PLAN_LABELS, type PlanTier } from "@/lib/postingPlans/types";

const DEMO_SELLER_ID = "seller-user";

type Status = "checking" | "success" | "error";

function SellSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  // Derived synchronously from the URL (searchParams is SSR-safe, unlike
  // localStorage/window elsewhere in this app) rather than set from inside
  // the effect below, so there's no extra render for the "no session_id"
  // case.
  const [status, setStatus] = useState<Status>(() => (sessionId ? "checking" : "error"));
  const [tier, setTier] = useState<PlanTier | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.paid && data.tier) {
          // Real payment confirmed server-side (Stripe secret key) — the
          // *tier bookkeeping* still lives in this app's existing local
          // posting-plans module, same as every other account entitlement
          // in this prototype.
          PostingPlanService.subscribe(DEMO_SELLER_ID, data.tier as PlanTier);
          setTier(data.tier as PlanTier);
          setStatus("success");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [sessionId]);

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
          <h1 className="text-2xl font-bold text-slate-900">We couldn&apos;t confirm your payment</h1>
          <p className="text-slate-500 max-w-md">If you were charged, contact support. Otherwise, please try again.</p>
          <Link href="/sell" className="mt-2 font-bold text-[#2ec440] hover:text-[#28b039]">
            Back to Sell
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
