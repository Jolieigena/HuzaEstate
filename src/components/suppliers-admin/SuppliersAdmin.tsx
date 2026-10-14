"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ConfirmModal from "@/components/shared/ConfirmModal";
import Select from "@/components/shared/Select";
import { AdminTable, Card, DestructiveButton, EmptyState, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, StatusPill, fieldClass, formatDate } from "@/components/admin/ui";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { AdminApi, type AdminOrganization, type AdminUser, type UserStatus } from "@/lib/admin/api";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { FurnitureApi, ORDER_STATUS_LABELS, formatPrice, type Order, type OrderStatus, type OrdersTrackResult } from "@/lib/furniture/api";
import { hasOrgPermission } from "@/lib/orgPermissions";
import { useToast } from "@/lib/toast-context";

/** Furniture supplier management for the people who look after them: platform administrators (every supplier) and
 *  organisation admins with the suppliers permission (suppliers in their organisation's countries). */
export type SuppliersScope = "admin" | "org";

const BASE: Record<SuppliersScope, string> = { admin: "/admin/suppliers", org: "/org-admin/suppliers" };

function useCanManage(scope: SuppliersScope): boolean {
  const { account } = useAuth();
  const isAdministrator = useIsAdministrator();
  if (scope === "admin") return isAdministrator;
  return (account?.roles.includes("organization_admin") ?? false) && hasOrgPermission(account?.permissions, "manage_suppliers");
}

const buttonLink = "min-h-11 inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-bold transition-colors";

export function SuppliersListPage({ scope }: { scope: SuppliersScope }) {
  const { token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const canManage = useCanManage(scope);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!isAuthReady || !token || !canManage) return;
    let cancelled = false;
    AdminApi.listUsers(token, { role: "supplier", limit: 200 }).then((result) => {
      if (cancelled) return;
      if (result.ok) setUsers(result.data.users);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canManage, reload]);

  const q = search.trim().toLowerCase();
  const rows = (users ?? []).filter((u) => !q || `${u.name} ${u.email} ${u.country ?? ""}`.toLowerCase().includes(q));

  async function toggleStatus(user: AdminUser) {
    if (!token) return;
    const next: UserStatus = user.status === "active" ? "suspended" : "active";
    setBusyId(user.id);
    const result = await AdminApi.updateUser(token, user.id, { status: next });
    setBusyId(null);
    if (result.ok) {
      setUsers((prev) => prev?.map((u) => (u.id === user.id ? { ...u, status: next } : u)) ?? null);
      showToast(next === "active" ? "Supplier restored." : "Supplier suspended.");
    } else showToast(result.error, "error");
  }

  async function confirmDelete() {
    if (!token || !deleteTarget) return;
    const result = await AdminApi.deleteUser(token, deleteTarget.id);
    setDeleteTarget(null);
    if (result.ok) {
      showToast("Supplier account deleted.");
      setReload((n) => n + 1);
    } else showToast(result.error, "error");
  }

  return (
    <PageFrame
      title="Suppliers"
      action={
        canManage ? (
          <div className="flex flex-wrap gap-2">
            <Link href={`${BASE[scope]}/orders`} className={`${buttonLink} border border-slate-200 bg-white text-slate-700 hover:border-slate-300`}>
              Track orders
            </Link>
            <Link href={scope === "admin" ? "/admin/supplier-payouts" : "/org-admin/supplier-payouts"} className={`${buttonLink} border border-slate-200 bg-white text-slate-700 hover:border-slate-300`}>
              Payouts
            </Link>
            <Link href={`${BASE[scope]}/create`} className={`${buttonLink} bg-slate-900 text-white shadow-lg hover:bg-[#2ec440]`}>
              + Create supplier
            </Link>
          </div>
        ) : undefined
      }
    >
      <RequirePermission granted={canManage}>
        <Card className="mb-5">
          <label className="text-sm font-bold text-slate-700">
            Search
            <input className={`${fieldClass} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, or country" />
          </label>
        </Card>

        {error ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">{error}</Card>
        ) : !users ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading suppliers…</p>
        ) : rows.length ? (
          <AdminTable headers={["Supplier", "Country", "Status", "Joined", "Actions"]}>
            {rows.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{user.country ?? "—"}</td>
                <td className="px-6 py-4">
                  <StatusPill status={user.status} />
                  {!user.profileCompleted && <p className="mt-1 text-xs text-slate-400">Profile not completed</p>}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{formatDate(user.createdAt)}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`${BASE[scope]}/orders?supplier=${encodeURIComponent(user.id)}`} className="inline-flex min-h-9 items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-300">
                      Orders
                    </Link>
                    <SecondaryButton className="min-h-9 px-3 py-1.5 text-xs" disabled={busyId === user.id} onClick={() => toggleStatus(user)}>
                      {user.status === "active" ? "Suspend" : "Restore"}
                    </SecondaryButton>
                    {scope === "admin" && (
                      <DestructiveButton className="min-h-9 px-3 py-1.5 text-xs" onClick={() => setDeleteTarget(user)}>
                        Delete
                      </DestructiveButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>
        ) : (
          <EmptyState title="No suppliers yet" action={<Link href={`${BASE[scope]}/create`} className="text-sm font-bold text-[#219b31] underline">Create supplier</Link>} />
        )}
      </RequirePermission>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        destructive
        title="Delete this supplier account?"
        description={deleteTarget ? `This permanently removes ${deleteTarget.name}'s account, products and orders. This can't be undone.` : ""}
        confirmLabel="Delete permanently"
      />
    </PageFrame>
  );
}

export function CreateSupplierPage({ scope }: { scope: SuppliersScope }) {
  const { token, account, createUser } = useAuth();
  const canManage = useCanManage(scope);
  const [org, setOrg] = useState<AdminOrganization | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ email: string; emailDelivered: boolean } | null>(null);

  useEffect(() => {
    if (scope !== "org" || !token || !account?.organizationId) return;
    AdminApi.getOrganization(token, account.organizationId).then((result) => {
      if (result.ok) setOrg(result.data);
    });
  }, [scope, token, account?.organizationId]);

  const countries = scope === "org" ? (org?.countries ?? []) : COUNTRY_OPTIONS.map((c) => c.name);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    if (!country) {
      setError("Please choose a country.");
      return;
    }
    setSubmitting(true);
    const result = await createUser({ firstName, lastName, email, roleType: "supplier", country });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCreated({ email, emailDelivered: result.emailDelivered });
    setFirstName("");
    setLastName("");
    setEmail("");
  };

  return (
    <PageFrame
      title="Create supplier"
      action={
        <Link href={BASE[scope]} className="text-sm font-bold text-slate-500 hover:text-[#219b31]">
          Back to Suppliers
        </Link>
      }
    >
      <RequirePermission granted={canManage}>
        <Card className="max-w-xl">
          {created && (
            <div className={`mb-5 rounded-xl border p-4 text-sm ${created.emailDelivered ? "border-emerald-100 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
              <p className={`font-bold ${created.emailDelivered ? "text-emerald-800" : "text-amber-800"}`}>Account created for {created.email}</p>
              <p className={`mt-1 ${created.emailDelivered ? "text-emerald-700" : "text-amber-700"}`}>{created.emailDelivered ? "Sign-in instructions with a temporary password have been emailed to them." : "We couldn't confirm the credentials email was delivered. Check with them."}</p>
            </div>
          )}
          {error && <p className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
          <form className="space-y-5" onSubmit={submit}>
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
              Country
              {scope === "org" && org && org.countries.length === 0 ? (
                <p className="mt-2 text-sm font-medium text-slate-500">Your organisation has no countries assigned yet. Contact a platform administrator.</p>
              ) : (
                <Select className={`${fieldClass} mt-2`} value={country} onChange={(e) => setCountry(e.target.value)} required disabled={scope === "org" && !org}>
                  <option value="" disabled>
                    {scope === "org" && !org ? "Loading…" : "Select a country"}
                  </option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              )}
            </label>
            <PrimaryButton type="submit" disabled={submitting || (scope === "org" && (!org || org.countries.length === 0))} className="w-full">
              {submitting ? "Creating…" : "Create supplier"}
            </PrimaryButton>
          </form>
        </Card>
      </RequirePermission>
    </PageFrame>
  );
}

const PAYMENT_OPTIONS = [
  { value: "", label: "Any payment" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Not paid" },
  { value: "refunded", label: "Refunded" },
];
const PAGE_SIZE = 25;

export function SupplierOrdersTrackerPage({ scope }: { scope: SuppliersScope }) {
  const { token, isAuthReady } = useAuth();
  const canManage = useCanManage(scope);
  const initialSupplier = useSearchParams().get("supplier") ?? "";
  const [suppliers, setSuppliers] = useState<AdminUser[]>([]);
  const [supplierId, setSupplierId] = useState(initialSupplier);
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ key: string; data?: OrdersTrackResult; error?: string } | null>(null);

  useEffect(() => {
    if (!isAuthReady || !token || !canManage) return;
    let cancelled = false;
    AdminApi.listUsers(token, { role: "supplier", limit: 200 }).then((r) => {
      if (!cancelled && r.ok) setSuppliers(r.data.users);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canManage]);

  const key = `${supplierId}|${status}|${payment}|${page}`;
  useEffect(() => {
    if (!isAuthReady || !token || !canManage) return;
    let cancelled = false;
    FurnitureApi.trackOrders(token, { supplierId, status, paymentStatus: payment, page, limit: PAGE_SIZE }).then((r) => {
      if (!cancelled) setResult(r.ok ? { key, data: r.data } : { key, error: r.error });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canManage, key, supplierId, status, payment, page]);

  const loading = result?.key !== key;
  const data = result?.data;
  const lastPage = Math.max(Math.ceil((data?.total ?? 0) / PAGE_SIZE), 1);
  const reset = (apply: () => void) => {
    apply();
    setPage(1);
  };

  return (
    <PageFrame
      title="Supplier orders"
      action={
        <Link href={BASE[scope]} className="text-sm font-bold text-slate-500 hover:text-[#219b31]">
          Back to Suppliers
        </Link>
      }
    >
      <RequirePermission granted={canManage}>
        <Card className="mb-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-bold text-slate-700">
              Supplier
              <Select className={`${fieldClass} mt-1`} value={supplierId} onChange={(e) => reset(() => setSupplierId(e.target.value))}>
                <option value="">All suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              Order status
              <Select className={`${fieldClass} mt-1`} value={status} onChange={(e) => reset(() => setStatus(e.target.value))}>
                <option value="">Any status</option>
                {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              Payment
              <Select className={`${fieldClass} mt-1`} value={payment} onChange={(e) => reset(() => setPayment(e.target.value))}>
                {PAYMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        </Card>

        {data && data.summary.length > 0 && (
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="text-sm font-bold text-slate-500">Paid by customers</p>
              <p className="mt-2 text-xl font-black text-slate-900">{data.summary.filter((s) => s.paidOrders > 0).map((s) => formatPrice(s.paidTotal, s.currency)).join(" · ") || "—"}</p>
            </Card>
            <Card>
              <p className="text-sm font-bold text-slate-500">Waiting for payment</p>
              <p className="mt-2 text-xl font-black text-slate-900">{data.summary.filter((s) => s.waitingOrders > 0).map((s) => formatPrice(s.waitingTotal, s.currency)).join(" · ") || "—"}</p>
            </Card>
          </div>
        )}

        {result?.error ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">{result.error}</Card>
        ) : loading && !data ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading orders…</p>
        ) : data && data.orders.length === 0 ? (
          <EmptyState title="No orders found" />
        ) : (
          <AdminTable headers={["Date", "Supplier", "Customer", "Items", "Amount", "Order", "Payment"]}>
            {(data?.orders ?? []).map((order: Order) => (
              <tr key={order.id} className="align-top transition-colors hover:bg-slate-50/50">
                <td className="px-6 py-4 text-xs text-slate-500">{formatDate(order.createdAt)}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{order.supplierName ?? "—"}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">{order.clientName}</p>
                  <p className="text-xs">{order.clientPhone}</p>
                  <p className="text-xs text-slate-400">{order.city}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{order.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")}</td>
                <td className="px-6 py-4 text-sm font-black text-slate-900">{formatPrice(order.total, order.currency)}</td>
                <td className="px-6 py-4">
                  <StatusPill status={ORDER_STATUS_LABELS[order.status]} />
                </td>
                <td className="px-6 py-4">
                  <StatusPill status={order.paymentStatus === "paid" ? (order.refundPending ? "Refund pending" : "Paid") : order.paymentStatus === "refunded" ? "Refunded" : order.paymentStatus === "pending" ? "Pending" : "Not paid"} />
                </td>
              </tr>
            ))}
          </AdminTable>
        )}

        {(data?.total ?? 0) > PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>
              Page {page} of {lastPage}
            </span>
            <div className="flex gap-2">
              <SecondaryButton type="button" className="min-h-10 px-4 py-2 text-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </SecondaryButton>
              <SecondaryButton type="button" className="min-h-10 px-4 py-2 text-sm" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>
                Next
              </SecondaryButton>
            </div>
          </div>
        )}
      </RequirePermission>
    </PageFrame>
  );
}
