"use client";

import { useEffect, useRef, useState } from "react";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { findCountry } from "@/lib/countries";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { uploadProfessionalImage } from "@/lib/professional/api";
import { SUPPLIER_CATEGORIES, SuppliersApi, type SupplierProfile } from "@/lib/suppliers/api";
import PhoneInput, { cleanPhone, phoneProblem } from "@/components/shared/PhoneInput";
import { Card, PageFrame, PrimaryButton, SecondaryButton, fieldClass } from "@/components/professional/ui";

/** A number saved without its country code (like "0782345678") gets the one for the supplier's country, so it passes
 *  the same check as a newly typed one. A number that cannot be read is left as it was. */
function withCountryCode(value: string, country?: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("+")) return trimmed;
  const code = findCountry(country ?? "")?.code;
  const parsed = code ? parsePhoneNumberFromString(trimmed, code as CountryCode) : undefined;
  return parsed?.isValid() ? parsed.formatInternational() : trimmed;
}

/** A supplier's company profile. Saving it is what unlocks the rest of the portal. */
export default function SupplierProfileForm() {
  const { token, isAuthReady, account, refreshAccount } = useAuth();
  const { showToast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    SuppliersApi.getMine(token).then((result) => {
      if (cancelled) return;
      setLoaded(true);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const p = result.data.profile;
      setProfile(p);
      if (p) {
        setCompanyName(p.companyName);
        setBio(p.bio);
        setCity(p.city ?? "");
        setPhone(withCountryCode(p.phone ?? "", p.country));
        setLogoUrl(p.logoUrl ?? "");
        setCategories(p.categories);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token]);

  const toggle = (name: string) => setCategories((current) => (current.includes(name) ? current.filter((c) => c !== name) : [...current, name]));
  const addCustom = () => {
    const value = custom.trim();
    if (value && !categories.some((c) => c.toLowerCase() === value.toLowerCase())) setCategories([...categories, value]);
    setCustom("");
  };

  const upload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !token) return;
    setUploading(true);
    setError("");
    try {
      setLogoUrl(await uploadProfessionalImage(file, file.type || "image/jpeg", token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  // The first thing still missing, in words, so Save never fails silently.
  const problem = !companyName.trim()
    ? "Enter your company name."
    : !city.trim()
      ? "Enter your city."
      : !cleanPhone(phone)
        ? "Enter your phone number."
        : (phoneProblem(phone) ?? (categories.length === 0 ? "Choose at least one thing you sell." : ""));

  const save = async () => {
    if (!token) return;
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError("");
    const result = await SuppliersApi.saveMine(token, { companyName: companyName.trim(), bio: bio.trim(), city: city.trim(), phone: cleanPhone(phone), categories, ...(logoUrl ? { logoUrl } : {}) });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setProfile(result.data.profile);
    showToast("Profile saved.");
    await refreshAccount();
  };

  const incomplete = account?.profileCompleted === false;
  const extra = categories.filter((c) => !SUPPLIER_CATEGORIES.includes(c));

  return (
    <PageFrame title="Company profile">
      {!loaded ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
      ) : (
        <Card className="max-w-2xl space-y-5">
          {incomplete && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Save your company profile to start answering quote requests.</p>}
          {error && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logoUrl ? <img src={logoUrl} alt="" className="h-16 w-16 rounded-xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-xl font-black text-slate-400">{(companyName || "S").slice(0, 1)}</div>}
            <div className="flex gap-2">
              <SecondaryButton type="button" disabled={uploading} onClick={() => fileInput.current?.click()}>
                {uploading ? "Uploading…" : logoUrl ? "Change logo" : "Add logo"}
              </SecondaryButton>
              {logoUrl && (
                <SecondaryButton type="button" onClick={() => setLogoUrl("")}>
                  Remove
                </SecondaryButton>
              )}
            </div>
            <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files)} />
          </div>

          <label className="block text-sm font-bold text-slate-700">
            Company name
            <input className={`${fieldClass} mt-1`} value={companyName} maxLength={160} onChange={(e) => setCompanyName(e.target.value)} />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            About
            <textarea className={`${fieldClass} mt-1 min-h-28 resize-y font-normal`} value={bio} maxLength={4000} onChange={(e) => setBio(e.target.value)} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              City
              <input className={`${fieldClass} mt-1`} value={city} maxLength={120} onChange={(e) => setCity(e.target.value)} />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Phone
              <div className="mt-1">
                <PhoneInput value={phone} onChange={setPhone} required />
              </div>
            </label>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-700">What you sell</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...SUPPLIER_CATEGORIES, ...extra].map((name) => (
                <button key={name} type="button" onClick={() => toggle(name)} aria-pressed={categories.includes(name)} className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${categories.includes(name) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                  {name}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input className={fieldClass} placeholder="Something else" value={custom} maxLength={60} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }} />
              <SecondaryButton type="button" onClick={addCustom}>
                Add
              </SecondaryButton>
            </div>
          </div>

          <PrimaryButton type="button" disabled={saving || uploading} onClick={save}>
            {saving ? "Saving…" : profile?.completedAt ? "Save changes" : "Save profile"}
          </PrimaryButton>
        </Card>
      )}
    </PageFrame>
  );
}
