"use client";

import { allowedDistricts } from "@/lib/admin/propertyCategories";
import { useEffect, useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/shared/ConfirmModal";
import Dialog from "@/components/Dialog";
import { useAuth } from "@/lib/auth-context";
import { ORG_PERMISSIONS, hasOrgPermission, type OrgPermission } from "@/lib/orgPermissions";
import { regionsForCountry } from "@/lib/regions";
import { AdminApi, type AdminOrganization, type AdminUser, type UserStatus } from "@/lib/admin/api";
import { useToast } from "@/lib/toast-context";
import { AdminTable, Card, DestructiveButton, DistrictChecklist, EmptyState, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, StatusPill, fieldClass, formatDate } from "@/components/admin/ui";

function scopeLabel(countries: string[] | undefined, scopeDistricts: string[] | undefined): string {
  if (!scopeDistricts?.length) return countries?.length ? `All of ${countries.join(", ")}` : "Full organisation scope";
  return scopeDistricts.join(", ");
}

function permissionsLabel(permissions: string[] | undefined): string {
  if (!permissions?.length) return "Full access";
  return ORG_PERMISSIONS.filter((p) => permissions.includes(p.value)).map((p) => p.label).join(", ");
}

/** The six-checkbox permissions checklist shared by the create-staff form and the
 *  edit-permissions modal below — all checked means full access (an empty array). */
function PermissionsChecklist({ selected, onChange }: { selected: Set<OrgPermission>; onChange: (next: Set<OrgPermission>) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ORG_PERMISSIONS.map((p) => (
        <label key={p.value} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={selected.has(p.value)}
            onChange={(e) => {
              const next = new Set(selected);
              if (e.target.checked) next.add(p.value);
              else next.delete(p.value);
              onChange(next);
            }}
          />
          {p.label}
        </label>
      ))}
    </div>
  );
}

const ALL_PERMISSIONS = new Set(ORG_PERMISSIONS.map((p) => p.value));

export function OrgStaffListPage() {
  const { token, account, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const canView = account?.roles.includes("organization_admin") ?? false;
  const canManageStaff = hasOrgPermission(account?.permissions, "manage_staff");

  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [org, setOrg] = useState<AdminOrganization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [permissionsTarget, setPermissionsTarget] = useState<AdminUser | null>(null);
  const [permissionsSelected, setPermissionsSelected] = useState<Set<OrgPermission>>(ALL_PERMISSIONS);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [scopeTarget, setScopeTarget] = useState<AdminUser | null>(null);
  const [scopeSelected, setScopeSelected] = useState<string[]>([]);
  const [savingScope, setSavingScope] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!isAuthReady || !token || !canView) return;
    let cancelled = false;
    AdminApi.listUsers(token, { role: "organization_admin", limit: 200 }).then((result) => {
      if (cancelled) return;
      if (result.ok) setUsers(result.data.users);
      else setError(result.error);
    });
    if (account?.organizationId) {
      AdminApi.getOrganization(token, account.organizationId).then((result) => {
        if (!cancelled && result.ok) setOrg(result.data);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, account?.organizationId, reloadCount]);

  const q = search.trim().toLowerCase();
  const rows = (users ?? []).filter((u) => !q || `${u.name} ${u.email} ${u.title ?? ""}`.toLowerCase().includes(q));

  async function toggleStatus(user: AdminUser) {
    if (!token) return;
    const nextStatus: UserStatus = user.status === "active" ? "suspended" : "active";
    setBusyId(user.id);
    const result = await AdminApi.updateUser(token, user.id, { status: nextStatus });
    setBusyId(null);
    if (result.ok) {
      setUsers((prev) => prev?.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)) ?? null);
      showToast(nextStatus === "active" ? "Staff account restored." : "Staff account suspended.");
    } else showToast(result.error, "error");
  }

  async function confirmDelete() {
    if (!token || !deleteTarget) return;
    const result = await AdminApi.deleteUser(token, deleteTarget.id);
    setDeleteTarget(null);
    if (result.ok) {
      showToast("Staff account deleted.");
      setReloadCount((n) => n + 1);
    } else showToast(result.error, "error");
  }

  function openPermissions(user: AdminUser) {
    setPermissionsTarget(user);
    setPermissionsSelected(user.permissions?.length ? new Set(user.permissions as OrgPermission[]) : new Set(ALL_PERMISSIONS));
  }

  async function savePermissions() {
    if (!token || !permissionsTarget) return;
    const permissions = permissionsSelected.size === ALL_PERMISSIONS.size ? [] : Array.from(permissionsSelected);
    setSavingPermissions(true);
    const result = await AdminApi.updateUser(token, permissionsTarget.id, { permissions });
    setSavingPermissions(false);
    if (result.ok) {
      setUsers((prev) => prev?.map((u) => (u.id === permissionsTarget.id ? { ...u, permissions } : u)) ?? null);
      showToast("Permissions updated.");
      setPermissionsTarget(null);
    } else showToast(result.error, "error");
  }

  function openScope(user: AdminUser) {
    setScopeTarget(user);
    setScopeSelected(user.scopeDistricts ?? []);
  }

  async function saveScope() {
    if (!token || !scopeTarget) return;
    setSavingScope(true);
    const result = await AdminApi.updateUser(token, scopeTarget.id, { scopeDistricts: scopeSelected });
    setSavingScope(false);
    if (result.ok) {
      setUsers((prev) => prev?.map((u) => (u.id === scopeTarget.id ? { ...u, scopeDistricts: scopeSelected } : u)) ?? null);
      showToast("Scope updated.");
      setScopeTarget(null);
    } else showToast(result.error, "error");
  }

  return (
    <PageFrame
      title="Staff"
      action={
        canView ? (
          <Link href="/org-admin/staff/create" className="min-h-11 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
            + Add staff member
          </Link>
        ) : undefined
      }
    >
      <RequirePermission granted={canView}>
        <Card className="mb-5">
          <label className="text-sm font-bold text-slate-700">
            Search
            <input className={`${fieldClass} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, or title" />
          </label>
        </Card>

        {error ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">{error}</Card>
        ) : !users ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading staff…</p>
        ) : rows.length ? (
          <AdminTable headers={["Staff member", "Title", "Permissions", "Scope", "Status", "Joined", "Actions"]}>
            {rows.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{user.title ?? "—"}</td>
                <td className="px-6 py-4 max-w-60 text-xs text-slate-500">{permissionsLabel(user.permissions)}</td>
                <td className="px-6 py-4 max-w-60 text-xs text-slate-500">{scopeLabel(org?.countries, user.scopeDistricts)}</td>
                <td className="px-6 py-4"><StatusPill status={user.status} /></td>
                <td className="px-6 py-4 text-xs text-slate-500">{formatDate(user.createdAt)}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {canManageStaff && (
                      <SecondaryButton className="min-h-9 px-3 py-1.5 text-xs" onClick={() => openPermissions(user)}>
                        Edit permissions
                      </SecondaryButton>
                    )}
                    {canManageStaff && org && org.countries.some((c) => regionsForCountry(c)) && (
                      <SecondaryButton className="min-h-9 px-3 py-1.5 text-xs" onClick={() => openScope(user)}>
                        Edit scope
                      </SecondaryButton>
                    )}
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
          <EmptyState title="No staff yet" description="Add another staff account to your organisation." action={<Link href="/org-admin/staff/create" className="text-sm font-bold text-[#219b31] underline">Add staff member</Link>} />
        )}
      </RequirePermission>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        destructive
        title="Delete this staff account?"
        description={deleteTarget ? `This permanently removes ${deleteTarget.name}'s account. This can't be undone.` : ""}
        confirmLabel="Delete permanently"
      />

      <Dialog open={!!permissionsTarget} onClose={() => setPermissionsTarget(null)} labelledBy="edit-permissions-title" panelClassName="max-w-lg p-6">
        {permissionsTarget && (
          <>
            <h2 id="edit-permissions-title" className="text-lg font-bold text-slate-900">
              Permissions — {permissionsTarget.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Uncheck a section to remove their access to it. Leave everything checked for full access.</p>
            <div className="mt-4">
              <PermissionsChecklist selected={permissionsSelected} onChange={setPermissionsSelected} />
            </div>
            {permissionsSelected.size === 0 && (
              <p className="mt-2 text-xs font-semibold text-amber-600">Check at least one section — to remove someone entirely, suspend or delete their account instead.</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <SecondaryButton className="min-h-10 px-4 py-2 text-sm" onClick={() => setPermissionsTarget(null)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton className="min-h-10 px-4 py-2 text-sm" disabled={savingPermissions || permissionsSelected.size === 0} onClick={savePermissions}>
                {savingPermissions ? "Saving…" : "Save permissions"}
              </PrimaryButton>
            </div>
          </>
        )}
      </Dialog>

      <Dialog open={!!scopeTarget} onClose={() => setScopeTarget(null)} labelledBy="edit-scope-title" panelClassName="max-w-lg p-6">
        {scopeTarget && (
          <>
            <h2 id="edit-scope-title" className="text-lg font-bold text-slate-900">
              Scope — {scopeTarget.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Narrow this account to specific districts. Leave everything unselected for your organisation&apos;s full country-wide scope.</p>
            <div className="mt-4">
              <DistrictChecklist
                countries={org?.countries ?? []}
                allowed={allowedDistricts(org?.regionScopes)}
                selected={scopeSelected}
                onToggle={(district) => setScopeSelected((prev) => (prev.includes(district) ? prev.filter((d) => d !== district) : [...prev, district]))}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <SecondaryButton className="min-h-10 px-4 py-2 text-sm" onClick={() => setScopeTarget(null)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton className="min-h-10 px-4 py-2 text-sm" disabled={savingScope} onClick={saveScope}>
                {savingScope ? "Saving…" : "Save scope"}
              </PrimaryButton>
            </div>
          </>
        )}
      </Dialog>
    </PageFrame>
  );
}

export function OrgCreateStaffPage() {
  const { account, token, createUser } = useAuth();
  const canCreate = account?.roles.includes("organization_admin") ?? false;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [permissions, setPermissions] = useState<Set<OrgPermission>>(ALL_PERMISSIONS);
  const [scopeDistricts, setScopeDistricts] = useState<string[]>([]);
  const [org, setOrg] = useState<AdminOrganization | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ email: string; emailDelivered: boolean } | null>(null);

  useEffect(() => {
    if (!token || !account?.organizationId) return;
    let cancelled = false;
    AdminApi.getOrganization(token, account.organizationId).then((result) => {
      if (!cancelled && result.ok) setOrg(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [token, account?.organizationId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || permissions.size === 0) return;
    setError("");
    setIsSubmitting(true);
    const result = await createUser({
      firstName,
      lastName,
      email,
      roleType: "organization_admin",
      title: title || undefined,
      permissions: permissions.size === ALL_PERMISSIONS.size ? undefined : Array.from(permissions),
      scopeDistricts: scopeDistricts.length ? scopeDistricts : undefined,
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
    setTitle("");
    setPermissions(ALL_PERMISSIONS);
    setScopeDistricts([]);
  };

  return (
    <PageFrame
      title="Add staff member"
      action={
        <Link href="/org-admin/staff" className="text-sm font-bold text-slate-500 hover:text-[#219b31]">
          Back to Staff
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
            <label className="block text-sm font-bold text-slate-700">
              Title <span className="font-medium text-slate-400">(optional)</span>
              <input className={`${fieldClass} mt-2`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Account Manager" />
            </label>
            <div>
              <p className="text-sm font-bold text-slate-700">Permissions</p>
              <p className="mt-1 text-xs text-slate-500">Leave everything checked for full access, or narrow it to specific sections.</p>
              <div className="mt-2">
                <PermissionsChecklist selected={permissions} onChange={setPermissions} />
              </div>
              {permissions.size === 0 && <p className="mt-2 text-xs font-semibold text-amber-600">Check at least one section.</p>}
            </div>
            {org && org.countries.some((c) => regionsForCountry(c)) && (
              <div>
                <p className="text-sm font-bold text-slate-700">Scope</p>
                <p className="mt-1 text-xs text-slate-500">Leave unselected for your organisation&apos;s full country-wide scope, or narrow this account to specific districts.</p>
                <div className="mt-2">
                  <DistrictChecklist
                    countries={org.countries}
                    allowed={allowedDistricts(org.regionScopes)}
                    selected={scopeDistricts}
                    onToggle={(district) => setScopeDistricts((prev) => (prev.includes(district) ? prev.filter((d) => d !== district) : [...prev, district]))}
                  />
                </div>
              </div>
            )}
            <PrimaryButton type="submit" disabled={isSubmitting || permissions.size === 0} className="w-full">
              {isSubmitting ? "Creating…" : "Create account"}
            </PrimaryButton>
          </form>
        </Card>
      </RequirePermission>
    </PageFrame>
  );
}
