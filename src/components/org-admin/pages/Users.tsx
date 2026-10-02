"use client";

import { useEffect, useState } from "react";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { hasOrgPermission } from "@/lib/orgPermissions";
import { AdminApi, type AdminUser, type UserStatus } from "@/lib/admin/api";
import { useToast } from "@/lib/toast-context";
import { AdminTable, Card, DestructiveButton, EmptyState, PageFrame, RequirePermission, SecondaryButton, StatusPill, fieldClass, formatDate } from "@/components/admin/ui";

type Tab = "seller_manager" | "customer";
const TABS: { key: Tab; label: string }[] = [
  { key: "seller_manager", label: "Sellers" },
  { key: "customer", label: "Customers" },
];

// Sellers and Customers in your organisation's countries — Professionals and Staff have their
// own dedicated pages already, so they're deliberately not repeated here. Scoping happens
// server-side (listUsersByAdmin): sellers via their properties' country, customers via their
// own stored (best-effort, signup-time detected) country — see access-service's adminUsers.ts.
export function OrgUsersListPage() {
  const { token, account, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const canView = (account?.roles.includes("organization_admin") ?? false) && hasOrgPermission(account?.permissions, "manage_users");

  const [tab, setTab] = useState<Tab>("seller_manager");
  const [state, setState] = useState<{ tab: Tab; users?: AdminUser[]; error?: string } | null>(null);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!isAuthReady || !token || !canView) return;
    let cancelled = false;
    AdminApi.listUsers(token, { role: tab, limit: 200 }).then((result) => {
      if (cancelled) return;
      setState(result.ok ? { tab, users: result.data.users } : { tab, error: result.error });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, tab, reloadCount]);

  const users = state?.tab === tab ? state.users : undefined;
  const error = state?.tab === tab ? state.error : undefined;
  const q = search.trim().toLowerCase();
  const rows = (users ?? []).filter((u) => !q || `${u.name} ${u.email} ${u.country ?? ""}`.toLowerCase().includes(q));

  async function toggleStatus(user: AdminUser) {
    if (!token) return;
    const nextStatus: UserStatus = user.status === "active" ? "suspended" : "active";
    setBusyId(user.id);
    const result = await AdminApi.updateUser(token, user.id, { status: nextStatus });
    setBusyId(null);
    if (result.ok) {
      setState((prev) => (prev ? { ...prev, users: prev.users?.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)) } : prev));
      showToast(nextStatus === "active" ? "Account restored." : "Account suspended.");
    } else showToast(result.error, "error");
  }

  async function confirmDelete() {
    if (!token || !deleteTarget) return;
    const result = await AdminApi.deleteUser(token, deleteTarget.id);
    setDeleteTarget(null);
    if (result.ok) {
      showToast("Account deleted.");
      setReloadCount((n) => n + 1);
    } else showToast(result.error, "error");
  }

  return (
    <PageFrame title="Users">
      <RequirePermission granted={canView}>
        <div role="tablist" aria-label="Account type" className="mb-5 flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <Card className="mb-5">
          <label className="text-sm font-bold text-slate-700">
            Search
            <input className={`${fieldClass} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, or country" />
          </label>
        </Card>

        {error ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">{error}</Card>
        ) : !users ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading accounts…</p>
        ) : rows.length ? (
          <AdminTable headers={["Account", "Country", "Status", "Joined", "Actions"]}>
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
          <EmptyState title="No accounts found" description="Try a different search, or check back once activity picks up in your countries." />
        )}
      </RequirePermission>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        destructive
        title="Delete this account?"
        description={deleteTarget ? `This permanently removes ${deleteTarget.name}'s account. This can't be undone.` : ""}
        confirmLabel="Delete permanently"
      />
    </PageFrame>
  );
}
