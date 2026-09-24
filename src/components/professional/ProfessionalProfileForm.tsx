"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { fetchMyProfessionalProfile, saveMyProfessionalProfile, uploadProfessionalImage, type PortfolioItemInput, type ServiceOfferingInput } from "@/lib/professional/api";
import { useToast } from "@/lib/toast-context";
import { Card, EmptyState, PageFrame, PrimaryButton, PrimaryLink, SecondaryButton, StatusPill, fieldClass, formatDate } from "./ui";

// Saving here calls PUT /professionals/me (access-service), which also clears account.profileCompleted and
// makes the profile visible on the public /professionals directory.
const PROFESSIONAL_KIND_LABEL: Record<string, string> = { individual: "Individual professional", firm: "Firm / company" };

export default function ProfessionalProfileForm() {
  const { account, token, refreshAccount } = useAuth();
  const { showToast } = useToast();
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [kind, setKind] = useState<string | undefined>(undefined);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [displayName, setDisplayName] = useState(account?.name ?? "");
  const [bio, setBio] = useState("");
  const [specialisation, setSpecialisation] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [portfolio, setPortfolio] = useState<PortfolioItemInput[]>([]);
  const [services, setServices] = useState<ServiceOfferingInput[]>([]);

  const [newProject, setNewProject] = useState({ title: "", description: "", year: "", imageUrl: "" });
  const [projectImageUploading, setProjectImageUploading] = useState(false);
  const [newService, setNewService] = useState({ name: "", description: "" });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchMyProfessionalProfile(token).then((profile) => {
      if (cancelled || !profile) return;
      setKind(profile.kind);
      setPhotoUrl(profile.photoUrl);
      setDisplayName(profile.displayName);
      setBio(profile.bio);
      setSpecialisation(profile.specialisation);
      setYearsExperience(profile.yearsExperience !== undefined ? String(profile.yearsExperience) : "");
      setCity(profile.city);
      setCountry(profile.country);
      setPhone(profile.phone);
      setPortfolio(profile.portfolio ?? []);
      setServices(profile.services ?? []);
    }).finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [token]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !token) return;
    setPhotoUploading(true);
    setError("");
    try {
      const url = await uploadProfessionalImage(file, file.type, token);
      setPhotoUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload photo.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleProjectImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !token) return;
    setProjectImageUploading(true);
    setError("");
    try {
      const url = await uploadProfessionalImage(file, file.type, token);
      setNewProject((p) => ({ ...p, imageUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setProjectImageUploading(false);
    }
  };

  const addProject = () => {
    if (!newProject.title.trim()) return;
    setPortfolio((list) => [...list, {
      title: newProject.title.trim(),
      description: newProject.description.trim() || undefined,
      year: newProject.year ? Number(newProject.year) : undefined,
      imageUrl: newProject.imageUrl || undefined,
    }]);
    setNewProject({ title: "", description: "", year: "", imageUrl: "" });
  };
  const removeProject = (index: number) => setPortfolio((list) => list.filter((_, i) => i !== index));

  const addService = () => {
    if (!newService.name.trim()) return;
    setServices((list) => [...list, { name: newService.name.trim(), description: newService.description.trim() || undefined }]);
    setNewService({ name: "", description: "" });
  };
  const removeService = (index: number) => setServices((list) => list.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!token || saving) return;
    setSaving(true);
    setError("");
    const result = await saveMyProfessionalProfile(token, {
      displayName, bio, specialisation, city, country, phone,
      yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
      portfolio, services, photoUrl,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await refreshAccount();
    showToast("Profile updated.");
  };

  if (!loaded) return null;

  return (
    <PageFrame title="Professional profile" description="This is what clients see on your public profile and in the professionals directory.">
      <div className="grid gap-6 xl:grid-cols-[1fr_.7fr]">
        <div className="flex flex-col gap-6">
          <Card>
            {account?.profileCompleted === false && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Fill in every field below and save to complete your profile — it isn&apos;t visible to clients until you do.
              </div>
            )}
            {error && <p className="mb-5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3">{error}</p>}

            <h3 className="text-lg font-black text-slate-900">Profile photo</h3>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-900 text-2xl font-bold text-white">{(displayName || "?").charAt(0)}</div>
                )}
              </div>
              <label className={`${photoUploading ? "opacity-50" : ""} cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-[#2ec440] hover:text-[#219b31]`}>
                {photoUploading ? "Uploading…" : photoUrl ? "Change photo" : "Upload photo"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={photoUploading} onChange={handlePhotoChange} />
              </label>
            </div>

            <h3 className="mt-6 text-lg font-black text-slate-900">Profile details</h3>
            {kind && (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{PROFESSIONAL_KIND_LABEL[kind] ?? kind} · set by your administrator</p>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-slate-700">Display name<input className={`${fieldClass} mt-2`} value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></label>
              <label className="text-sm font-bold text-slate-700">Specialisation<input className={`${fieldClass} mt-2`} value={specialisation} onChange={(e) => setSpecialisation(e.target.value)} placeholder="e.g. Structural Engineer" /></label>
              <label className="text-sm font-bold text-slate-700">Years of experience<input type="number" min={0} max={80} className={`${fieldClass} mt-2`} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} /></label>
              <label className="text-sm font-bold text-slate-700">Phone<input className={`${fieldClass} mt-2`} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
              <label className="text-sm font-bold text-slate-700">City<input className={`${fieldClass} mt-2`} value={city} onChange={(e) => setCity(e.target.value)} /></label>
              <label className="text-sm font-bold text-slate-700">Country<input className={`${fieldClass} mt-2`} value={country} onChange={(e) => setCountry(e.target.value)} /></label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">Professional biography<textarea className={`${fieldClass} mt-2 min-h-32`} value={bio} onChange={(e) => setBio(e.target.value)} /></label>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Services offered</h3>
            <p className="mt-1 text-sm text-slate-500">Shown to clients on your public profile.</p>
            {services.length > 0 && (
              <ul className="mt-4 space-y-2">
                {services.map((service, index) => (
                  <li key={index} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{service.name}</p>
                      {service.description && <p className="mt-0.5 text-xs text-slate-500">{service.description}</p>}
                    </div>
                    <button type="button" onClick={() => removeService(index)} className="shrink-0 text-xs font-bold text-red-600 hover:text-red-800">Remove</button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="text-xs font-bold text-slate-700">Service name<input className={`${fieldClass} mt-1.5`} value={newService.name} onChange={(e) => setNewService((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. Structural assessment" /></label>
              <label className="text-xs font-bold text-slate-700">Description (optional)<input className={`${fieldClass} mt-1.5`} value={newService.description} onChange={(e) => setNewService((s) => ({ ...s, description: e.target.value }))} /></label>
              <SecondaryButton type="button" onClick={addService} disabled={!newService.name.trim()}>Add service</SecondaryButton>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Example projects done</h3>
            <p className="mt-1 text-sm text-slate-500">Shown as your portfolio on the public professionals directory.</p>
            {portfolio.length > 0 && (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {portfolio.map((item, index) => (
                  <li key={index} className="overflow-hidden rounded-xl border border-slate-100">
                    {item.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="h-28 w-full object-cover" />
                    )}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-slate-800">{item.title}</p>
                        <button type="button" onClick={() => removeProject(index)} className="shrink-0 text-xs font-bold text-red-600 hover:text-red-800">Remove</button>
                      </div>
                      {item.year && <p className="text-xs text-slate-400">{item.year}</p>}
                      {item.description && <p className="mt-1 text-xs text-slate-500">{item.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Add a project</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-700">Title<input className={`${fieldClass} mt-1.5`} value={newProject.title} onChange={(e) => setNewProject((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Kigali Heights Tower" /></label>
                <label className="text-xs font-bold text-slate-700">Year<input type="number" className={`${fieldClass} mt-1.5`} value={newProject.year} onChange={(e) => setNewProject((p) => ({ ...p, year: e.target.value }))} /></label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Description<textarea className={`${fieldClass} mt-1.5`} value={newProject.description} onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))} /></label>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className={`${projectImageUploading ? "opacity-50" : ""} cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-[#2ec440] hover:text-[#219b31]`}>
                  {projectImageUploading ? "Uploading…" : newProject.imageUrl ? "Change image" : "Add image"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={projectImageUploading} onChange={handleProjectImageChange} />
                </label>
                {newProject.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={newProject.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                )}
                <SecondaryButton type="button" className="ml-auto" onClick={addProject} disabled={!newProject.title.trim()}>Add project</SecondaryButton>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <PrimaryButton className="w-full" disabled={saving} onClick={handleSave}>{saving ? "Saving…" : "Save profile"}</PrimaryButton>
        </div>
      </div>
    </PageFrame>
  );
}
