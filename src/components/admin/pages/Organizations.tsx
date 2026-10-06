"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/shared/ConfirmModal";
import AddressInput from "@/components/shared/AddressInput";
import PhoneInput from "@/components/shared/PhoneInput";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { AdminApi, type AdminOrganization } from "@/lib/admin/api";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { describeDistricts, describePropertyCategories } from "@/lib/admin/propertyCategories";
import { districtsForCountry } from "@/lib/regions";
import RegionChecklist from "../RegionChecklist";
import PropertyCategoryChecklist from "../PropertyCategoryChecklist";
import { useToast } from "@/lib/toast-context";
import { Card, DestructiveButton, EmptyState, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, fieldClass, formatDate } from "../ui";

// A checklist of every country this organisation operates in — admin-assigned, and changeable
// any time (see the Detail page below). Same checkbox-list pattern /properties' own Country
// filter uses, just inline in a form instead of a popover.
function CountryChecklist({ selected, onToggle }: { selected: string[]; onToggle: (name: string) => void }) {
  const [search, setSearch] = useState("");
  const visible = COUNTRY_OPTIONS.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()));
  return (
    <div>
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((name) => (
            <span key={name} className="inline-flex items-center gap-1.5 rounded-full border border-[#2ec440]/25 bg-[#2ec440]/10 py-1 pl-3 pr-1.5 text-xs font-bold text-[#219b31]">
              {name}
              <button
                type="button"
                onClick={() => onToggle(name)}
                aria-label={`Remove ${name}`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-[#219b31]/70 transition-colors hover:bg-[#2ec440]/25 hover:text-[#219b31]"
              >
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        placeholder="Search countries…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`${fieldClass} mb-2`}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 p-3">
        {visible.map((c) => (
          <label key={c.code} className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-slate-50 cursor-pointer text-sm text-slate-700 font-medium">
            <input type="checkbox" checked={selected.includes(c.name)} onChange={() => onToggle(c.name)} className="accent-[#2ec440] w-4 h-4 cursor-pointer" />
            {c.name}
          </label>
        ))}
      </div>
    </div>
  );
}

type ListState = { data?: AdminOrganization[]; error?: string };

export function OrganizationsListPage() {
  const { token, isAuthReady } = useAuth();
  const canView = useIsAdministrator();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState<ListState | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!isAuthReady || !token || !canView) return;
    let cancelled = false;
    AdminApi.listOrganizations(token, { country: country || undefined }).then((result) => {
      if (cancelled) return;
      setState(result.ok ? { data: result.data } : { error: result.error });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, country, reloadCount]);

  const filtered = (state?.data ?? []).filter((org) => !search.trim() || org.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <PageFrame
      title="Organisations"
      action={
        canView ? (
          <Link href="/admin/organizations/create" className="min-h-11 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
            + Create organisation
          </Link>
        ) : undefined
      }
    >
      <RequirePermission granted={canView}>
        <Card className="mb-5">
          <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr]">
            <label className="text-sm font-bold text-slate-700">
              Search
              <input className={`${fieldClass} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Organisation name" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Country
              <select className={`${fieldClass} mt-1`} value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="">All countries</option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.name}>{c.name}</option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        {state?.error ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">
            {state.error}{" "}
            <button className="font-bold underline" onClick={() => setReloadCount((n) => n + 1)}>
              Retry
            </button>
          </Card>
        ) : !state ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading organisations…</p>
        ) : filtered.length ? (
          <div className="grid gap-3">
            {filtered.map((org) => (
              <Link key={org.id} href={`/admin/organizations/${org.id}`}>
                <Card className="p-4 transition-shadow hover:shadow-md">
                  <div className="grid gap-2 sm:grid-cols-[1.6fr_1fr_1fr]">
                    <div>
                      <p className="font-black text-slate-900">{org.name}</p>
                      {org.contactEmail && <p className="text-xs text-slate-500">{org.contactEmail}</p>}
                      {org.countries.length > 0 && <p className="text-xs text-slate-500 mt-0.5">{org.countries.join(", ")}</p>}
                    </div>
                    <p className="text-sm font-semibold text-slate-600">
                      {org.memberCount} {org.memberCount === 1 ? "staff member" : "staff members"}
                    </p>
                    <p className="text-xs text-slate-500">Created {formatDate(org.createdAt)}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No organisations found" description={search.trim() || country ? "Try a different search or country." : "Create one to start assigning staff accounts to it."} />
        )}
      </RequirePermission>
    </PageFrame>
  );
}

export function CreateOrganizationPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const canCreate = useIsAdministrator();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleCountry = (name: string) => {
    const removing = countries.includes(name);
    setCountries((prev) => (removing ? prev.filter((c) => c !== name) : [...prev, name]));
    // Drop districts that belonged to a country that's no longer covered.
    if (removing) setDistricts((prev) => prev.filter((d) => !districtsForCountry(name).includes(d)));
  };
  const toggleDistrict = (d: string) => setDistricts((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  const setManyDistricts = (list: string[], on: boolean) => setDistricts((prev) => (on ? Array.from(new Set([...prev, ...list])) : prev.filter((d) => !list.includes(d))));
  const togglePropertyType = (value: string) => setPropertyTypes((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    const result = await AdminApi.createOrganization(token, {
      name,
      description: description || undefined,
      contactEmail,
      contactPhone: contactPhone || undefined,
      address: address || undefined,
      countries,
      propertyTypes,
      districts,
    });
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // The org itself is always created at this point — a failure here is just the
    // auto-provisioned admin account (e.g. that email's already in use elsewhere). Don't block
    // on it: land on the org's page either way, where "+ Add staff member" can retry.
    if (!result.data.admin.created) {
      showToast(`Organisation created, but the admin account couldn't be created: ${result.data.admin.error}`, "error");
    } else if (!result.data.admin.emailDelivered) {
      showToast("Organisation created, but the sign-in email couldn't be delivered.", "error");
    }
    router.push(`/admin/organizations/${result.data.organization.id}`);
  };

  return (
    <PageFrame
      title="Create organisation"
      action={
        <Link href="/admin/organizations" className="text-sm font-bold text-slate-500 hover:text-[#219b31]">
          Back to Organisations
        </Link>
      }
    >
      <RequirePermission granted={canCreate}>
        <Card className="max-w-xl">
          {error && (
            <p className="mb-5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3">
              {error}
            </p>
          )}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-bold text-slate-700">
              Organisation name
              <input className={`${fieldClass} mt-2`} value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Description
              <textarea className={`${fieldClass} mt-2`} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700">
                Contact email
                <input type="email" className={`${fieldClass} mt-2`} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
                <span className="mt-1 block text-xs font-medium text-slate-400">Used to sign in — the password is emailed here.</span>
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Contact phone
                <div className="mt-2">
                  <PhoneInput value={contactPhone} onChange={setContactPhone} />
                </div>
              </label>
            </div>
            <label className="block text-sm font-bold text-slate-700">
              Address
              <div className="mt-2">
                <AddressInput value={address} onChange={setAddress} />
              </div>
            </label>
            <div className="block text-sm font-bold text-slate-700">
              Countries
              <p className="mb-2 mt-0.5 text-xs font-medium text-slate-400">Which country/countries this organisation operates in — you can change this any time.</p>
              <CountryChecklist selected={countries} onToggle={toggleCountry} />
            </div>
            <div className="block text-sm font-bold text-slate-700">
              Property categories
              <p className="mb-2 mt-0.5 text-xs font-medium text-slate-400">Limit this organisation to certain kinds of property within its countries. Leave empty for all.</p>
              <PropertyCategoryChecklist selected={propertyTypes} onToggle={togglePropertyType} />
            </div>
            <div className="block text-sm font-bold text-slate-700">
              Regions
              <p className="mb-2 mt-0.5 text-xs font-medium text-slate-400">Limit this organisation to certain districts of its countries. Leave empty for the whole country.</p>
              <RegionChecklist countries={countries} selected={districts} onToggle={toggleDistrict} onSetMany={setManyDistricts} />
            </div>

            <PrimaryButton type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating…" : "Create organisation"}
            </PrimaryButton>
          </form>
        </Card>
      </RequirePermission>
    </PageFrame>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-1 break-all font-semibold text-slate-700">{value}</dd>
    </div>
  );
}

type DetailState = { id: string; org?: AdminOrganization; error?: string };

export function OrganizationDetailPage({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const { token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const canManage = useIsAdministrator();

  const [detail, setDetail] = useState<DetailState | null>(null);
  const [form, setForm] = useState<{ id: string; name: string; description: string; contactEmail: string; contactPhone: string; address: string; countries: string[]; propertyTypes: string[]; districts: string[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [savingAutoPublish, setSavingAutoPublish] = useState(false);

  useEffect(() => {
    if (!isAuthReady || !token || !canManage) return;
    let cancelled = false;
    AdminApi.getOrganization(token, organizationId).then((result) => {
      if (cancelled) return;
      setDetail(result.ok ? { id: organizationId, org: result.data } : { id: organizationId, error: result.error });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canManage, organizationId]);

  const org = detail?.id === organizationId ? detail.org : undefined;
  const applyOrg = useCallback((next: AdminOrganization) => setDetail({ id: organizationId, org: next }), [organizationId]);

  if (!canManage) {
    return (
      <PageFrame title="Organisations">
        <RequirePermission granted={false}>{null}</RequirePermission>
      </PageFrame>
    );
  }

  if (!org) {
    if (!detail || detail.id !== organizationId) {
      return (
        <PageFrame title="Loading…">
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading organisation…</p>
        </PageFrame>
      );
    }
    return (
      <PageFrame title="Organisation not found">
        <EmptyState title="Organisation not found" description={detail.error ?? "It may have been deleted, or the link is incorrect."} action={<Link href="/admin/organizations" className="text-sm font-bold text-[#219b31]">Back to Organisations</Link>} />
      </PageFrame>
    );
  }

  const formValues = form?.id === org.id ? form : { id: org.id, name: org.name, description: org.description ?? "", contactEmail: org.contactEmail ?? "", contactPhone: org.contactPhone ?? "", address: org.address ?? "", countries: org.countries, propertyTypes: org.propertyTypes ?? [], districts: org.districts ?? [] };
  const dirty =
    formValues.name !== org.name ||
    formValues.description !== (org.description ?? "") ||
    formValues.contactEmail !== (org.contactEmail ?? "") ||
    formValues.contactPhone !== (org.contactPhone ?? "") ||
    formValues.address !== (org.address ?? "") ||
    formValues.countries.length !== org.countries.length ||
    formValues.countries.some((c) => !org.countries.includes(c)) ||
    formValues.propertyTypes.length !== (org.propertyTypes ?? []).length ||
    formValues.propertyTypes.some((t) => !(org.propertyTypes ?? []).includes(t)) ||
    formValues.districts.length !== (org.districts ?? []).length ||
    formValues.districts.some((d) => !(org.districts ?? []).includes(d));

  function toggleCountry(name: string) {
    const removing = formValues.countries.includes(name);
    setForm({
      ...formValues,
      countries: removing ? formValues.countries.filter((c) => c !== name) : [...formValues.countries, name],
      // Drop districts that belonged to a country that's no longer covered.
      districts: removing ? formValues.districts.filter((d) => !districtsForCountry(name).includes(d)) : formValues.districts,
    });
  }

  function toggleDistrict(d: string) {
    setForm({ ...formValues, districts: formValues.districts.includes(d) ? formValues.districts.filter((x) => x !== d) : [...formValues.districts, d] });
  }

  function setManyDistricts(list: string[], on: boolean) {
    setForm({ ...formValues, districts: on ? Array.from(new Set([...formValues.districts, ...list])) : formValues.districts.filter((d) => !list.includes(d)) });
  }

  function togglePropertyType(value: string) {
    setForm({ ...formValues, propertyTypes: formValues.propertyTypes.includes(value) ? formValues.propertyTypes.filter((t) => t !== value) : [...formValues.propertyTypes, value] });
  }

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !org) return;
    setSaving(true);
    const result = await AdminApi.updateOrganization(token, org.id, {
      name: formValues.name,
      description: formValues.description,
      contactEmail: formValues.contactEmail,
      contactPhone: formValues.contactPhone,
      address: formValues.address,
      countries: formValues.countries,
      propertyTypes: formValues.propertyTypes,
      districts: formValues.districts,
    });
    setSaving(false);
    if (result.ok) {
      applyOrg(result.data);
      setForm(null);
      showToast("Organisation updated.");
    } else showToast(result.error, "error");
  }

  async function setAutoPublish(next: boolean | null) {
    if (!token || !org || savingAutoPublish) return;
    setSavingAutoPublish(true);
    const result = await AdminApi.updateOrganization(token, org.id, { autoPublish: next });
    setSavingAutoPublish(false);
    if (result.ok) {
      applyOrg(result.data);
      showToast("Auto-publish setting saved.");
    } else showToast(result.error, "error");
  }

  async function remove() {
    if (!token || !org) return;
    const result = await AdminApi.deleteOrganization(token, org.id);
    setDeleteOpen(false);
    if (result.ok) {
      showToast(result.data.membersUnassigned > 0 ? `Organisation deleted. ${result.data.membersUnassigned} staff account(s) are no longer assigned to it.` : "Organisation deleted.");
      router.push("/admin/organizations");
    } else showToast(result.error, "error");
  }

  return (
    <PageFrame
      title={org.name}
      action={
        <Link href="/admin/organizations" className="text-sm font-bold text-slate-500 hover:text-[#219b31]">
          Back to Organisations
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-black text-slate-900">Details</h3>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label="Organisation ID" value={org.id} />
              <Field label="Staff members" value={org.memberCount} />
              <Field label="Created" value={formatDate(org.createdAt)} />
              <Field label="Address" value={org.address || "Not set"} />
              <Field label="Countries" value={org.countries.length > 0 ? org.countries.join(", ") : "None assigned"} />
              <Field label="Regions" value={describeDistricts(org.districts)} />
              <Field label="Property categories" value={describePropertyCategories(org.propertyTypes)} />
              <Field label="Auto-publish" value={org.autoPublish === true ? "Always" : org.autoPublish === false ? "Never" : "Platform default"} />
            </dl>
          </Card>

          {org.countries.length > 0 && (
            <Card>
              <h3 className="text-lg font-black text-slate-900">Auto-publish</h3>
              <p className="mt-1 text-sm text-slate-500">
                Whether a listing in {org.countries.join(", ")} skips review and goes straight to published. Overrides
                the platform-wide default (set in Settings) for just this organisation&apos;s countries.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {([
                  { value: true, label: "Always auto-publish" },
                  { value: false, label: "Always require review" },
                  { value: null, label: "Use platform default" },
                ] as const).map((opt) => {
                  const active = (org.autoPublish ?? null) === opt.value;
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      disabled={savingAutoPublish}
                      onClick={() => setAutoPublish(opt.value)}
                      className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors disabled:opacity-50 ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          <Card>
            <h3 className="text-lg font-black text-slate-900">Edit details</h3>
            <form className="mt-4 grid gap-4" onSubmit={saveDetails}>
              <label className="text-sm font-bold text-slate-700">
                Name
                <input className={`${fieldClass} mt-1`} value={formValues.name} onChange={(e) => setForm({ ...formValues, name: e.target.value })} />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Description
                <textarea className={`${fieldClass} mt-1`} rows={3} value={formValues.description} onChange={(e) => setForm({ ...formValues, description: e.target.value })} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold text-slate-700">
                  Contact email
                  <input type="email" className={`${fieldClass} mt-1`} value={formValues.contactEmail} onChange={(e) => setForm({ ...formValues, contactEmail: e.target.value })} />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Contact phone
                  <div className="mt-1">
                    <PhoneInput value={formValues.contactPhone} onChange={(v) => setForm({ ...formValues, contactPhone: v })} />
                  </div>
                </label>
              </div>
              <label className="text-sm font-bold text-slate-700">
                Address
                <div className="mt-1">
                  <AddressInput value={formValues.address} onChange={(v) => setForm({ ...formValues, address: v })} />
                </div>
              </label>
              <div className="text-sm font-bold text-slate-700">
                Countries
                <div className="mt-1">
                  <CountryChecklist selected={formValues.countries} onToggle={toggleCountry} />
                </div>
              </div>
              <div className="text-sm font-bold text-slate-700">
                Property categories
                <div className="mt-1">
                  <PropertyCategoryChecklist selected={formValues.propertyTypes} onToggle={togglePropertyType} />
                </div>
              </div>
              <div className="text-sm font-bold text-slate-700">
                Regions
                <div className="mt-1">
                  <RegionChecklist countries={formValues.countries} selected={formValues.districts} onToggle={toggleDistrict} onSetMany={setManyDistricts} />
                </div>
              </div>
              <div className="flex gap-2">
                <PrimaryButton type="submit" disabled={!dirty || saving}>
                  {saving ? "Saving…" : "Save changes"}
                </PrimaryButton>
                {dirty && (
                  <SecondaryButton type="button" onClick={() => setForm(null)}>
                    Reset
                  </SecondaryButton>
                )}
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-black text-slate-900">Staff</h3>
            <p className="mt-2 text-sm text-slate-500">
              {org.memberCount > 0
                ? `${org.memberCount} account${org.memberCount === 1 ? "" : "s"} belong to this organisation.`
                : "No staff yet."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link href={`/admin/users/create?organizationId=${org.id}`} className="min-h-11 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#2ec440]">
                + Add staff member
              </Link>
              {org.memberCount > 0 && (
                <Link href={`/admin/users?role=organization_admin&organizationId=${org.id}`} className="text-sm font-bold text-[#219b31] underline">
                  View staff in Users
                </Link>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Actions</h3>
            <div className="mt-4">
              <DestructiveButton onClick={() => setDeleteOpen(true)}>Delete organisation</DestructiveButton>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={remove}
        destructive
        title="Delete this organisation?"
        description={`This removes ${org.name} permanently. Its ${org.memberCount} staff account${org.memberCount === 1 ? "" : "s"} are kept — they just lose their organisation affiliation. This can't be undone.`}
        confirmLabel="Delete permanently"
      />
    </PageFrame>
  );
}
