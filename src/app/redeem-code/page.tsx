"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import RedeemAccessCode from "@/components/postingPlans/RedeemAccessCode";
import { useAuth } from "@/lib/auth-context";

/** Where the "Use my access code" button in the access-code email lands. Someone already signed in sees the code
 *  filled in and applies it; someone signed out is sent to sign in (and back here) or to create an account. */
function RedeemCode() {
  const params = useSearchParams();
  const code = params.get("code") ?? "";
  const plan = params.get("plan");
  const { isAuthReady, isLoggedIn, account, logout } = useAuth();
  const [applied, setApplied] = useState(false);

  const here = `/redeem-code?code=${encodeURIComponent(code)}${plan ? `&plan=${encodeURIComponent(plan)}` : ""}`;
  const signupHref = `/become-a-seller?code=${encodeURIComponent(code)}${plan ? `&plan=${encodeURIComponent(plan)}` : ""}`;

  return (
    <main className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Your access code</h1>

        {!isAuthReady ? (
          <p className="mt-6 text-sm font-semibold text-slate-400">Loading…</p>
        ) : !isLoggedIn ? (
          <div className="mt-6 space-y-3">
            {code && <p className="rounded-xl bg-slate-50 px-4 py-3 text-center font-mono text-lg font-bold tracking-widest text-slate-900">{code}</p>}
            <Link href={`/login?redirect=${encodeURIComponent(here)}`} className="flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
              Sign in
            </Link>
            <Link href={signupHref} className="flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition-colors hover:border-[#2ec440]">
              Create an account
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-slate-500">
              Signed in as <span className="font-bold text-slate-800">{account?.email}</span>
            </p>
            <RedeemAccessCode defaultOpen initialCode={code} onRedeemed={() => setApplied(true)} />
            {applied ? (
              <Link href="/manager" className="flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
                Go to Manager Portal
              </Link>
            ) : (
              <button type="button" onClick={() => logout()} className="text-sm font-bold text-slate-500 underline hover:text-slate-900">
                Use a different account
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// The page reads the code from the URL (useSearchParams), which needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <RedeemCode />
    </Suspense>
  );
}
