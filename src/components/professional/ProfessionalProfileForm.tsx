"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchMyProfessionalProfile, saveMyProfessionalProfile, uploadProfessionalImage, type PortfolioItemInput, type ServiceOfferingInput } from "@/lib/professional/api";
import { notifyProfilePhotoChanged } from "@/lib/profilePhoto";
import { useToast } from "@/lib/toast-context";
import { Card, PageFrame, PrimaryButton, SecondaryButton, fieldClass } from "./ui";

// Saving here calls PUT /professionals/me (access-service), which also clears account.profileCompleted and
// makes the profile visible on the public /professionals directory. Portfolio management used to be its
// own page (PortfolioPage.tsx, at /professional/portfolio) — merged in here since it's saved as part of
// this same profile document anyway (PUT /professionals/me always saves a complete profile, no partial
// update), so keeping it a separate page just meant two fetches and two saves of the same data.
const PROFESSIONAL_KIND_LABEL: Record<string, string> = { individual: "Individual professional", firm: "Firm / company" };
const MAX_PROJECT_IMAGES = 8;
const SUPPORTED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function projectImages(item: PortfolioItemInput): string[] {
  return item.images?.length ? item.images : item.imageUrl ? [item.imageUrl] : [];
}

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
  // Country is admin-assigned (set at account creation, used to scope which org-admin can see
  // this account) and deliberately not part of what this form saves — see access-service's
  // upsertMyProfile. Shown read-only below, same treatment as `kind`.
  const [country, setCountry] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [portfolio, setPortfolio] = useState<PortfolioItemInput[]>([]);
  const [services, setServices] = useState<ServiceOfferingInput[]>([]);

  const [newService, setNewService] = useState({ name: "", description: "" });
  const [newProject, setNewProject] = useState<{ title: string; description: string; year: string; images: string[]; videoUrl: string }>({ title: "", description: "", year: "", images: [], videoUrl: "" });
  const [projectImagesUploading, setProjectImagesUploading] = useState(false);
  const [projectVideoUploading, setProjectVideoUploading] = useState(false);

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
      setDistrict(profile.district ?? "");
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

  const addService = () => {
    if (!newService.name.trim()) return;
    setServices((list) => [...list, { name: newService.name.trim(), description: newService.description.trim() || undefined }]);
    setNewService({ name: "", description: "" });
  };
  const removeService = (index: number) => setServices((list) => list.filter((_, i) => i !== index));

  const handleProjectImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length || !token) return;
    const room = MAX_PROJECT_IMAGES - newProject.images.length;
    if (room <= 0) {
      showToast(`You can add at most ${MAX_PROJECT_IMAGES} images per project.`, "error");
      return;
    }
    setProjectImagesUploading(true);
    setError("");
    try {
      const uploaded = await Promise.all(files.slice(0, room).map((file) => uploadProfessionalImage(file, file.type, token)));
      setNewProject((p) => ({ ...p, images: [...p.images, ...uploaded] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setProjectImagesUploading(false);
    }
  };

  const removeNewProjectImage = (index: number) => setNewProject((p) => ({ ...p, images: p.images.filter((_, i) => i !== index) }));

  const handleProjectVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !token) return;
    if (!SUPPORTED_VIDEO_TYPES.has(file.type)) {
      showToast("Please choose an MP4, WebM, or MOV video.", "error");
      return;
    }
    setProjectVideoUploading(true);
    setError("");
    try {
      const url = await uploadProfessionalImage(file, file.type, token);
      setNewProject((p) => ({ ...p, videoUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload video.");
    } finally {
      setProjectVideoUploading(false);
    }
  };

  const addProject = () => {
    if (!newProject.title.trim()) return;
    setPortfolio((list) => [...list, {
      title: newProject.title.trim(),
      description: newProject.description.trim() || undefined,
      year: newProject.year ? Number(newProject.year) : undefined,
      images: newProject.images,
      videoUrl: newProject.videoUrl || undefined,
    }]);
    setNewProject({ title: "", description: "", year: "", images: [], videoUrl: "" });
  };
  const removeProject = (index: number) => setPortfolio((list) => list.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!token || saving) return;
    setSaving(true);
    setError("");
    const result = await saveMyProfessionalProfile(token, {
      displayName, bio, specialisation, city, phone,
      yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
      portfolio, services, photoUrl,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await refreshAccount();
    notifyProfilePhotoChanged();
    showToast("Profile updated.");
  };

  if (!loaded) return null;

  return (
    <PageFrame title="Professional profile">
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
              <div className="text-sm font-bold text-slate-700">
                Country
                <p className={`${fieldClass} mt-2 flex items-center bg-slate-50 text-slate-500`}>{country || "Not set"}</p>
                <p className="mt-1 text-xs font-medium text-slate-400">Set by your administrator.</p>
              </div>
              {district && (
                <div className="text-sm font-bold text-slate-700">
                  District
                  <p className={`${fieldClass} mt-2 flex items-center bg-slate-50 text-slate-500`}>{district}</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">Set by your administrator.</p>
                </div>
              )}
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
            <p className="mt-1 text-sm text-slate-500">Shown to clients on your public profile. Add several photos and a video walkthrough per project.</p>

            {portfolio.length > 0 && (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {portfolio.map((item, index) => {
                  const images = projectImages(item);
                  return (
                    <li key={index} className="overflow-hidden rounded-xl border border-slate-100">
                      {images.length > 0 && (
                        <div className="flex gap-1 overflow-x-auto">
                          {images.map((url, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={url} alt="" className="h-28 w-32 shrink-0 object-cover" />
                          ))}
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-slate-800">{item.title}</p>
                          <button type="button" onClick={() => removeProject(index)} className="shrink-0 text-xs font-bold text-red-600 hover:text-red-800">Remove</button>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                          {item.year && <span>{item.year}</span>}
                          {images.length > 1 && <span>{images.length} photos</span>}
                          {item.videoUrl && <span className="font-bold text-[#219b31]">Video included</span>}
                        </div>
                        {item.description && <p className="mt-1 text-xs text-slate-500">{item.description}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Add a project</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-700">Title<input className={`${fieldClass} mt-1.5`} value={newProject.title} onChange={(e) => setNewProject((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Kigali Heights Tower" /></label>
                <label className="text-xs font-bold text-slate-700">Year<input type="number" className={`${fieldClass} mt-1.5`} value={newProject.year} onChange={(e) => setNewProject((p) => ({ ...p, year: e.target.value }))} /></label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Description<textarea className={`${fieldClass} mt-1.5`} value={newProject.description} onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))} /></label>
              </div>

              {newProject.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {newProject.images.map((url, i) => (
                    <div key={i} className="relative h-16 w-16">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full rounded-lg object-cover" />
                      <button type="button" onClick={() => removeNewProjectImage(i)} aria-label="Remove image" className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold shadow">
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className={`${projectImagesUploading || newProject.images.length >= MAX_PROJECT_IMAGES ? "pointer-events-none opacity-50" : ""} cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-[#2ec440] hover:text-[#219b31]`}>
                  {projectImagesUploading ? "Uploading…" : `Add images (${newProject.images.length}/${MAX_PROJECT_IMAGES})`}
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={projectImagesUploading || newProject.images.length >= MAX_PROJECT_IMAGES} onChange={handleProjectImagesChange} />
                </label>

                <label className={`${projectVideoUploading ? "opacity-50" : ""} cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-[#2ec440] hover:text-[#219b31]`}>
                  {projectVideoUploading ? "Uploading…" : newProject.videoUrl ? "Change video" : "Add video"}
                  <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" disabled={projectVideoUploading} onChange={handleProjectVideoChange} />
                </label>
                {newProject.videoUrl && (
                  <button type="button" onClick={() => setNewProject((p) => ({ ...p, videoUrl: "" }))} className="text-xs font-bold text-red-600 hover:text-red-800">
                    Remove video
                  </button>
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
