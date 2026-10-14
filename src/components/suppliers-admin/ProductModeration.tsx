"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PromptModal from "@/components/shared/PromptModal";
import Select from "@/components/shared/Select";
import { AdminTable, Card, EmptyState, PageFrame, RequirePermission, SecondaryButton, StatusPill, fieldClass, formatDate } from "@/components/admin/ui";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { FurnitureApi, formatPrice, type ModerationProduct } from "@/lib/furniture/api";
import { hasOrgPermission } from "@/lib/orgPermissions";
import { useToast } from "@/lib/toast-context";
import type { SuppliersScope } from "./SuppliersAdmin";

const LIMIT = 25;

/** Every published product from the suppliers a staff member looks after, with a way to take one down (with the reason the
 *  supplier is shown) and to put it back. Platform administrators see all suppliers, organisation admins those in their
 *  organisation's countries. */
export default function ProductModerationPage({ scope }: { scope: SuppliersScope }) {
  const { token, isAuthReady, account } = useAuth();
  const { showToast } = useToast();
  const isAdministrator = useIsAdministrator();
  const canManage = scope === "admin" ? isAdministrator : (account?.roles.includes("organization_admin") ?? false) && hasOrgPermission(account?.permissions, "manage_suppliers");

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ products: ModerationProduct[]; total: number; hiddenCount: number } | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [hiding, setHiding] = useState<ModerationProduct | null>(null);
  const [busyId, setBusyId] = useState("");

  // Typing waits a moment before searching so each keystroke is not a request.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isAuthReady || !token || !canManage) return;
    let cancelled = false;
    FurnitureApi.moderationList(token, { search: query, state, page, limit: LIMIT }).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setData(result.data);
        setError("");
      } else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canManage, query, state, page, reload]);

  async function hide(reason: string) {
    if (!token || !hiding) return;
    const target = hiding;
    setHiding(null);
    setBusyId(target.id);
    const result = await FurnitureApi.hideProduct(token, target.id, reason);
    setBusyId("");
    if (result.ok) {
      showToast("Product taken down. The supplier has been told.");
      setReload((n) => n + 1);
    } else showToast(result.error, "error");
  }

  async function restore(product: ModerationProduct) {
    if (!token) return;
    setBusyId(product.id);
    const result = await FurnitureApi.restoreProduct(token, product.id);
    setBusyId("");
    if (result.ok) {
      showToast("Product is visible again.");
      setReload((n) => n + 1);
    } else showToast(result.error, "error");
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <PageFrame
      title="Supplier products"
      action={
        <Link href={scope === "admin" ? "/admin/suppliers" : "/org-admin/suppliers"} className="text-sm font-bold text-slate-500 hover:text-[#219b31]">
          Back to Suppliers
        </Link>
      }
    >
      <RequirePermission granted={canManage}>
        <Card className="mb-5 grid gap-4 sm:grid-cols-[1fr_14rem]">
          <label className="text-sm font-bold text-slate-700">
            Search
            <input className={`${fieldClass} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Product name" />
          </label>
          <label className="text-sm font-bold text-slate-700">
            Show
            <Select
              className={`${fieldClass} mt-1`}
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All products</option>
              <option value="live">Visible</option>
              <option value="hidden">Taken down{data ? ` (${data.hiddenCount})` : ""}</option>
            </Select>
          </label>
        </Card>

        {error ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">{error}</Card>
        ) : !data ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading products…</p>
        ) : data.products.length === 0 ? (
          <EmptyState title="No products found" />
        ) : (
          <>
            <AdminTable headers={["Product", "Supplier", "Price", "Status", "Actions"]}>
              {data.products.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.image ? <img src={p.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <div className="h-12 w-12 shrink-0 rounded-lg bg-slate-100" />}
                      <div className="min-w-0">
                        <Link href={`/shop/${p.id}`} className="block truncate font-bold text-slate-900 hover:underline">
                          {p.name}
                        </Link>
                        <p className="text-xs text-slate-500">{p.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <Link href={`/shop/supplier/${p.supplierId}`} className="hover:underline">
                      {p.supplierName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">{formatPrice(p.price, p.currency)}</td>
                  <td className="px-6 py-4">
                    {p.hidden ? (
                      <>
                        <StatusPill status="Declined" />
                        <p className="mt-1 max-w-xs text-xs text-slate-500">
                          {p.hiddenReason}
                          {p.hiddenAt ? ` · ${formatDate(p.hiddenAt)}` : ""}
                        </p>
                      </>
                    ) : (
                      <StatusPill status="Completed" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {p.hidden ? (
                      <SecondaryButton className="min-h-9 px-3 py-1.5 text-xs" disabled={busyId === p.id} onClick={() => restore(p)}>
                        Restore
                      </SecondaryButton>
                    ) : (
                      <SecondaryButton className="min-h-9 px-3 py-1.5 text-xs hover:!border-red-300 hover:!text-red-600" disabled={busyId === p.id} onClick={() => setHiding(p)}>
                        Take down
                      </SecondaryButton>
                    )}
                  </td>
                </tr>
              ))}
            </AdminTable>
            {pages > 1 && (
              <div className="mt-5 flex items-center justify-between text-sm font-bold text-slate-600">
                <SecondaryButton disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>
                  Previous
                </SecondaryButton>
                <span>
                  Page {page} of {pages}
                </span>
                <SecondaryButton disabled={page >= pages} onClick={() => setPage((n) => n + 1)}>
                  Next
                </SecondaryButton>
              </div>
            )}
          </>
        )}
      </RequirePermission>

      <PromptModal open={!!hiding} onClose={() => setHiding(null)} onSubmit={hide} title={hiding ? `Take down "${hiding.name}"` : "Take down"} label="Reason for the supplier" placeholder="What needs to be fixed" submitLabel="Take down" />
    </PageFrame>
  );
}
