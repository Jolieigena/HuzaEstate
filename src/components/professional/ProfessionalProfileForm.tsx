"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Select from "@/components/shared/Select";
import { DesignsApi } from "@/lib/designs/api";
import { CurrencySelect } from "@/components/designs/fields";
import { useCurrencyOptions } from "@/lib/currencies";
import { SERVICE_PRICE_TYPE_LABELS, fetchMyProfessionalProfile, formatServicePrice, saveMyProfessionalProfile, uploadProfessionalImage, type PortfolioItemInput, type ServiceOfferingInput, type ServicePriceType } from "@/lib/professional/api";
import { notifyProfilePhotoChanged } from "@/lib/profilePhoto";
import { useToast } from "@/lib/toast-context";
import MultiSelectCombobox from "@/components/shared/MultiSelectCombobox";
import { MAX_SPECIALISATIONS, SPECIALISATION_GROUPS } from "@/lib/professional/specialisations";
import { PageFrame, PrimaryButton, SecondaryButton, fieldClass } from "./ui";

// Saving here calls PUT /professionals/me (access-service), which also clears account.profileCompleted and
// makes the profile visible on the public /professionals directory. Portfolio management used to be its
// own page (PortfolioPage.tsx, at /professional/portfolio) — merged in here since it's saved as part of
// this same profile document anyway (PUT /professionals/me always saves a complete profile, no partial
// update), so keeping it a separate page just meant two fetches and two saves of the same data.
const PROFESSIONAL_KIND_LABEL: Record<string, string> = { individual: "Individual professional", firm: "Firm / company" };
const MAX_PROJECT_IMAGES = 8;
const SUPPORTED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

/** One titled block of the profile form: a numbered heading and a one-line purpose, then the fields. */
function Section({ id, step, title, description, children }: { id: string; step: number; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">{step}</span>
        <div>
          <h3 className="text-base font-black text-slate-900">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
      </header>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block text-sm font-bold text-slate-700 ${className}`}>
      {label}
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-xs font-medium text-slate-400">{hint}</p>}
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm font-bold text-slate-700">
      {label}
      <p className={`${fieldClass} mt-1.5 flex items-center bg-slate-50 font-normal text-slate-500`}>{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-400">Set by your administrator.</p>
    </div>
  );
}

function ChecklistGroup({ title, items }: { title: string; items: { label: string; done: boolean; href: string }[] }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item.label}>
            <a href={item.href} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${item.done ? "bg-[#2ec440] text-white" : "border border-slate-300 text-transparent"}`} aria-hidden="true">✓</span>
              <span className={item.done ? "text-slate-400 line-through" : ""}>{item.label}</span>
              <span className="sr-only">{item.done ? "done" : "to do"}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
  const [specialisations, setSpecialisations] = useState<string[]>([]);
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

  const [newService, setNewService] = useState<{ name: string; description: string; priceType: ServicePriceType | ""; price: string; currency: string }>({ name: "", description: "", priceType: "", price: "", currency: "" });
  const { defaultCurrency } = useCurrencyOptions();
  // How many designs this professional has published, shown in the Designs step (null until known).
  const [designCount, setDesignCount] = useState<number | null>(null);
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
      // A professional who hasn't completed their profile yet has none of these saved, so the
      // API can hand back undefined — every text field here must stay a string.
      setDisplayName((current) => profile.displayName ?? current);
      setBio(profile.bio ?? "");
      setSpecialisations(profile.specialisations ?? (profile.specialisation ? [profile.specialisation] : []));
      setYearsExperience(profile.yearsExperience != null ? String(profile.yearsExperience) : "");
      setCity(profile.city ?? "");
      setCountry(profile.country ?? "");
      setDistrict(profile.district ?? "");
      setPhone(profile.phone ?? "");
      setPortfolio(profile.portfolio ?? []);
      setServices(profile.services ?? []);
    }).finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [token]);

  // The Designs step shows how many designs exist. Designs need a saved profile, so ask only once it is.
  const profileSaved = account?.profileCompleted !== false;
  useEffect(() => {
    if (!token || !profileSaved) return;
    let cancelled = false;
    DesignsApi.mine(token).then((result) => {
      if (!cancelled && result.ok) setDesignCount(result.data.designs.length);
    });
    return () => { cancelled = true; };
  }, [token, profileSaved]);

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
    const priced = newService.priceType && newService.priceType !== "on_request";
    if (priced && !(Number(newService.price) > 0)) {
      setError("Enter a price above zero, or choose \"On request\".");
      return;
    }
    setError("");
    setServices((list) => [
      ...list,
      {
        name: newService.name.trim(),
        description: newService.description.trim() || undefined,
        ...(newService.priceType ? { priceType: newService.priceType } : {}),
        ...(priced ? { price: Number(newService.price), currency: newService.currency || defaultCurrency } : {}),
      },
    ]);
    setNewService({ name: "", description: "", priceType: "", price: "", currency: newService.currency });
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
      displayName, bio, specialisations, city, phone,
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

  // What a client needs before the profile can go public: the same "fill in every field" the old
  // banner asked for, now shown as a live checklist.
  const required = [
    { label: "Display name", done: !!displayName.trim(), href: "#details" },
    { label: "Specialisations", done: specialisations.length > 0, href: "#details" },
    { label: "Years of experience", done: yearsExperience !== "", href: "#details" },
    { label: "Biography", done: !!bio.trim(), href: "#details" },
    { label: "Phone", done: !!phone.trim(), href: "#contact" },
    { label: "City", done: !!city.trim(), href: "#contact" },
  ];
  const doneCount = required.filter((item) => item.done).length;
  const recommended = [
    { label: "Profile photo", done: !!photoUrl, href: "#photo" },
    { label: "At least one service", done: services.length > 0, href: "#services" },
    { label: "At least one project", done: portfolio.length > 0, href: "#projects" },
    { label: "At least one design", done: (designCount ?? 0) > 0, href: "#designs" },
  ];
  const isPublic = account?.profileCompleted !== false;

  return (
    <PageFrame title="Professional profile" description="This is what clients see in the professionals directory. Keep it current: complete profiles get more enquiries.">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6 pb-20 xl:pb-0">
          {error && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}

          <Section id="photo" step={1} title="Photo & identity" description="Your photo appears next to your name across the platform.">
            <div className="flex flex-wrap items-center gap-5">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-4 ring-slate-50">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-900 text-3xl font-bold text-white">{(displayName || "?").charAt(0)}</div>
                )}
              </div>
              <div>
                <p className="text-base font-black text-slate-900">{displayName || "Your name"}</p>
                {kind && <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{PROFESSIONAL_KIND_LABEL[kind] ?? kind} · set by your administrator</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className={`${photoUploading ? "opacity-50" : ""} inline-block cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-[#2ec440] hover:text-[#219b31]`}>
                    {photoUploading ? "Uploading…" : photoUrl ? "Change photo" : "Upload photo"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={photoUploading} onChange={handlePhotoChange} />
                  </label>
                  {photoUrl && (
                    <button type="button" disabled={photoUploading} onClick={() => setPhotoUrl(undefined)} className="rounded-xl px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
                      Remove photo
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-slate-400">JPG, PNG or WebP. A clear head-and-shoulders photo works best. Photo changes apply when you save.</p>
              </div>
            </div>
          </Section>

          <Section id="details" step={2} title="About you" description="Who you are and what you do.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Display name"><input className={fieldClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></Field>
              <Field label="Years of experience"><input type="number" min={0} max={80} className={fieldClass} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} /></Field>
              <div className="text-sm font-bold text-slate-700 sm:col-span-2">
                <span id="specialisations-label">Specialisations</span>
                <div className="mt-1.5">
                  <MultiSelectCombobox
                    value={specialisations}
                    onChange={setSpecialisations}
                    groups={SPECIALISATION_GROUPS}
                    max={MAX_SPECIALISATIONS}
                    placeholder="Search and choose what you specialise in…"
                    ariaLabel="Specialisations"
                  />
                </div>
                <p className="mt-1 text-xs font-medium text-slate-400">Choose up to {MAX_SPECIALISATIONS}. Can&apos;t find yours? Type it and add it.</p>
              </div>
              <Field label="Professional biography" className="sm:col-span-2" hint="A few sentences on your background, the work you take on and how you work with clients.">
                <textarea className={`${fieldClass} min-h-32`} value={bio} onChange={(e) => setBio(e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section id="contact" step={3} title="Contact & location" description="How clients reach you and where you work.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone"><input className={fieldClass} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
              <Field label="City"><input className={fieldClass} value={city} onChange={(e) => setCity(e.target.value)} /></Field>
              <ReadOnlyField label="Country" value={country || "Not set"} />
              {district && <ReadOnlyField label="District" value={district} />}
            </div>
          </Section>

          <Section id="services" step={4} title="Services offered" description="Shown to clients on your public profile.">
            {services.length > 0 && (
              <ul className="mb-4 space-y-2">
                {services.map((service, index) => (
                  <li key={index} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{service.name}</p>
                      {formatServicePrice(service) && <p className="mt-0.5 text-xs font-bold text-[#219b31]">{formatServicePrice(service)}</p>}
                      {service.description && <p className="mt-0.5 text-xs text-slate-500">{service.description}</p>}
                    </div>
                    <button type="button" onClick={() => removeService(index)} className="shrink-0 text-xs font-bold text-red-600 hover:text-red-800">Remove</button>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid gap-3 rounded-xl border border-dashed border-slate-200 p-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-700">Service name<input className={`${fieldClass} mt-1.5`} value={newService.name} onChange={(e) => setNewService((v) => ({ ...v, name: e.target.value }))} placeholder="e.g. Structural assessment" /></label>
              <label className="text-xs font-bold text-slate-700">Description (optional)<input className={`${fieldClass} mt-1.5`} value={newService.description} onChange={(e) => setNewService((v) => ({ ...v, description: e.target.value }))} /></label>
              <label className="text-xs font-bold text-slate-700">
                Price (optional)
                <Select className={`${fieldClass} mt-1.5`} value={newService.priceType} onChange={(e) => setNewService((v) => ({ ...v, priceType: e.target.value as ServicePriceType | "" }))}>
                  <option value="">No price shown</option>
                  {(Object.keys(SERVICE_PRICE_TYPE_LABELS) as ServicePriceType[]).map((t) => (
                    <option key={t} value={t}>{SERVICE_PRICE_TYPE_LABELS[t]}</option>
                  ))}
                </Select>
              </label>
              {newService.priceType && newService.priceType !== "on_request" ? (
                <div className="grid grid-cols-[1fr_5rem] gap-3">
                  <label className="text-xs font-bold text-slate-700">Amount<input className={`${fieldClass} mt-1.5`} inputMode="decimal" value={newService.price} onChange={(e) => setNewService((v) => ({ ...v, price: e.target.value.replace(/[^\d.]/g, "") }))} /></label>
                  <label className="text-xs font-bold text-slate-700">Currency<CurrencySelect className={`${fieldClass} mt-1.5`} value={newService.currency || defaultCurrency} onChange={(currency) => setNewService((v) => ({ ...v, currency }))} /></label>
                </div>
              ) : (
                <div />
              )}
              <div className="sm:col-span-2">
                <SecondaryButton type="button" onClick={addService} disabled={!newService.name.trim()}>Add service</SecondaryButton>
              </div>
            </div>
          </Section>

          <Section id="projects" step={5} title="Example projects" description="Show your work. Add several photos and a video walkthrough per project.">
            {portfolio.length > 0 && (
              <ul className="grid gap-3 sm:grid-cols-2">
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
          </Section>

          <Section id="designs" step={6} title="Designs">
            {account?.profileCompleted === false ? (
              <p className="text-sm font-semibold text-slate-500">Save your profile first. Then you can publish priced interior and exterior designs here.</p>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">{designCount === null ? "Loading…" : designCount === 0 ? "You have no designs yet." : `${designCount} ${designCount === 1 ? "design" : "designs"}`}</p>
                <Link href="/professional/designs" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2ec440]">
                  {designCount ? "Manage designs" : "Add a design"}
                </Link>
              </div>
            )}
          </Section>
        </div>

        <aside className="hidden xl:sticky xl:top-24 xl:block">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Profile checklist</h3>
              <span className="text-sm font-bold text-slate-500">{doneCount}/{required.length}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={required.length} aria-valuenow={doneCount} aria-label="Required fields completed">
              <div className="h-full rounded-full bg-[#2ec440] transition-all" style={{ width: `${(doneCount / required.length) * 100}%` }} />
            </div>
            <p className={`mt-3 rounded-lg px-3 py-2 text-xs font-semibold ${isPublic ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"}`}>
              {isPublic ? "Your profile is visible to clients." : "Not visible to clients yet. Complete every required field and save."}
            </p>
            <ChecklistGroup title="Required" items={required} />
            <ChecklistGroup title="Recommended" items={recommended} />
            <PrimaryButton className="mt-5 w-full" disabled={saving} onClick={handleSave}>{saving ? "Saving…" : "Save profile"}</PrimaryButton>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur xl:hidden">
        <span className="text-xs font-bold text-slate-500">{doneCount}/{required.length} required fields done</span>
        <PrimaryButton disabled={saving} onClick={handleSave}>{saving ? "Saving…" : "Save profile"}</PrimaryButton>
      </div>
    </PageFrame>
  );
}
