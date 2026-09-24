"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { AdminApi, type AdminUser } from "@/lib/admin/api";
import { fetchProfessionalsDirectory, type RealProfessionalProfile } from "@/lib/professional/api";
import { AdminTable, Card, EmptyState, PageFrame, RequirePermission, StatusPill, fieldClass, formatDate } from "../ui";

type Filter = "all" | "completed" | "incomplete";

export function ProfessionalsListPage() {
  const { token, isAuthReady } = useAuth();
  const canView = useIsAdministrator();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, RealProfessionalProfile>>({});
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!isAuthReady || !token || !canView) return;
    let cancelled = false;
    Promise.all([AdminApi.listUsers(token, { role: "professional", limit: 200 }), fetchProfessionalsDirectory()]).then(([list, directory]) => {
      if (cancelled) return;
      if (list.ok) setUsers(list.data.users);
      else setError(list.error);
      setProfiles(Object.fromEntries(directory.map((p) => [p.accountId, p])));
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView]);

  const q = search.trim().toLowerCase();
  const rows = (users ?? []).filter((user) => {
    const matchesSearch = !q || `${user.name} ${user.email}`.toLowerCase().includes(q);
    return matchesSearch && (filter === "all" || (filter === "completed") === user.profileCompleted);
  });

  return (
    <PageFrame
      title="Professionals"
      description="Professional accounts and whether their public profile is complete. Professionals are created by administrators."
      action={
        <Link href="/admin/users/create" className="min-h-11 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
          + Create professional
        </Link>
      }
    >
      <RequirePermission granted={canView}>
        <Card className="mb-5">
          <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr]">
            <label className="text-sm font-bold text-slate-700">
              Search
              <input className={`${fieldClass} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or email" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Profile
              <select className={`${fieldClass} mt-1`} value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
                <option value="all">All</option>
                <option value="completed">Complete (public)</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </label>
          </div>
        </Card>

        {error ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">{error}</Card>
        ) : !users ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading professionals…</p>
        ) : rows.length ? (
          <AdminTable headers={["Professional", "Type", "Specialisation", "Profile", "Account", "Joined"]}>
            {rows.map((user) => {
              const profile = profiles[user.id];
              return (
                <tr key={user.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <Link href={`/admin/users/${user.id}`} className="font-bold text-slate-900 hover:text-[#219b31]">
                      {user.name}
                    </Link>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{profile ? (profile.kind === "firm" ? "Firm" : "Individual") : "—"}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{profile?.specialisation ?? "—"}</td>
                  <td className="px-6 py-4 text-sm">
                    {user.profileCompleted ? (
                      <Link href={`/professionals/${user.id}`} className="font-bold text-[#219b31] hover:underline">
                        View public profile
                      </Link>
                    ) : (
                      <span className="text-slate-400">Not completed</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={user.status} />
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{formatDate(user.createdAt)}</td>
                </tr>
              );
            })}
          </AdminTable>
        ) : (
          <EmptyState title="No professionals found" description="Try a different search or filter, or create a professional account." />
        )}
      </RequirePermission>
    </PageFrame>
  );
}
