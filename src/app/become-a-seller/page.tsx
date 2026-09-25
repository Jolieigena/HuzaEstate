"use client";

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import PasswordInput from '@/components/shared/PasswordInput';
import PhoneInput from '@/components/shared/PhoneInput';
import Dialog from '@/components/Dialog';
import { PLAN_LABELS, PLAN_PRICES, type PlanTier } from '@/lib/postingPlans/types';
import { createSellerFreeCheckout, createSubscribeCheckout } from '@/lib/postingPlans/api';
import { formatMoney } from '@/lib/finance/money';

function isPlanTier(value: string | null): value is PlanTier {
  return value === 'free' || value === 'silver' || value === 'gold' || value === 'diamond';
}

function isPaidTier(value: PlanTier | null): value is Exclude<PlanTier, 'free'> {
  return value === 'silver' || value === 'gold' || value === 'diamond';
}

function BecomeASellerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, signup, logout, isLoggedIn, isAuthReady, account } = useAuth();
  const planParam = searchParams.get('plan');
  // Only set when a plan was actually passed in (e.g. from /sell) — a visitor
  // reaching this page some other way  gets no plan badge and the original unconditional /manager
  // redirect, same as before /sell started passing ?plan=.
  const selectedTier = isPlanTier(planParam) ? planParam : null;
  const paidTier = isPaidTier(selectedTier) ? selectedTier : null;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Stripe not configured server-side — fall back to the existing simulated
  // checkout instead of erroring, same "unset key = demo mode" convention as
  // WORLD_LABS_API_KEY / GEMINI_API_KEY elsewhere in this app.
  const [demoMode, setDemoMode] = useState(false);

  // After subscribing, the seller signs in again and lands on Manager Portal
  // with their new seller role loaded fresh.
  const goToLogin = () => {
    logout();
    router.replace(`/login?redirect=${encodeURIComponent('/manager')}`);
  };

  const proceedPastAccountCreation = async (freshToken: string) => {
    if (!paidTier) {
      // Free tier is fully self-serve, no Stripe involved — grants seller_manager immediately.
      const result = await createSellerFreeCheckout(freshToken);
      if (!result.ok) {
        setError(result.error);
        setSubmitting(false);
        return;
      }
      goToLogin();
      return;
    }
    const redirectBase = `${window.location.origin}/sell/success`;
    const result = await createSubscribeCheckout(freshToken, paidTier, redirectBase, `${window.location.origin}/sell?canceled=true`);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    if ('demo' in result) {
      setDemoMode(true);
      setSubmitting(false);
      return;
    }
    if ('updated' in result) {
      // Only reachable if this account already had a live paid subscription (e.g. a past
      // seller who canceled and is re-subscribing to a different tier) — applied in place with
      // no Stripe redirect, so just pick up the new role like the free-tier path does.
      goToLogin();
      return;
    }
    window.location.href = result.url;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    if (!termsAccepted) {
      setError("Please agree to HuzaEstate's seller terms to continue.");
      return;
    }
    setSubmitting(true);

    if (isLoggedIn && account && token) {
      await proceedPastAccountCreation(token);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      setSubmitting(false);
      return;
    }

    const result = await signup({ firstName, lastName, email, password, termsAccepted });
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    await proceedPastAccountCreation(result.token);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-sm font-medium">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (demoMode && paidTier) {
    return (
      <Dialog open onClose={goToLogin} labelledBy="demo-checkout-title" panelClassName="max-w-lg p-6 sm:p-8">
        <h2 id="demo-checkout-title" className="text-lg font-black text-slate-900 mb-3">Payments aren&apos;t configured yet</h2>
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Checkout for the {PLAN_LABELS[paidTier]} plan isn&apos;t available in this environment yet — no charge was made. Your account was created; an administrator can upgrade your plan manually in the meantime.
        </div>
        <button onClick={goToLogin} className="w-full bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3 rounded-xl transition-colors">
          Continue to Sign In
        </button>
      </Dialog>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 py-24 px-4 sm:px-6">
      <div className="w-full max-w-[500px]">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4 w-full">
          <h1 className="text-2xl font-bold text-slate-900 leading-none">Become a seller</h1>
          {selectedTier && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2ec440]/10 text-[#2ec440] font-bold text-xs leading-none">
              Selected plan: {PLAN_LABELS[selectedTier]}
              {paidTier ? ` — ${formatMoney(PLAN_PRICES[paidTier])}/month` : ' — $0'}
            </div>
          )}
        </div>
        {paidTier && <p className="text-slate-500 mb-4">You&apos;ll complete payment securely with Stripe next.</p>}

        {error && (
          <p className="mb-5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3">
            {error}
          </p>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Contact Information</h2>

            {isLoggedIn ? (
              <p className="text-sm text-slate-600">
                Continuing as <span className="font-bold text-slate-900">{account?.name}</span> ({account?.email})
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
                    <input
                      type="text"
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                    <PasswordInput
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
                    <PasswordInput
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={8}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
              <PhoneInput value={phone} onChange={setPhone} required />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-5">Listing Preferences</h2>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">I want to</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-slate-900"
                required
                defaultValue=""
              >
                <option value="" disabled>Select an option</option>
                <option value="sell">Sell my properties</option>
                <option value="rent">Rent out my properties</option>
                <option value="both">Both sell and rent out properties</option>
              </select>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="seller-terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="accent-[#2ec440] w-4 h-4 mt-1 cursor-pointer"
              required
            />
            <label htmlFor="seller-terms" className="text-sm text-slate-600 leading-relaxed cursor-pointer">
              I agree to HuzaEstate&apos;s <Link href="#" className="font-bold text-[#2ec440] hover:underline">Seller Terms &amp; Conditions</Link>.
            </label>
          </div>

          {paidTier && (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-bold text-slate-700">{PLAN_LABELS[paidTier]} plan</span>
              <span className="text-sm font-bold text-slate-900">{formatMoney(PLAN_PRICES[paidTier])}/month</span>
            </div>
          )}

          <button type="submit" disabled={submitting || !termsAccepted} className="w-full bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed">
            {submitting ? 'Submitting…' : paidTier ? 'Continue to Payment' : 'Create Seller Account'}
          </button>
        </form>

        {!isLoggedIn && (
          <p className="mt-6 text-center text-slate-500 text-sm">
            Already have an account?{' '}
            <Link
              href={`/login?redirect=${encodeURIComponent(`/become-a-seller${planParam ? `?plan=${planParam}` : ''}`)}`}
              className="font-bold text-[#2ec440] hover:text-[#28b039] transition-colors"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

function BecomeASellerFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    </div>
  );
}

export default function BecomeASellerPage() {
  return (
    <Suspense fallback={<BecomeASellerFallback />}>
      <BecomeASellerForm />
    </Suspense>
  );
}
