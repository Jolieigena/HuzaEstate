"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchMyLandlordProfile, saveMyLandlordProfile, type SaveLandlordInput } from "@/lib/landlords/api";
import { uploadProfessionalImage } from "@/lib/professional/api";
import { useToast } from "@/lib/toast-context";
import { Card, fieldClass, PrimaryButton, SecondaryButton } from "@/components/admin/ui";

const EMPTY: SaveLandlordInput = { displayName: "", photoUrl: "", bio: "", phone: "", responseTime: "", yearsHosting: undefined };

/** Edits the landlord profile buyers and renters see on this seller's rental listings. Saved
 *  to the seller's account (access-service), so it shows for everyone on every device. */
export default function LandlordProfileTab() {
  const { account, token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState<SaveLandlordInput>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (result.ok) showToast("Landlord profile saved.");
    else showToast(result.error, "error");
  }

  async function handlePhoto(file: File | undefined) {
    if (!file || !token) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.", "error");
      return;
    }
    setUploading(true);
    try {
      update({ photoUrl: await uploadProfessionalImage(file, file.type, token) });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Upload failed. Please try again.", "error");
    }
    setUploading(false);
  }

  if (!loaded) return <p className="py-10 text-sm font-semibold text-slate-400">Loading your profile…</p>;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Landlord Profile</h2>
        <p className="text-sm text-slate-500 mt-1">Shown to buyers and renters on your rental listings.</p>
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
                {uploading ? "Uploading…" : form.photoUrl ? "Change photo" : "Upload photo"}
              </SecondaryButton>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Display name</label>
            <input className={fieldClass} value={form.displayName} onChange={(e) => update({ displayName: e.target.value })} required />
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
              <input type="number" min={0} className={fieldClass} value={form.yearsHosting ?? ""} onChange={(e) => update({ yearsHosting: e.target.value === "" ? undefined : Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Response time</label>
            <input className={fieldClass} value={form.responseTime} placeholder="e.g. Usually responds within a day" onChange={(e) => update({ responseTime: e.target.value })} />
          </div>

          <div className="pt-2">
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
