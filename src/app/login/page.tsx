"use client";

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { accountDestination } from '@/lib/navigation';
import PasswordInput from '@/components/shared/PasswordInput';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithCredentials } = useAuth();
  const [email, setEmail] = useState(() => (searchParams.get('email') ?? '').slice(0, 254));
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const redirectParam = searchParams.get('redirect');
  const signupHref = redirectParam ? `/signup?redirect=${encodeURIComponent(redirectParam)}` : '/signup';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    const result = await loginWithCredentials(email, password, rememberMe);
    if (!result.ok) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    if (result.account.mustChangePassword) {
      router.push(`/change-password?redirect=${encodeURIComponent(accountDestination(result.account, redirectParam))}`);
      return;
    }
    router.push(accountDestination(result.account, redirectParam));
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{searchParams.get('add') ? 'Add an account' : 'Welcome back'}</h1>
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
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-bold text-slate-700">Password</label>
            <Link href={`/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`} className="text-sm font-bold text-[#2ec440] hover:text-[#28b039] transition-colors">Forgot password?</Link>
          </div>
          <PasswordInput
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <div className="flex items-center gap-2 mt-4 mb-6">
          <input
            type="checkbox"
            id="remember"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="accent-[#2ec440] w-4 h-4 cursor-pointer"
          />
          <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer">Remember me for 30 days</label>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-[#2ec440] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg">
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>

      </form>

      <GoogleAuthButton
        text="signin_with"
        onError={setError}
        onSuccess={(account) => {
          if (account.mustChangePassword) {
            router.push(`/change-password?redirect=${encodeURIComponent(accountDestination(account, redirectParam))}`);
            return;
          }
          router.push(accountDestination(account, redirectParam));
        }}
      />

      <p className="mt-8 text-center text-slate-500 text-sm">
        Don&apos;t have an account? <Link href={signupHref} className="font-bold text-[#2ec440] hover:text-[#28b039] transition-colors">Sign up for free</Link>
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

const LOGIN_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1682773083896-95176d8aecf8?q=80&w=1200&auto=format&fit=crop",
    title: "Find your next perfect place to call home.",
    desc: "Join thousands of others in discovering premium properties across the country."
  },
  {
    src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop",
    title: "Beautiful spaces designed for living.",
    desc: "Explore homes that match your lifestyle and aesthetic preferences."
  },
  {
    src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop",
    title: "Start your journey today.",
    desc: "Discover properties that are just right for you and your family."
  }
];

export default function LoginPage() {
  const [currentIdx, setCurrentIdx] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % LOGIN_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side: Images */}
      <div className="hidden lg:block lg:w-1/2 relative bg-slate-900">
        {LOGIN_IMAGES.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === currentIdx ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={img.src}
              alt="Luxury Real Estate"
              fill
              className="object-cover"
              priority={idx === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
            <div className="absolute bottom-12 left-12 right-12">
              <h2 className="text-3xl font-bold text-white mb-4 leading-tight">{img.title}</h2>
              <p className="text-slate-300 text-lg">{img.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 z-20 bg-white">
        <div className="w-full max-w-[440px]">
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
