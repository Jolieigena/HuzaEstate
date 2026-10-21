"use client";

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { accountDestination } from '@/lib/navigation';
import { useCurrentCountry } from '@/lib/geo/useCurrentCountry';
import PasswordInput from '@/components/shared/PasswordInput';
import PasswordChecklist from '@/components/shared/PasswordChecklist';
import { PASSWORD_MIN_LENGTH, passwordIsAcceptable } from '@/lib/passwordRules';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup } = useAuth();
  // Best-effort, silent — never a visible field on this form. Lets an org admin's Users page
  // scope customer accounts by country later (see access-service's signup()).
  const detectedCountry = useCurrentCountry();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const redirectParam = searchParams.get('redirect');
  const loginHref = redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    if (!passwordIsAcceptable(password, { email, firstName, lastName })) {
      setError('Please choose a password that meets every rule listed.');
      return;
    }
    setIsSubmitting(true);
    const result = await signup({ firstName, lastName, email, password, termsAccepted, country: detectedCountry?.name });
    if (!result.ok) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    router.push(accountDestination(result.account, redirectParam));
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Create an account</h1>
      <p className="text-slate-500 mb-8">Sign up in seconds to save your favorite properties and book tours.</p>

      {error && (
        <p className="mb-5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3">
          {error}
        </p>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
                <input
                  type="text"
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <PasswordInput
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={PASSWORD_MIN_LENGTH}
                autoComplete="new-password"
                required
              />
              <PasswordChecklist password={password} who={{ email, firstName, lastName }} />
            </div>

            <div className="flex items-start gap-3 mt-4 mb-6">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="accent-[#2ec440] w-4 h-4 mt-1 cursor-pointer"
                required
              />
              <label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed cursor-pointer">
                I agree to HuzaEstate&apos;s <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-bold text-[#2ec440] hover:underline">Terms of Service</Link> and <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-bold text-[#2ec440] hover:underline">Privacy Policy</Link>.
              </label>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-[#2ec440] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg">
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </button>

      </form>

      <GoogleAuthButton
        text="signup_with"
        allowCreate
        country={detectedCountry?.name}
        beforeSubmit={() => (termsAccepted ? null : 'Please accept the Terms of Service and Privacy Policy to sign up with Google.')}
        onError={setError}
        onSuccess={(account) => router.push(accountDestination(account, redirectParam))}
      />

      <p className="mt-8 text-center text-slate-500 text-sm">
        Already have an account? <Link href={loginHref} className="font-bold text-[#2ec440] hover:text-[#28b039] transition-colors">Sign in</Link>
      </p>
    </>
  );
}

function SignupFormFallback() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-56 bg-slate-100 rounded-lg mb-3"></div>
      <div className="h-5 w-72 bg-slate-100 rounded-lg mb-8"></div>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-12 bg-slate-100 rounded-xl"></div>
          <div className="h-12 bg-slate-100 rounded-xl"></div>
        </div>
        <div className="h-12 bg-slate-100 rounded-xl"></div>
        <div className="h-12 bg-slate-100 rounded-xl"></div>
        <div className="h-12 bg-slate-200 rounded-xl"></div>
      </div>
    </div>
  );
}

const SIGNUP_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop",
    title: "Your key to premium real estate.",
    desc: "Create a free account to save your favorite listings, unlock exclusive 3D tours, and securely book property viewings."
  },
  {
    src: "https://images.unsplash.com/photo-1600607687931-cebfad215320?q=80&w=1200&auto=format&fit=crop",
    title: "Discover homes you'll love.",
    desc: "Join a growing community of people finding their dream properties every day."
  },
  {
    src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop",
    title: "Design your perfect space.",
    desc: "Use our AI tools to visualize renovations and build your dream home."
  }
];

export default function SignupPage() {
  const [currentIdx, setCurrentIdx] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % SIGNUP_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side: Images */}
      <div className="hidden lg:block lg:w-1/2 relative bg-slate-900">
        {SIGNUP_IMAGES.map((img, idx) => (
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 overflow-y-auto z-20 bg-white">
        <div className="w-full max-w-[440px] py-8">
          <Suspense fallback={<SignupFormFallback />}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
