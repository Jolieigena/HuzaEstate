"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { hasOrgPermission } from "@/lib/orgPermissions";
import { AdminApi, type AdminOrganization, type AdminUser, type UserStatus } from "@/lib/admin/api";
import { useToast } from "@/lib/toast-context";
import { regionsForCountry } from "@/lib/regions";
import { AdminTable, Card, DestructiveButton, EmptyState, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, StatusPill, fieldClass, formatDate } from "@/components/admin/ui";
import DistrictSelect from "@/components/shared/DistrictSelect";

export function OrgProfessionalsListPage() {
  const { token, account, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const canView = (account?.roles.includes("organization_admin") ?? false) && hasOrgPermission(account?.permissions, "manage_professionals");

  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!isAuthReady || !token || !canView || !account?.organizationId) return;
    let cancelled = false;
    AdminApi.listUsers(token, { role: "professional", limit: 200 }).then((result) => {
      if (cancelled) return;
      if (result.ok) setUsers(result.data.users);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, account?.organizationId, reloadCount]);

  const q = search.trim().toLowerCase();
  const rows = (users ?? []).filter((u) => !q || `${u.name} ${u.email} ${u.country ?? ""}`.toLowerCase().includes(q));

  async function toggleStatus(user: AdminUser) {
    if (!token) return;
    const nextStatus: UserStatus = user.status === "active" ? "suspended" : "active";
    setBusyId(user.id);
    const result = await AdminApi.updateUser(token, user.id, { status: nextStatus });
    setBusyId(null);
    if (result.ok) {
      setUsers((prev) => prev?.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)) ?? null);
      showToast(nextStatus === "active" ? "Professional restored." : "Professional suspended.");
    } else showToast(result.error, "error");
  }

  async function confirmDelete() {
    if (!token || !deleteTarget) return;
    const result = await AdminApi.deleteUser(token, deleteTarget.id);
    setDeleteTarget(null);
    if (result.ok) {
      showToast("Professional account deleted.");
      setReloadCount((n) => n + 1);
    } else showToast(result.error, "error");
  }

  return (
    <PageFrame
      title="Professionals"
      action={
        canView ? (
          <Link href="/org-admin/professionals/create" className="min-h-11 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
            + Create professional
          </Link>
        ) : undefined
      }
    >
      <RequirePermission granted={canView}>
        <Card className="mb-5">
          <label className="text-sm font-bold text-slate-700">
            Search
            <input className={`${fieldClass} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, or country" />
          </label>
        </Card>

        {error ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">{error}</Card>
        ) : !users ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading professionals…</p>
        ) : rows.length ? (
          <AdminTable headers={["Professional", "Country", "Status", "Joined", "Actions"]}>
            {rows.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{user.country ?? "—"}</td>
                <td className="px-6 py-4"><StatusPill status={user.status} /></td>
                <td className="px-6 py-4 text-xs text-slate-500">{formatDate(user.createdAt)}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <SecondaryButton className="min-h-9 px-3 py-1.5 text-xs" disabled={busyId === user.id} onClick={() => toggleStatus(user)}>
                      {user.status === "active" ? "Suspend" : "Restore"}
                    </SecondaryButton>
                    <DestructiveButton className="min-h-9 px-3 py-1.5 text-xs" onClick={() => setDeleteTarget(user)}>
                      Delete
                    </DestructiveButton>
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>
        ) : (
          <EmptyState title="No professionals yet" description="Create one to get started." action={<Link href="/org-admin/professionals/create" className="text-sm font-bold text-[#219b31] underline">Create professional</Link>} />
        )}
      </RequirePermission>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        destructive
        title="Delete this professional account?"
        description={deleteTarget ? `This permanently removes ${deleteTarget.name}'s account. This can't be undone.` : ""}
        confirmLabel="Delete permanently"
      />
    </PageFrame>
  );
}

export function OrgCreateProfessionalPage() {
  const { token, account, createUser } = useAuth();
  const canCreate = (account?.roles.includes("organization_admin") ?? false) && hasOrgPermission(account?.permissions, "manage_professionals");

  const [org, setOrg] = useState<AdminOrganization | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [professionalKind, setProfessionalKind] = useState<"individual" | "firm">("individual");
  const [country, setCountry] = useState("");
  const [district, setDistrict] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ email: string; emailDelivered: boolean } | null>(null);

  useEffect(() => {
    if (!token || !account?.organizationId) return;
    AdminApi.getOrganization(token, account.organizationId).then((result) => {
      if (result.ok) setOrg(result.data);
    });
  }, [token, account?.organizationId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    if (!country) {
      setError("Please choose a country.");
      return;
    }
    setIsSubmitting(true);
    const result = await createUser({ firstName, lastName, email, roleType: "professional", professionalKind, country, district: district || undefined });
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
  };

  return (
    <PageFrame
      title="Create professional"
      action={
        <Link href="/org-admin/professionals" className="text-sm font-bold text-slate-500 hover:text-[#219b31]">
          Back to Professionals
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
                  <p className="mt-1 text-amber-700">We couldn&apos;t confirm the credentials email was delivered — check with them.</p>
                </>
              )}
            </div>
          )}
          {error && (
            <p className="mb-5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3">{error}</p>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700">
                Professional type
                <select className={`${fieldClass} mt-2`} value={professionalKind} onChange={(e) => setProfessionalKind(e.target.value as "individual" | "firm")}>
                  <option value="individual">Individual professional</option>
                  <option value="firm">Firm / company</option>
                </select>
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Country
                {org && org.countries.length === 0 ? (
                  <p className="mt-2 text-sm font-medium text-slate-500">Your organisation has no countries assigned yet — contact a platform administrator.</p>
                ) : (
                  <select className={`${fieldClass} mt-2`} value={country} onChange={(e) => { setCountry(e.target.value); setDistrict(""); }} required disabled={!org}>
                    <option value="" disabled>{org ? "Select a country" : "Loading…"}</option>
                    {org?.countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
              </label>
              {regionsForCountry(country) && (
                <label className="block text-sm font-bold text-slate-700">
                  District
                  <DistrictSelect country={country} value={district} onChange={setDistrict} className="mt-2" />
                </label>
              )}
            </div>
            <PrimaryButton type="submit" disabled={isSubmitting || !org || org.countries.length === 0} className="w-full">
              {isSubmitting ? "Creating…" : "Create professional"}
            </PrimaryButton>
          </form>
        </Card>
      </RequirePermission>
    </PageFrame>
  );
}
