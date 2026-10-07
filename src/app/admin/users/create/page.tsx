"use client";

import { allowedDistricts } from "@/lib/admin/propertyCategories";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth, type AccountRole } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { AdminApi, type AdminOrganization } from "@/lib/admin/api";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { regionsForCountry } from "@/lib/regions";
import { Card, DistrictChecklist, PageFrame, PrimaryButton, RequirePermission, fieldClass } from "@/components/admin/ui";
import DistrictSelect from "@/components/shared/DistrictSelect";
import Select from "@/components/shared/Select";

// The only roles created from this admin form (enforced server-side too — see access-service's
// POST /auth/admin/users). Customer only ever comes from public signup; Seller (Manager) is
// granted self-serve via the become-a-seller flow, never here.
type CreatableRole = Extract<AccountRole, "administrator" | "professional" | "supplier" | "organization_admin">;
const ROLE_OPTIONS: { value: CreatableRole; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "supplier", label: "Furniture Supplier" },
  { value: "organization_admin", label: "Organisation Admin" },
  { value: "administrator", label: "Administrator" },
];

// useSearchParams (for the ?organizationId= entry point from an organisation's own page) needs a
// Suspense boundary around it, or `next build` fails on this static page — see
// node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md.
export default function CreateUserPage() {
  return (
    <Suspense fallback={null}>
      <CreateUserForm />
    </Suspense>
  );
}

function CreateUserForm() {
  const { createUser, token } = useAuth();
  const canCreate = useIsAdministrator();
  // Arriving from an organisation's own page (Organizations.tsx's "+ Add staff member") — staff
  // belong to organisations, so that's the entry point we steer admins toward, rather than
  // making them pick the org back out of a generic dropdown here.
  const fromOrganizationId = useSearchParams().get("organizationId") || "";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [roleType, setRoleType] = useState<CreatableRole>(fromOrganizationId ? "organization_admin" : "professional");
  const [professionalKind, setProfessionalKind] = useState<"individual" | "firm">("individual");
  const [country, setCountry] = useState("");
  const [district, setDistrict] = useState("");
  const [organizations, setOrganizations] = useState<AdminOrganization[] | null>(null);
  const [organizationId, setOrganizationId] = useState(fromOrganizationId);
  const [scopeDistricts, setScopeDistricts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ email: string; emailDelivered: boolean } | null>(null);

  // Only fetched once the admin actually picks "Organisation Admin" — no point loading the
  // list for the common case of creating a Professional or Administrator.
  useEffect(() => {
    if (roleType !== "organization_admin" || !token || organizations !== null) return;
    AdminApi.listOrganizations(token).then((result) => {
      if (result.ok) setOrganizations(result.data);
    });
  }, [roleType, token, organizations]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    if (roleType === "organization_admin" && !organizationId) {
      setError("Please choose an organisation.");
      return;
    }
    if ((roleType === "professional" || roleType === "supplier") && !country) {
      setError("Please choose a country.");
      return;
    }
    setIsSubmitting(true);
    const result = await createUser({
      firstName,
      lastName,
      email,
      roleType,
      professionalKind: roleType === "professional" ? professionalKind : undefined,
      country: roleType === "professional" || roleType === "supplier" ? country : undefined,
      district: roleType === "professional" ? (district || undefined) : undefined,
      organizationId: roleType === "organization_admin" ? organizationId : undefined,
      scopeDistricts: roleType === "organization_admin" && scopeDistricts.length ? scopeDistricts : undefined,
    });
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCreated({ email, emailDelivered: result.emailDelivered });
    setFirstName("");
    setLastName("");
    setEmail("");
    setDistrict("");
    setScopeDistricts([]);
  };

  const orgName = organizations?.find((o) => o.id === fromOrganizationId)?.name;
  const selectedOrg = organizations?.find((o) => o.id === organizationId);

  return (
    <PageFrame
      title={fromOrganizationId ? "Add staff member" : "Create user"}
      action={
        <Link href={fromOrganizationId ? `/admin/organizations/${fromOrganizationId}` : "/admin/users"} className="text-sm font-bold text-slate-500 hover:text-[#219b31]">
          {fromOrganizationId ? "Back to organisation" : "Back to Users"}
        </Link>
      }
    >
      <RequirePermission granted={canCreate}>
        <Card className="max-w-xl">
          {created && (
            <div className={`mb-5 rounded-xl border p-4 text-sm ${created.emailDelivered ? "border-emerald-100 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
              {created.emailDelivered ? (
                <>
                  <p className="font-bold text-emerald-800">Account created for {created.email}</p>
                  <p className="mt-1 text-emerald-700">Sign-in instructions with a temporary password have been emailed to them.</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-amber-800">Account created for {created.email}</p>
                  <p className="mt-1 text-amber-700">We couldn&apos;t confirm the credentials email was delivered — check with them, or contact support to resend it.</p>
                </>
              )}
            </div>
          )}

          {error && (
            <p className="mb-5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3">
              {error}
            </p>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700">
                First name
                <input className={`${fieldClass} mt-2`} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Last name
                <input className={`${fieldClass} mt-2`} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </label>
            </div>

            <label className="block text-sm font-bold text-slate-700">
              Email address
              <input type="email" className={`${fieldClass} mt-2`} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            {!fromOrganizationId && (
              <label className="block text-sm font-bold text-slate-700">
                Role
                <Select className={`${fieldClass} mt-2`} value={roleType} onChange={(e) => setRoleType(e.target.value as CreatableRole)}>
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </label>
            )}

            {(roleType === "professional" || roleType === "supplier") && (
              <div className="grid gap-4 sm:grid-cols-2">
                {roleType === "professional" && (
                  <label className="block text-sm font-bold text-slate-700">
                    Professional type
                    <Select className={`${fieldClass} mt-2`} value={professionalKind} onChange={(e) => setProfessionalKind(e.target.value as "individual" | "firm")}>
                      <option value="individual">Individual professional</option>
                      <option value="firm">Firm / company</option>
                    </Select>
                  </label>
                )}
                <label className="block text-sm font-bold text-slate-700">
                  Country
                  <Select className={`${fieldClass} mt-2`} value={country} onChange={(e) => { setCountry(e.target.value); setDistrict(""); }} required>
                    <option value="" disabled>Select a country</option>
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.name}>{c.name}</option>
                    ))}
                  </Select>
                </label>
                {roleType === "professional" && regionsForCountry(country) && (
                  <label className="block text-sm font-bold text-slate-700">
                    District
                    <DistrictSelect country={country} value={district} onChange={setDistrict} className="mt-2" />
                  </label>
                )}
              </div>
            )}

            {roleType === "organization_admin" && fromOrganizationId ? (
              <label className="block text-sm font-bold text-slate-700">
                Organisation
                <p className={`${fieldClass} mt-2 bg-slate-50 text-slate-600`}>{orgName ?? "Loading…"}</p>
              </label>
            ) : roleType === "organization_admin" ? (
              <label className="block text-sm font-bold text-slate-700">
                Organisation
                {organizations === null ? (
                  <p className="mt-2 text-sm font-medium text-slate-400">Loading organisations…</p>
                ) : organizations.length === 0 ? (
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    No organisations yet —{" "}
                    <Link href="/admin/organizations/create" className="font-bold text-[#219b31] underline">
                      create one first
                    </Link>
                    .
                  </p>
                ) : (
                  <Select className={`${fieldClass} mt-2`} value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} required>
                    <option value="" disabled>Select an organisation</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </Select>
                )}
              </label>
            ) : null}

            {roleType === "organization_admin" && selectedOrg && selectedOrg.countries.some((c) => regionsForCountry(c)) && (
              <div>
                <p className="text-sm font-bold text-slate-700">Scope</p>
                <p className="mt-1 text-xs text-slate-500">Leave unselected for this organisation&apos;s full country-wide scope, or narrow this account to specific districts.</p>
                <div className="mt-2">
                  <DistrictChecklist
                    countries={selectedOrg.countries}
                    allowed={allowedDistricts(selectedOrg.regionScopes)}
                    selected={scopeDistricts}
                    onToggle={(d) => setScopeDistricts((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))}
                  />
                </div>
              </div>
            )}

            <PrimaryButton type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating…" : "Create account"}
            </PrimaryButton>
          </form>
        </Card>
      </RequirePermission>
    </PageFrame>
  );
}
