"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchMyLandlordProfile, saveMyLandlordProfile, type SaveLandlordInput } from "@/lib/landlords/api";
import { uploadProfessionalImage } from "@/lib/professional/api";
import { notifyProfilePhotoChanged } from "@/lib/profilePhoto";
import { useToast } from "@/lib/toast-context";
import { Card, fieldClass, PrimaryButton, SecondaryButton } from "@/components/admin/ui";
import { useLanguage } from "@/lib/i18n/language";

const EMPTY: SaveLandlordInput = { displayName: "", photoUrl: "", bio: "", phone: "", responseTime: "", yearsHosting: undefined };

/** Edits the landlord profile buyers and renters see on this seller's rental listings. Saved
 *  to the seller's account (access-service), so it shows for everyone on every device. */
export default function LandlordProfileTab() {
  const { t } = useLanguage();
  const { account, token, isAuthReady, updateMyCompany } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState<SaveLandlordInput>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isAgent = account?.sellerType === "agent";
  const [companyName, setCompanyName] = useState(account?.companyName ?? "");
  const [companyLogoUrl, setCompanyLogoUrl] = useState(account?.companyLogoUrl ?? "");
  const [companySaving, setCompanySaving] = useState(false);
  const [companyLogoUploading, setCompanyLogoUploading] = useState(false);
  const companyLogoRef = useRef<HTMLInputElement>(null);
  const companyDirty = companyName !== (account?.companyName ?? "") || companyLogoUrl !== (account?.companyLogoUrl ?? "");

  async function handleCompanyLogo(file: File | undefined) {
    if (!file || !token) return;
    if (!file.type.startsWith("image/")) {
      showToast(t("Please choose an image file."), "error");
      return;
    }
    setCompanyLogoUploading(true);
    try {
      setCompanyLogoUrl(await uploadProfessionalImage(file, file.type, token));
    } catch (error) {
      showToast(error instanceof Error ? t(error.message) : t("Upload failed. Please try again."), "error");
    }
    setCompanyLogoUploading(false);
  }

  async function handleCompanySave(e: React.FormEvent) {
    e.preventDefault();
    setCompanySaving(true);
    const result = await updateMyCompany({ companyName, companyLogoUrl });
    setCompanySaving(false);
    if (result.ok) showToast(t("Company branding saved."));
    else showToast(result.error, "error");
  }

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    fetchMyLandlordProfile(token).then((profile) => {
      if (cancelled) return;
      setForm(profile ? { displayName: profile.displayName, photoUrl: profile.photoUrl ?? "", bio: profile.bio ?? "", phone: profile.phone ?? "", responseTime: profile.responseTime ?? "", yearsHosting: profile.yearsHosting } : { ...EMPTY, displayName: account?.name ?? "" });
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, account?.name]);

  const update = (patch: Partial<SaveLandlordInput>) => setForm((f) => ({ ...f, ...patch }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    const result = await saveMyLandlordProfile(token, form);
    setSaving(false);
    if (result.ok) {
      showToast(t("Landlord profile saved."));
      notifyProfilePhotoChanged();
    } else {
      showToast(result.error, "error");
    }
  }

  async function handlePhoto(file: File | undefined) {
    if (!file || !token) return;
    if (!file.type.startsWith("image/")) {
      showToast(t("Please choose an image file."), "error");
      return;
    }
    setUploading(true);
    try {
      update({ photoUrl: await uploadProfessionalImage(file, file.type, token) });
    } catch (error) {
      showToast(error instanceof Error ? t(error.message) : t("Upload failed. Please try again."), "error");
    }
    setUploading(false);
  }

  if (!loaded) return <p className="py-10 text-sm font-semibold text-slate-400">{t("Loading your profile…")}</p>;

  return (
    <div className="max-w-2xl">
      {isAgent && (
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">{t("Company branding")}</h2>
            <p className="text-sm text-slate-500 mt-1">{t("Your brokerage's name and logo, shown on all of your listings.")}</p>
          </div>
          <Card>
            <form className="flex flex-col gap-5" onSubmit={handleCompanySave}>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white flex items-center justify-center">
                  {companyLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={companyLogoUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-xs font-semibold text-slate-300">{t("No logo")}</span>
                  )}
                </div>
                <div>
                  <input ref={companyLogoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleCompanyLogo(e.target.files?.[0])} />
                  <SecondaryButton type="button" onClick={() => companyLogoRef.current?.click()} disabled={companyLogoUploading}>
                    {companyLogoUploading ? t("Uploading…") : companyLogoUrl ? t("Change logo") : t("Upload logo")}
                  </SecondaryButton>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("Company / brokerage name")}</label>
                <input className={fieldClass} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={t("e.g. Kigali Realty Group")} />
              </div>
              <div className="pt-2">
                <PrimaryButton type="submit" disabled={companySaving || !companyDirty}>
                  {companySaving ? t("Saving…") : t("Save company branding")}
                </PrimaryButton>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">{t("Landlord Profile")}</h2>
        <p className="text-sm text-slate-500 mt-1">{t("Shown to buyers and renters on your rental listings.")}</p>
      </div>

      <Card>
        <form className="flex flex-col gap-5" onSubmit={handleSave}>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
              {form.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                (form.displayName || "?").charAt(0)
              )}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0])} />
              <SecondaryButton type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? t("Uploading…") : form.photoUrl ? t("Change photo") : t("Upload photo")}
              </SecondaryButton>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("Display name")}</label>
            <input className={fieldClass} value={form.displayName} onChange={(e) => update({ displayName: e.target.value })} required />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("Bio")}</label>
            <textarea className={fieldClass} rows={3} value={form.bio} onChange={(e) => update({ bio: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("Phone")}</label>
              <input className={fieldClass} value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("Years hosting")}</label>
              <input type="number" min={0} className={fieldClass} value={form.yearsHosting ?? ""} onChange={(e) => update({ yearsHosting: e.target.value === "" ? undefined : Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("Response time")}</label>
            <input className={fieldClass} value={form.responseTime} placeholder={t("e.g. Usually responds within a day")} onChange={(e) => update({ responseTime: e.target.value })} />
          </div>

          <div className="pt-2">
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? t("Saving…") : t("Save changes")}
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
