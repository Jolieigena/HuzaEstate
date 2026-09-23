"use client";

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import PasswordInput from '@/components/shared/PasswordInput';
import Dialog from '@/components/Dialog';
import PlanCheckout from '@/components/postingPlans/PlanCheckout';
import { PLAN_LABELS, type PlanTier } from '@/lib/postingPlans/types';

// Same fixture seller identity used throughout Manager Portal — see
// LandlordProfileTab.tsx / OverviewTab.tsx for the same convention.
const DEMO_SELLER_ID = "seller-user";

function isPaidTier(value: string | null): value is Exclude<PlanTier, 'free'> {
  return value === 'silver' || value === 'gold' || value === 'diamond';
}

function BecomeASellerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { applyAsSeller, signup, isLoggedIn, isAuthReady, account } = useAuth();
  const paidTier = isPaidTier(searchParams.get('plan')) ? (searchParams.get('plan') as Exclude<PlanTier, 'free'>) : null;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Stripe not configured server-side — fall back to the existing simulated
  // checkout instead of erroring, same "unset key = demo mode" convention as
  // WORLD_LABS_API_KEY / GEMINI_API_KEY elsewhere in this app.
  const [demoMode, setDemoMode] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^0-9+\s]/g, '').slice(0, 16);
    setPhone(sanitized);
  };

  const proceedPastAccountCreation = async (name: string, emailValue: string) => {
    if (!paidTier) {
      router.push('/manager');
      return;
    }
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: paidTier, name, email: emailValue, phone }),
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
      setError(data.error || 'Could not start checkout. Please try again.');
      setSubmitting(false);
    } catch {
      setError('Could not reach the server. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    if (isLoggedIn && account) {
      applyAsSeller();
      await proceedPastAccountCreation(account.name, account.email);
      return;
    }

    const result = await signup({ firstName, lastName, email, password, termsAccepted: true });
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    applyAsSeller();
    await proceedPastAccountCreation(`${firstName} ${lastName}`.trim(), email);
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
      <Dialog open onClose={() => router.push('/manager')} labelledBy="demo-checkout-title" panelClassName="max-w-lg p-6 sm:p-8">
        <h2 id="demo-checkout-title" className="sr-only">Demo checkout for {PLAN_LABELS[paidTier]}</h2>
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Stripe isn&apos;t configured yet, so this is a demonstration checkout — no real charge will be made.
        </div>
        <PlanCheckout
          accountId={DEMO_SELLER_ID}
          mode={{ kind: 'subscribe', tier: paidTier }}
          onClose={() => router.push('/manager')}
          onDone={() => router.push('/manager')}
        />
      </Dialog>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 py-24 px-4 sm:px-6">
      <div className="w-full max-w-[500px]">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {paidTier ? `Apply to become a seller — ${PLAN_LABELS[paidTier]} plan` : 'Apply to become a seller'}
        </h1>
        <p className="text-slate-500 mb-8">
          {paidTier
            ? "Tell us a bit about yourself, then you'll complete payment securely with Stripe."
            : "Tell us a bit about yourself. Once approved, you'll get access to the Manager Portal to list and manage your properties."}
        </p>

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
                Applying as <span className="font-bold text-slate-900">{account?.name}</span> ({account?.email})
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

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                  <PasswordInput
                    placeholder="Create a password (min. 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel"
                inputMode="tel"
                pattern="[0-9+\s]*"
                maxLength={16}
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+250 xxx xxx xxx"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                required
              />
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

          <button type="submit" disabled={submitting} className="w-full bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg disabled:opacity-60">
            {submitting ? 'Submitting…' : paidTier ? 'Continue to Payment' : 'Submit Application'}
          </button>

          <p className="text-center text-slate-500 text-sm">
            By applying, you agree to HuzaEstate&apos;s seller terms and verification process.
          </p>
        </form>
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
