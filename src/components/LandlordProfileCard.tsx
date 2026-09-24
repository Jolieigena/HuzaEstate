"use client";

import Image from "next/image";
import { useLandlordProfile } from "@/lib/landlordProfile/hooks";

/** Shown on rental listings. Property (src/lib/properties/types.ts) has no
 *  owner field — real, backend-posted listings don't return one, and Manager
 *  Portal itself has no per-listing ownership model today (any approved
 *  seller manages every listing, see ManagerDashboard.tsx's useAllProperties()).
 *  So this shows the platform's one seeded landlord profile rather than
 *  inventing a per-listing owner mapping the data doesn't support. */
export default function LandlordProfileCard({ ownerId = "seller-user" }: { ownerId?: string }) {
  const profile = useLandlordProfile(ownerId);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 mt-6">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Meet your landlord</h3>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-slate-900 flex items-center justify-center">
          {profile.photoUrl ? (
            <Image src={profile.photoUrl} alt={profile.displayName} fill className="object-cover" />
          ) : (
            <span className="text-white font-bold text-lg">{profile.displayName.slice(0, 1)}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 truncate">{profile.displayName}</span>
            {profile.verified && (
              <svg className="w-4 h-4 text-[#2ec440] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="text-xs text-slate-500">
            {profile.rating.toFixed(1)} ★ ({profile.reviewCount} reviews) · {profile.yearsHosting} yrs on HuzaEstate
          </div>
        </div>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed mb-3">{profile.bio}</p>
      <p className="text-xs text-slate-400 mb-4">{profile.responseTimeLabel}</p>
      <a
        href={`tel:${profile.phone}`}
        className="block text-center w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold py-3 rounded-xl transition-colors"
      >
        Contact Landlord
      </a>
    </div>
  );
}
