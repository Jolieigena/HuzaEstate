"use client";

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, DEMO_ACCOUNTS, ADMIN_DEMO_ACCOUNTS } from '@/lib/auth-context';
import { sanitizeRedirect } from '@/lib/redirect';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithCredentials } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const redirectParam = searchParams.get('redirect');
  const signupHref = redirectParam ? `/signup?redirect=${encodeURIComponent(redirectParam)}` : '/signup';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    if (!loginWithCredentials(email, password)) {
      setError('Invalid email or password. Try one of the demo accounts below.');
      setIsSubmitting(false);
      return;
    }
    router.push(sanitizeRedirect(redirectParam));
  };

  const selectDemoAccount = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    setEmail(account.email);
    setPassword(account.password);
    loginWithCredentials(account.email, account.password);
    router.push(account.path);
  };

  return (
    <>
      <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome back</h1>
      <p className="text-slate-500 mb-8">Please enter your details to sign in.</p>

      {error && (
        <p className="mb-5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3">
          {error}
        </p>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
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
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-bold text-slate-700">Password</label>
            <Link href="#" className="text-sm font-bold text-[#2ec440] hover:text-[#28b039] transition-colors">Forgot password?</Link>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
            required
          />
        </div>

        <div className="flex items-center gap-2 mt-4 mb-6">
          <input type="checkbox" id="remember" className="accent-[#2ec440] w-4 h-4 cursor-pointer" />
          <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer">Remember me for 30 days</label>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-[#2ec440] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg">
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>

        <button type="button" className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-3">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Demo accounts</p>
        <div className="space-y-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              disabled={isSubmitting}
              onClick={() => selectDemoAccount(account)}
              className="w-full flex items-center justify-between gap-3 rounded-lg bg-white border border-slate-200 hover:border-[#2ec440] px-3 py-2 text-left transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>
                <span className="block text-xs font-bold text-slate-900">{account.portal}</span>
                <span className="block text-xs text-slate-500">{account.email} / {account.password}</span>
              </span>
              <span className="text-xs font-bold text-[#2ec440]">Use</span>
            </button>
          ))}
        </div>
      </div>

      <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-xs font-bold text-slate-500 uppercase tracking-wide">Administration demo accounts (staff only)</summary>
        <div className="mt-3 space-y-2">
          {ADMIN_DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              disabled={isSubmitting}
              onClick={() => selectDemoAccount(account)}
              className="w-full flex items-center justify-between gap-3 rounded-lg bg-white border border-slate-200 hover:border-[#2ec440] px-3 py-2 text-left transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>
                <span className="block text-xs font-bold text-slate-900">{account.portal}</span>
                <span className="block text-xs text-slate-500">{account.email} / {account.password}</span>
              </span>
              <span className="text-xs font-bold text-[#2ec440]">Use</span>
            </button>
          ))}
        </div>
      </details>

      <p className="mt-8 text-center text-slate-500 text-sm">
        Don&apos;t have an account? <Link href={signupHref} className="font-bold text-[#2ec440] hover:text-[#28b039] transition-colors">Sign up for free</Link>
      </p>
      <p className="mt-3 text-center text-sm">
        <Link href="/professionals/apply" className="font-bold text-slate-600 hover:text-[#2ec440]">Become a Professional</Link>
      </p>
    </>
  );
}

function LoginFormFallback() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-slate-100 rounded-lg mb-3"></div>
      <div className="h-5 w-64 bg-slate-100 rounded-lg mb-8"></div>
      <div className="space-y-5">
        <div className="h-12 bg-slate-100 rounded-xl"></div>
        <div className="h-12 bg-slate-100 rounded-xl"></div>
        <div className="h-12 bg-slate-200 rounded-xl"></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side: Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="https://images.unsplash.com/photo-1682773083896-95176d8aecf8?q=80&w=1200&auto=format&fit=crop"
          alt="Luxury Real Estate"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">Find your next perfect place to call home.</h2>
          <p className="text-slate-300 text-lg">Join thousands of others in discovering premium properties across the country.</p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-[440px]">
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
