"use client";

import { useState } from "react";
import { useLandlordProfile } from "@/lib/landlordProfile/hooks";
import { LandlordProfileStoreEngine } from "@/lib/landlordProfile/store";
import type { LandlordProfile } from "@/lib/landlordProfile/types";
import { Card, fieldClass, PrimaryButton } from "@/components/admin/ui";

// Manager Portal has no per-seller ownership model today — any approved
// seller manages every listing (see ManagerDashboard.tsx's useAllProperties()) —
// so there's one fixture landlord identity, matching LandlordProfileCard's
// default and src/lib/landlordProfile/seed.ts, not the real logged-in account id.
const DEMO_LANDLORD_ID = "seller-user";

/** Edits the same profile record LandlordProfileCard shows publicly on the
 *  property detail page for rental listings. rating/reviewCount/verified
 *  aren't editable here — those come from real tenant reviews and admin
 *  verification, not something a landlord sets about themselves. */
export default function LandlordProfileTab() {
  const ownerId = DEMO_LANDLORD_ID;
  const profile = useLandlordProfile(ownerId);
  const [form, setForm] = useState<LandlordProfile>(profile);
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<LandlordProfile>) => {
    setForm((f) => ({ ...f, ...patch }));
    setSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    LandlordProfileStoreEngine.update(ownerId, form);
    setSaved(true);
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Landlord Profile</h2>
          <p className="text-sm text-slate-500 mt-1">Shown to buyers and renters on your rental listings.</p>
        </div>
        {profile.verified && (
          <span className="bg-[#2ec440]/10 text-[#219b31] text-xs font-black px-2.5 py-1 rounded-lg">Verified</span>
        )}
      </div>

      <Card>
        <form className="flex flex-col gap-5" onSubmit={handleSave}>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Display name</label>
            <input className={fieldClass} value={form.displayName} onChange={(e) => update({ displayName: e.target.value })} required />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Photo URL</label>
            <input className={fieldClass} value={form.photoUrl} onChange={(e) => update({ photoUrl: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Bio</label>
            <textarea className={fieldClass} rows={3} value={form.bio} onChange={(e) => update({ bio: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone</label>
              <input className={fieldClass} value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Years hosting</label>
              <input
                type="number"
                min={0}
                className={fieldClass}
                value={form.yearsHosting}
                onChange={(e) => update({ yearsHosting: Number(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Response time</label>
            <input
              className={fieldClass}
              value={form.responseTimeLabel}
              placeholder="e.g. Usually responds within an hour"
              onChange={(e) => update({ responseTimeLabel: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <PrimaryButton type="submit">Save changes</PrimaryButton>
            {saved && <span className="text-sm font-semibold text-[#2ec440]">Saved</span>}
          </div>
        </form>
      </Card>

      <p className="text-xs text-slate-400 mt-4">
        {profile.rating.toFixed(1)} ★ average from {profile.reviewCount} reviews — earned, not editable here.
      </p>
    </div>
  );
}
