"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * Reusable authenticated-route wrapper shared by the Build and Renovate
 * modules. Gates on the resolved auth state (isAuthReady), not the initial
 * `false` default, so a logged-in visitor is never bounced, and never
 * renders protected children before the redirect decision is made. The
 * prototype auth here is a localStorage flag only — not production-grade
 * security.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isAuthReady } = useAuth();

  useEffect(() => {
    if (isAuthReady && !isLoggedIn) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthReady, isLoggedIn, router, pathname]);

  if (!isAuthReady || !isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white">
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

  return <>{children}</>;
}
