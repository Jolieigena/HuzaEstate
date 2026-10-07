"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { AdminApi, type AdminSubscription, type AdminUser, type AdminUserList, type UserAccountType, type UserStatus } from "@/lib/admin/api";
import { fetchProfessionalsDirectory, type RealProfessionalProfile } from "@/lib/professional/api";
import { ORG_PERMISSIONS, type OrgPermission } from "@/lib/orgPermissions";
import { regionsForCountry } from "@/lib/regions";
import { useToast } from "@/lib/toast-context";
import { Card, DestructiveButton, DistrictChecklist, EmptyState, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, StatusPill, fieldClass, formatDate, formatDateTime } from "../ui";
import Select from "@/components/shared/Select";

const ALL_PERMISSIONS = new Set(ORG_PERMISSIONS.map((p) => p.value));

/** The same six-checkbox permissions checklist the org-admin portal's own Staff page uses to
 *  edit its staff — ported here so the platform admin has the same "overseer" capability over
 *  any organisation's accounts, not just view access. All checked means full access (an empty
 *  array server-side) — see access-service's updateUserByAdmin, which already allows a platform
 *  admin to edit any organization_admin's permissions; this was the only missing piece. */
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

const TYPE_LABELS: Record<UserAccountType, string> = { administrator: "Administrator", professional: "Professional", supplier: "Furniture Supplier", organization_admin: "Organisation Admin", seller_manager: "Seller / Owner", customer: "Customer" };
const TYPE_TABS: { key: "all" | UserAccountType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "administrator", label: "Administrators" },
  { key: "professional", label: "Professionals" },
  { key: "supplier", label: "Furniture Suppliers" },
  { key: "organization_admin", label: "Organisation Admins" },
  { key: "seller_manager", label: "Sellers" },
  { key: "customer", label: "Customers" },
];
const ROLE_KEYS = new Set(TYPE_TABS.map((t) => t.key));
const PAGE_SIZE = 20;

type ListState = { key: string; data?: AdminUserList; error?: string };

// Used only on the Professionals tab, to show the same Type/Specialisation/Profile-status
// columns the old standalone /admin/professionals page used to — folded in here instead of a
// separate page, since every professional already shows up in this list too (same account, two
// places to look was the whole problem). Keyed off the public directory (only ever has
// *completed* profiles — an incomplete one just shows "—"/"Not completed", same as before).
function useProfessionalProfiles(active: boolean): Record<string, RealProfessionalProfile> {
  const [profiles, setProfiles] = useState<Record<string, RealProfessionalProfile>>({});
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    fetchProfessionalsDirectory().then((directory) => {
      if (!cancelled) setProfiles(Object.fromEntries(directory.map((p) => [p.accountId, p])));
    });
    return () => {
      cancelled = true;
    };
  }, [active]);
  return profiles;
}

export function UsersListPage() {
  const { token, isAuthReady } = useAuth();
  const searchParams = useSearchParams();
  const canView = useIsAdministrator();
  const canManage = useIsAdministrator();
  const initialRole = searchParams.get("role");
  const [type, setType] = useState<"all" | UserAccountType>(initialRole && ROLE_KEYS.has(initialRole as UserAccountType) ? (initialRole as UserAccountType) : "all");
  const [status, setStatus] = useState<"all" | UserStatus>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [state, setState] = useState<ListState | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  // Scopes the whole list to one organisation's staff — set only via a deep link from the
  // Organisations page ("View staff"); there's no UI to set this directly, so it never changes
  // after mount.
  const [organizationId] = useState(searchParams.get("organizationId") ?? undefined);
  const professionalProfiles = useProfessionalProfiles(type === "professional");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const requestKey = `${type}|${status}|${search}|${page}|${organizationId}|${reloadCount}`;
  useEffect(() => {
    if (!isAuthReady || !token || !canView) return;
    let cancelled = false;
    AdminApi.listUsers(token, { role: type, status, search, page, limit: PAGE_SIZE, organizationId }).then((result) => {
      if (cancelled) return;
      setState(result.ok ? { key: requestKey, data: result.data } : { key: requestKey, error: result.error });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, type, status, search, page, organizationId, requestKey]);

  const loading = !state || state.key !== requestKey;
  const data = state?.data;
  const counts = data?.counts;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <PageFrame
      title="Users"
      action={
        canManage ? (
          <Link href="/admin/users/create" className="min-h-11 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
            + Create user
          </Link>
        ) : undefined
      }
    >
      <RequirePermission granted={canView}>
        {organizationId && (
          <p className="mb-4 text-sm font-semibold text-slate-500">
            Showing staff for one organisation. <Link href="/admin/users" className="font-bold text-[#219b31] underline">Clear</Link>
          </p>
        )}
        <div role="tablist" aria-label="Account type" className="mb-5 flex flex-wrap gap-2">
          {TYPE_TABS.map((tab) => {
            const active = type === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setType(tab.key);
                  setPage(1);
                }}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
              >
                {tab.label}
                <span className={`ml-2 text-xs ${active ? "text-white/70" : "text-slate-400"}`}>{counts ? counts[tab.key] : "–"}</span>
              </button>
            );
          })}
        </div>

        <Card className="mb-5">
          <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr]">
            <label className="text-sm font-bold text-slate-700">
              Search
              <input className={`${fieldClass} mt-1`} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Name, email or account ID" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Status
              <Select
                className={`${fieldClass} mt-1`}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as typeof status);
                  setPage(1);
                }}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </Select>
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
        ) : loading && !data ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading accounts…</p>
        ) : data && data.users.length ? (
          <>
            <p className="mb-3 text-xs font-semibold text-slate-400">
              {data.total} {data.total === 1 ? "account" : "accounts"}
              {loading ? " · updating…" : ""}
            </p>
            <div className="grid gap-3">
              {data.users.map((user) => {
                const profile = type === "professional" ? professionalProfiles[user.id] : undefined;
                return (
                  <Link key={user.id} href={`/admin/users/${user.id}`}>
                    <Card className="p-4 transition-shadow hover:shadow-md">
                      <div className="grid gap-2 sm:grid-cols-[1.6fr_1fr_1fr_auto] sm:items-center">
                        <div>
                          <p className="font-black text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                        {type === "professional" ? (
                          <p className="text-sm font-semibold text-slate-600">
                            {profile ? (profile.kind === "firm" ? "Firm" : "Individual") : "—"}
                            {profile?.specialisation && <span className="block text-xs font-medium text-slate-400">{profile.specialisation}</span>}
                          </p>
                        ) : (
                          <p className="text-sm font-semibold text-slate-600">
                            {TYPE_LABELS[user.accountType]}
                            {/* Plain text, not a link — this whole row is already a link to the
                                detail page, which has a real, correctly-nested link to the org. */}
                            {user.organizationName && <span className="block text-xs font-medium text-slate-400">{user.organizationName}</span>}
                          </p>
                        )}
                        {type === "professional" ? (
                          <p className="text-xs font-semibold text-slate-500">{user.profileCompleted ? "Public profile live" : "Profile not completed"}</p>
                        ) : (
                          <p className="text-xs text-slate-500">Joined {formatDate(user.createdAt)}</p>
                        )}
                        <StatusPill status={user.status} />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <SecondaryButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </SecondaryButton>
                <span className="text-sm font-semibold text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <SecondaryButton disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </SecondaryButton>
              </div>
            )}
          </>
        ) : (
          <EmptyState title="No users found" description="Try a different search or filter." />
        )}
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

type DetailState = { id: string; user?: AdminUser; error?: string };

export function UserDetailPage({ userId }: { userId: string }) {
  const router = useRouter();
  const { account, token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const canView = useIsAdministrator();
  const canManage = useIsAdministrator();
  const canSuspend = useIsAdministrator();

  const [detail, setDetail] = useState<DetailState | null>(null);
  const [subscription, setSubscription] = useState<{ id: string; sub: AdminSubscription | null } | null>(null);
  const [form, setForm] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [permissionsForm, setPermissionsForm] = useState<{ id: string; selected: Set<OrgPermission> } | null>(null);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [scopeForm, setScopeForm] = useState<{ id: string; selected: string[] } | null>(null);
  const [savingScope, setSavingScope] = useState(false);
  const [orgCountries, setOrgCountries] = useState<{ id: string; countries: string[] } | null>(null);

  useEffect(() => {
    if (!isAuthReady || !token || !canView) return;
    let cancelled = false;
    AdminApi.getUser(token, userId).then((result) => {
      if (cancelled) return;
      setDetail(result.ok ? { id: userId, user: result.data } : { id: userId, error: result.error });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, userId]);

  const user = detail?.id === userId ? detail.user : undefined;
  const isSeller = user?.roles.includes("seller_manager") ?? false;
  const isOrgAdminAccount = user?.roles.includes("organization_admin") ?? false;

  // Needed for the Scope card below — the district picker cascades off this org's own
  // countries, not every country on the platform.
  useEffect(() => {
    if (!token || !isOrgAdminAccount || !user?.organizationId) return;
    let cancelled = false;
    AdminApi.getOrganization(token, user.organizationId).then((result) => {
      if (!cancelled && result.ok) setOrgCountries({ id: user.id, countries: result.data.countries });
    });
    return () => {
      cancelled = true;
    };
  }, [token, isOrgAdminAccount, user?.organizationId, user?.id]);

  useEffect(() => {
    if (!token || !isSeller) return;
    let cancelled = false;
    AdminApi.listSubscriptions(token, { accountId: userId }).then((result) => {
      if (!cancelled) setSubscription({ id: userId, sub: result.ok ? result.data.subscriptions[0] ?? null : null });
    });
    return () => {
      cancelled = true;
    };
  }, [token, isSeller, userId]);

  const applyUser = useCallback((next: AdminUser) => setDetail({ id: userId, user: next }), [userId]);

  if (!canView) {
    return (
      <PageFrame title="Users">
        <RequirePermission granted={false}>{null}</RequirePermission>
      </PageFrame>
    );
  }

  if (!user) {
    if (!detail || detail.id !== userId) {
      return (
        <PageFrame title="Loading…">
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading account…</p>
        </PageFrame>
      );
    }
    return (
      <PageFrame title="User not found">
        <EmptyState title="User not found" description={detail.error ?? "The account may have been removed, or the link is incorrect."} action={<Link href="/admin/users" className="text-sm font-bold text-[#219b31]">Back to Users</Link>} />
      </PageFrame>
    );
  }

  const isSelf = account?.id === user.id;
  const formValues = form?.id === user.id ? form : { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email };
  const dirty = formValues.firstName !== user.firstName || formValues.lastName !== user.lastName || formValues.email !== user.email;
  const nextStatus: UserStatus = user.status === "active" ? "suspended" : "active";
  const isOrgAdmin = user.roles.includes("organization_admin");
  // Empty/absent permissions means full access — same backward-compatible rule the backend and
  // the org-admin portal's own Staff page both use (lib/orgPermissions.ts's hasOrgPermission).
  const originalPermissions = new Set<OrgPermission>(user.permissions?.length ? (user.permissions as OrgPermission[]) : Array.from(ALL_PERMISSIONS));
  const permissionsSelected = permissionsForm?.id === user.id ? permissionsForm.selected : originalPermissions;
  const permissionsDirty = permissionsSelected.size !== originalPermissions.size || [...permissionsSelected].some((p) => !originalPermissions.has(p));
  // Empty/absent scopeDistricts means this admin's scope is their org's whole country list —
  // same backward-compatible convention as permissions above, see model.ts's scopeDistricts
  // comment on the backend.
  const originalScope = user.scopeDistricts ?? [];
  const scopeSelected = scopeForm?.id === user.id ? scopeForm.selected : originalScope;
  const scopeDirty = scopeSelected.length !== originalScope.length || scopeSelected.some((d) => !originalScope.includes(d));
  const orgCountriesForScope = orgCountries?.id === user.id ? orgCountries.countries : [];

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !user) return;
    setSaving(true);
    const result = await AdminApi.updateUser(token, user.id, { firstName: formValues.firstName, lastName: formValues.lastName, email: formValues.email });
    setSaving(false);
    if (result.ok) {
      applyUser(result.data);
      setForm(null);
      showToast("Account updated.");
    } else showToast(result.error, "error");
  }

  async function savePermissions() {
    if (!token || !user) return;
    const permissions = permissionsSelected.size === ALL_PERMISSIONS.size ? [] : Array.from(permissionsSelected);
    setSavingPermissions(true);
    const result = await AdminApi.updateUser(token, user.id, { permissions });
    setSavingPermissions(false);
    if (result.ok) {
      applyUser(result.data);
      setPermissionsForm(null);
      showToast("Permissions updated.");
    } else showToast(result.error, "error");
  }

  async function saveScope() {
    if (!token || !user) return;
    setSavingScope(true);
    const result = await AdminApi.updateUser(token, user.id, { scopeDistricts: scopeSelected });
    setSavingScope(false);
    if (result.ok) {
      applyUser(result.data);
      setScopeForm(null);
      showToast("Scope updated.");
    } else showToast(result.error, "error");
  }

  async function toggleStatus() {
    if (!token || !user) return;
    const result = await AdminApi.updateUser(token, user.id, { status: nextStatus });
    setStatusOpen(false);
    if (result.ok) {
      applyUser(result.data);
      showToast(nextStatus === "suspended" ? "Account suspended." : "Account restored.");
    } else showToast(result.error, "error");
  }

  async function remove() {
    if (!token || !user) return;
    const result = await AdminApi.deleteUser(token, user.id);
    setDeleteOpen(false);
    if (result.ok) {
      showToast("Account deleted.");
      router.push("/admin/users");
    } else showToast(result.error, "error");
  }

  const sub = subscription?.id === user.id ? subscription.sub : undefined;

  return (
    <PageFrame
      title={user.name}
      action={
        <Link href="/admin/users" className="text-sm font-bold text-slate-500 hover:text-[#219b31]">
          Back to Users
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-900">Account summary</h3>
              <StatusPill status={user.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label="Account ID" value={user.id} />
              <Field label="Account type" value={TYPE_LABELS[user.accountType]} />
              <Field label="Roles" value={user.roles.map((r) => TYPE_LABELS[r]).join(", ")} />
              <Field label="Joined" value={formatDateTime(user.createdAt)} />
              <Field label="Last updated" value={formatDateTime(user.updatedAt)} />
              {user.roles.includes("professional") && <Field label="Public profile" value={user.profileCompleted ? <Link className="text-[#219b31] underline" href={`/professionals/${user.id}`}>View profile</Link> : "Not completed yet"} />}
              {user.organizationId && <Field label="Organisation" value={<Link className="text-[#219b31] underline" href={`/admin/organizations/${user.organizationId}`}>{user.organizationName ?? "View organisation"}</Link>} />}
              {user.mustChangePassword && <Field label="Password" value="Still on the emailed temporary password" />}
            </dl>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Edit details</h3>
            <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={saveProfile}>
              <label className="text-sm font-bold text-slate-700">
                First name
                <input className={`${fieldClass} mt-1`} value={formValues.firstName} disabled={!canManage} onChange={(e) => setForm({ ...formValues, firstName: e.target.value })} />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Last name
                <input className={`${fieldClass} mt-1`} value={formValues.lastName} disabled={!canManage} onChange={(e) => setForm({ ...formValues, lastName: e.target.value })} />
              </label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                Email
                <input type="email" className={`${fieldClass} mt-1`} value={formValues.email} disabled={!canManage} onChange={(e) => setForm({ ...formValues, email: e.target.value })} />
              </label>
              {canManage && (
                <div className="sm:col-span-2 flex gap-2">
                  <PrimaryButton type="submit" disabled={!dirty || saving}>
                    {saving ? "Saving…" : "Save changes"}
                  </PrimaryButton>
                  {dirty && (
                    <SecondaryButton type="button" onClick={() => setForm(null)}>
                      Reset
                    </SecondaryButton>
                  )}
                </div>
              )}
            </form>
          </Card>

          {isOrgAdmin && (
            <Card>
              <h3 className="text-lg font-black text-slate-900">Permissions</h3>
              <p className="mt-1 text-sm text-slate-500">Which sections of the org-admin portal this account can access. Leave everything checked for full access.</p>
              <div className="mt-4">
                <PermissionsChecklist
                  selected={permissionsSelected}
                  onChange={(next) => setPermissionsForm({ id: user.id, selected: next })}
                />
              </div>
              {permissionsSelected.size === 0 && (
                <p className="mt-2 text-xs font-semibold text-amber-600">Check at least one section — to remove someone entirely, suspend or delete their account instead.</p>
              )}
              {canManage && (
                <div className="mt-4 flex gap-2">
                  <PrimaryButton type="button" disabled={!permissionsDirty || permissionsSelected.size === 0 || savingPermissions} onClick={savePermissions}>
                    {savingPermissions ? "Saving…" : "Save permissions"}
                  </PrimaryButton>
                  {permissionsDirty && (
                    <SecondaryButton type="button" onClick={() => setPermissionsForm(null)}>
                      Reset
                    </SecondaryButton>
                  )}
                </div>
              )}
            </Card>
          )}

          {isOrgAdmin && (
            <Card>
              <h3 className="text-lg font-black text-slate-900">Scope</h3>
              <p className="mt-1 text-sm text-slate-500">
                Which districts within this organisation&apos;s countries this account can see and manage. Leave everything unselected for the organisation&apos;s full country-wide scope.
              </p>
              <div className="mt-4">
                <DistrictChecklist
                  countries={orgCountriesForScope}
                  selected={scopeSelected}
                  onToggle={(district) => {
                    const next = scopeSelected.includes(district) ? scopeSelected.filter((d) => d !== district) : [...scopeSelected, district];
                    setScopeForm({ id: user.id, selected: next });
                  }}
                />
              </div>
              {orgCountriesForScope.length > 0 && !orgCountriesForScope.some((c) => regionsForCountry(c)) && (
                <p className="mt-2 text-xs text-slate-400">None of this organisation&apos;s countries have district-level data yet (only Rwanda does, for now) — this account keeps the full country scope.</p>
              )}
              {canManage && (
                <div className="mt-4 flex gap-2">
                  <PrimaryButton type="button" disabled={!scopeDirty || savingScope} onClick={saveScope}>
                    {savingScope ? "Saving…" : "Save scope"}
                  </PrimaryButton>
                  {scopeDirty && (
                    <SecondaryButton type="button" onClick={() => setScopeForm(null)}>
                      Reset
                    </SecondaryButton>
                  )}
                </div>
              )}
            </Card>
          )}

          {isSeller && (
            <Card>
              <h3 className="text-lg font-black text-slate-900">Posting plan &amp; payments</h3>
              {sub === undefined ? (
                <p className="mt-3 text-sm text-slate-400">Loading plan…</p>
              ) : sub === null ? (
                <p className="mt-3 text-sm text-slate-500">No plan record yet — this seller is on the free plan by default.</p>
              ) : (
                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                  <Field label="Plan" value={`${sub.label}${sub.priceCents ? ` · $${(sub.priceCents / 100).toFixed(0)}/mo` : ""}`} />
                  <Field label="Status" value={<StatusPill status={sub.status} />} />
                  <Field label="Renews" value={sub.renewsOn ? formatDate(sub.renewsOn) : "—"} />
                  <Field label="Posts this month" value={`${sub.postsUsed} / ${sub.postsLimit ?? "unlimited"}${sub.extraCredits ? ` (+${sub.extraCredits} paid)` : ""}`} />
                  <Field label="Stripe customer" value={sub.stripeCustomerId ?? "—"} />
                  <Field label="Stripe subscription" value={sub.stripeSubscriptionId ?? "—"} />
                </dl>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {(canSuspend || canManage) && (
            <Card>
              <h3 className="text-lg font-black text-slate-900">Actions</h3>
              <div className="mt-4 flex flex-col gap-2">
                {canSuspend && (
                  <SecondaryButton disabled={isSelf} onClick={() => setStatusOpen(true)}>
                    {user.status === "active" ? "Suspend account" : "Restore account"}
                  </SecondaryButton>
                )}
                {canManage && (
                  <DestructiveButton disabled={isSelf} onClick={() => setDeleteOpen(true)}>
                    Delete account
                  </DestructiveButton>
                )}
                {isSelf && <p className="text-xs text-slate-500">You can&apos;t suspend or delete your own account.</p>}
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmModal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        onConfirm={toggleStatus}
        destructive={nextStatus === "suspended"}
        title={nextStatus === "suspended" ? "Suspend this account?" : "Restore this account?"}
        description={nextStatus === "suspended" ? "They are signed out on their next request and can't sign in until restored. Their data is kept." : "The account regains normal access."}
        confirmLabel={nextStatus === "suspended" ? "Suspend account" : "Restore account"}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={remove}
        destructive
        title="Delete this account?"
        description={`This permanently removes ${user.name}'s account${user.roles.includes("professional") ? ", professional profile" : ""}${isSeller ? ", all of their listings and their plan record" : ""}. It cannot be undone.`}
        confirmLabel="Delete permanently"
      />
    </PageFrame>
  );
}
