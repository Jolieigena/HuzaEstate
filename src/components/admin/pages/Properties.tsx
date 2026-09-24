"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { PropertyApi } from "@/lib/properties/api";
import type { Property, PropertyStatus } from "@/lib/properties/types";
import { useToast } from "@/lib/toast-context";
import ReasonFormModal from "../ReasonFormModal";
import { AdminTable, Card, EmptyState, PageFrame, RequirePermission, SecondaryButton, StatusPill, fieldClass, formatDate, formatMoney } from "../ui";

const STATUS_FILTERS: { key: "all" | PropertyStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "unpublished", label: "Unpublished" },
  { key: "changes_requested", label: "Changes requested" },
  { key: "rejected", label: "Rejected" },
  { key: "archived", label: "Archived" },
];

type Pending = { property: Property; status: "unpublished" | "changes_requested" | "rejected" };
const PENDING_COPY: Record<Pending["status"], { title: string; description: string; submit: string }> = {
  unpublished: { title: "Unpublish listing", description: "It disappears from public search. The owner sees your reason and can't relist it themselves.", submit: "Unpublish" },
  changes_requested: { title: "Request changes", description: "The listing comes down until the owner fixes what you describe and republishes it.", submit: "Request changes" },
  rejected: { title: "Reject listing", description: "The listing is taken down and the owner can't republish it.", submit: "Reject listing" },
};

export function PropertiesListPage() {
  const { token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const canView = useIsAdministrator();
  const canModerate = useIsAdministrator();
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | "sale" | "rent">("all");
  const [status, setStatus] = useState<"all" | PropertyStatus>("all");
  const [pending, setPending] = useState<Pending | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!isAuthReady || !token || !canView) return;
    let cancelled = false;
    PropertyApi.all(token).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setProperties(result.data);
        setError(null);
      } else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, reload]);

  const change = useCallback(
    async (property: Property, next: PropertyStatus, reason?: string) => {
      if (!token) return;
      const result = await PropertyApi.setStatus(token, property.id, next, reason);
      if (result.ok) {
        showToast(next === "published" ? "Listing published." : "Listing updated.");
        setReload((n) => n + 1);
      } else showToast(result.error, "error");
    },
    [token, showToast]
  );

  const q = search.trim().toLowerCase();
  const rows = (properties ?? []).filter((p) => {
    const matchesSearch = !q || `${p.title} ${p.location} ${p.city} ${p.ownerName ?? ""}`.toLowerCase().includes(q);
    return matchesSearch && (type === "all" || p.type === type) && (status === "all" || (p.status ?? "published") === status);
  });
  const count = (key: "all" | PropertyStatus) => (properties ?? []).filter((p) => key === "all" || (p.status ?? "published") === key).length;

  return (
    <PageFrame title="Properties" description="Every listing on the platform. Unpublish, reject or ask for changes — the owner sees your reason, and buyers stop seeing the listing immediately.">
      <RequirePermission granted={canView}>
        <div role="tablist" aria-label="Listing status" className="mb-5 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((item) => {
            const active = status === item.key;
            return (
              <button
                key={item.key}
                role="tab"
                aria-selected={active}
                onClick={() => setStatus(item.key)}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
              >
                {item.label}
                <span className={`ml-2 text-xs ${active ? "text-white/70" : "text-slate-400"}`}>{properties ? count(item.key) : "–"}</span>
              </button>
            );
          })}
        </div>

        <Card className="mb-5">
          <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr]">
            <label className="text-sm font-bold text-slate-700">
              Search
              <input className={`${fieldClass} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title, location, city or owner" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Type
              <select className={`${fieldClass} mt-1`} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                <option value="all">All types</option>
                <option value="sale">For sale</option>
                <option value="rent">For rent</option>
              </select>
            </label>
          </div>
        </Card>

        {error ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">
            {error}{" "}
            <button className="font-bold underline" onClick={() => setReload((n) => n + 1)}>
              Retry
            </button>
          </Card>
        ) : !properties ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading listings…</p>
        ) : rows.length ? (
          <AdminTable headers={["Property", "Owner", "Type", "Price", "Status", "Expires", "Actions"]}>
            {rows.map((property) => {
              const current = property.status ?? "published";
              return (
                <tr key={property.id} className="align-top transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={property.imageUrl} alt="" className="h-12 w-16 shrink-0 rounded-lg border border-slate-200 bg-slate-100 object-cover" />
                      <div className="min-w-0">
                        <Link href={`/properties/${property.id}`} target="_blank" className="block max-w-55 truncate text-sm font-bold text-slate-900 hover:text-[#219b31]">
                          {property.title}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {property.location}, {property.city}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {property.ownerId ? (
                      <Link href={`/admin/users/${property.ownerId}`} className="text-sm font-semibold text-slate-700 hover:text-[#219b31]">
                        {property.ownerName ?? "Owner"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{property.type === "sale" ? "For sale" : "For rent"}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">
                    {formatMoney(property.price, "USD")}
                    {property.type === "rent" ? <span className="text-xs font-medium text-slate-400"> /mo</span> : null}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={property.expired && current === "published" ? "expired" : current} />
                    {property.statusReason && current !== "published" && <p className="mt-1 max-w-45 text-xs text-slate-500">{property.statusReason}</p>}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{property.expiresAt ? formatDate(property.expiresAt) : "—"}</td>
                  <td className="px-6 py-4">
                    {canModerate ? (
                      <div className="flex flex-wrap gap-1.5">
                        {current !== "published" && (
                          <SecondaryButton className="min-h-0! px-3! py-1.5! text-xs!" onClick={() => change(property, "published")}>
                            Publish
                          </SecondaryButton>
                        )}
                        {current === "published" && (
                          <SecondaryButton className="min-h-0! px-3! py-1.5! text-xs!" onClick={() => setPending({ property, status: "unpublished" })}>
                            Unpublish
                          </SecondaryButton>
                        )}
                        {current !== "changes_requested" && (
                          <SecondaryButton className="min-h-0! px-3! py-1.5! text-xs!" onClick={() => setPending({ property, status: "changes_requested" })}>
                            Request changes
                          </SecondaryButton>
                        )}
                        {current !== "rejected" && (
                          <SecondaryButton className="min-h-0! px-3! py-1.5! text-xs! text-red-600!" onClick={() => setPending({ property, status: "rejected" })}>
                            Reject
                          </SecondaryButton>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">View only</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </AdminTable>
        ) : (
          <EmptyState title="No listings found" description={properties.length ? "Try a different search or filter." : "Listings appear here once sellers post them."} />
        )}
      </RequirePermission>

      <ReasonFormModal
        key={pending ? `${pending.property.id}-${pending.status}` : "closed"}
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending ? PENDING_COPY[pending.status].title : ""}
        description={pending ? `${pending.property.title} — ${PENDING_COPY[pending.status].description}` : undefined}
        reasonLabel="Reason shown to the owner"
        submitLabel={pending ? PENDING_COPY[pending.status].submit : "Save"}
        destructive={pending?.status === "rejected"}
        onSubmit={async ({ reason, note }) => {
          if (!pending) return;
          await change(pending.property, pending.status, [reason, note].filter(Boolean).join(" — "));
          setPending(null);
        }}
      />
    </PageFrame>
  );
}
