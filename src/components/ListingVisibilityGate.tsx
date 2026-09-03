"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useIsListingVisible } from "@/lib/admin/listings";

/**
 * Wraps a property detail page's existing JSX (passed through unchanged as
 * `children`) and swaps in an "unavailable" panel once the listing has been
 * unpublished or is awaiting moderation. `properties/[id]/page.tsx` is a
 * Server Component and can't check the moderation overlay itself, so this
 * is the one client boundary that does it — a genuine `notFound()` (bad ID)
 * still happens server-side before this ever renders.
 */
export default function ListingVisibilityGate({ propertyId, propertyTitle, children }: { propertyId: string; propertyTitle: string; children: ReactNode }) {
  const visible = useIsListingVisible(propertyId);

  if (!visible) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-32 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-900">This listing is currently unavailable</h1>
        <p className="mx-auto mt-3 max-w-md text-slate-500">&ldquo;{propertyTitle}&rdquo; is not currently visible on HuzaEstate. It may be awaiting review, or it may have been removed.</p>
        <Link href="/properties" className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
          Browse other properties
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
