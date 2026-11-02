"use client";

import { useState } from "react";
import Select from "@/components/shared/Select";
import { AdminApi, type AdminUser } from "@/lib/admin/api";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { useToast } from "@/lib/toast-context";
import { Card, PrimaryButton } from "../ui";

/** The countries an account works in. The main country is where it was created or placed; any other country added here counts
 *  the same way for the organisations that manage that country, the directories and the country filters. Any account can be
 *  given more, sellers, professionals, suppliers and customers alike. Platform administrators only. */
export default function CountriesCard({ user, token, onSaved }: { user: AdminUser; token: string | null; onSaved: (user: AdminUser) => void }) {
  const { showToast } = useToast();
  const saved = user.countries ?? [];
  const [draft, setDraft] = useState<string[] | null>(null);
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState(false);
  const countries = draft ?? saved;
  const dirty = draft !== null && (draft.length !== saved.length || draft.some((c) => !saved.includes(c)));
  const available = COUNTRY_OPTIONS.filter((option) => option.name !== user.country && !countries.includes(option.name));

  const add = () => {
    if (!pick) return;
    setDraft([...countries, pick]);
    setPick("");
  };

  const save = async () => {
    if (!token || !dirty || busy) return;
    setBusy(true);
    const result = await AdminApi.updateUser(token, user.id, { countries });
    setBusy(false);
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    onSaved(result.data);
    setDraft(null);
    showToast("Countries updated.");
  };

  return (
    <Card>
      <h3 className="text-lg font-black text-slate-900">Countries</h3>
      <p className="mt-3 text-sm text-slate-600">
        Main country: <span className="font-bold text-slate-900">{user.country || "Not set"}</span>
      </p>
      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">Also works in</p>
      {countries.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">No other countries.</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {countries.map((name) => (
            <li key={name} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-4 pr-2 text-sm font-bold text-slate-700">
              {name}
              <button type="button" aria-label={`Remove ${name}`} onClick={() => setDraft(countries.filter((c) => c !== name))} className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600">
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Select className="min-w-52 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm" value={pick} aria-label="Add a country" onChange={(e) => setPick(e.target.value)}>
          <option value="">Add a country…</option>
          {available.map((option) => (
            <option key={option.code} value={option.name}>
              {option.name}
            </option>
          ))}
        </Select>
        <button type="button" disabled={!pick} onClick={add} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-[#2ec440] hover:text-[#219b31] disabled:opacity-50">
          Add
        </button>
        <PrimaryButton type="button" disabled={!dirty || busy} onClick={save}>
          {busy ? "Saving…" : "Save countries"}
        </PrimaryButton>
      </div>
    </Card>
  );
}
