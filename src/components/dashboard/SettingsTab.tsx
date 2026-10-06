"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCurrentCountry } from "@/lib/geo/useCurrentCountry";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { useToast } from "@/lib/toast-context";
import Select from "@/components/shared/Select";

// Your country is only ever a best-effort, IP-detected guess made once at signup — this is
// where you can correct it if it's wrong, or if you've since moved. See access-service's
// updateMyAccount for why this is customer-only: professional/organization_admin accounts have
// their country assigned by an administrator instead, for a different purpose (scoping).
export default function SettingsTab() {
  const { account, updateMyCountry } = useAuth();
  const { showToast } = useToast();
  const detected = useCurrentCountry();
  const [country, setCountry] = useState(account?.country ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateMyCountry(country);
    setSaving(false);
    if (result.ok) showToast("Country updated.");
    else showToast(result.error, "error");
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Your personal account details.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg">
        <label className="block text-sm font-bold text-slate-700">
          Country
          <Select
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-[#2ec440] focus:ring-4 focus:ring-[#2ec440]/10"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">Not set</option>
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.name}>{c.name}</option>
            ))}
          </Select>
        </label>
        <p className="mt-2 text-xs text-slate-400">
          {account?.country
            ? "This is what you've told us — correct it any time."
            : detected
              ? `We're guessing ${detected.name} from your connection. Set it explicitly if that's wrong.`
              : "We couldn't detect this automatically — set it yourself."}
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || country === (account?.country ?? "")}
          className="mt-4 min-h-11 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
