"use client";

import { useEffect, useState } from "react";
import { fetchLandlordProfile, type LandlordProfile } from "@/lib/landlords/api";

/** Shown on rental listings once the listing's owner has saved a landlord profile
 *  (access-service). Renders nothing until then, rather than a made-up host. */
export default function LandlordProfileCard({ ownerId }: { ownerId?: string }) {
  const [loaded, setLoaded] = useState<{ ownerId: string; profile: LandlordProfile | null } | null>(null);

  useEffect(() => {
    if (!ownerId) return;
    let cancelled = false;
    fetchLandlordProfile(ownerId).then((profile) => {
      if (!cancelled) setLoaded({ ownerId, profile });
    });
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  const profile = loaded && loaded.ownerId === ownerId ? loaded.profile : null;
  if (!profile) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 mt-6">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Meet your landlord</h3>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-slate-900 flex items-center justify-center">
          {profile.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photoUrl} alt={profile.displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-white font-bold text-lg">{profile.displayName.slice(0, 1)}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-slate-900 truncate">{profile.displayName}</div>
          {profile.yearsHosting ? <div className="text-xs text-slate-500">{profile.yearsHosting} {profile.yearsHosting === 1 ? "year" : "years"} on HuzaEstate</div> : null}
        </div>
      </div>
      {profile.bio ? <p className="text-sm text-slate-600 leading-relaxed mb-3">{profile.bio}</p> : null}
      {profile.responseTime ? <p className="text-xs text-slate-400 mb-4">{profile.responseTime}</p> : null}
      {profile.phone ? (
        <a href={`tel:${profile.phone}`} className="block text-center w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold py-3 rounded-xl transition-colors">
          Call landlord
        </a>
      ) : null}
    </div>
  );
}
