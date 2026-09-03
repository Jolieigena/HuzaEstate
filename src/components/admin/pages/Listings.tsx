"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { useAdminState, useHasPermission } from "@/lib/admin/hooks";
import { AdminService } from "@/lib/admin/service";
import type { ListingModerationStatus } from "@/lib/admin/types";
import { mockProperties } from "@/lib/data";
import { useToast } from "@/lib/toast-context";
import ReasonFormModal from "../ReasonFormModal";
import { Card, EmptyState, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, StatusPill, fieldClass, formatDate, formatDateTime } from "../ui";

const STATUS_OPTIONS: ListingModerationStatus[] = ["published", "awaiting_moderation", "changes_requested", "rejected", "unpublished", "reported", "archived"];

function useActor() {
  const { account } = useAuth();
  return { actorAccountId: account?.id ?? "system", actorName: account?.name ?? "System" };
}

export function ListingsListPage() {
  const { account } = useAuth();
  const state = useAdminState();
  const canView = useHasPermission(account?.id, "listings.view");
  const [status, setStatus] = useState<"all" | ListingModerationStatus>("all");
  const [saleType, setSaleType] = useState<"all" | "sale" | "rent">("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(
    () =>
      mockProperties.map((property) => ({
        property,
        moderation: state.listingModeration[property.id],
      })),
    [state]
  );

  const filtered = rows.filter(({ property, moderation }) => {
    const effectiveStatus = moderation?.status ?? "published";
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [property.title, property.location, property.city].some((field) => field.toLowerCase().includes(q));
    return matchesSearch && (status === "all" || effectiveStatus === status) && (saleType === "all" || property.type === saleType);
  });

  return (
    <PageFrame title="Property Listings" description="Review submitted listings, handle reports, and control what appears in public discovery.">
      <RequirePermission granted={canView}>
        <Card className="mb-5">
          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
            <label className="text-sm font-bold text-slate-700">
              Search
              <input className={`${fieldClass} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title, location or city" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Sale or rent
              <select className={`${fieldClass} mt-1`} value={saleType} onChange={(e) => setSaleType(e.target.value as typeof saleType)}>
                <option value="all">All listings</option>
                <option value="sale">For sale</option>
                <option value="rent">For rent</option>
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              Status
              <select className={`${fieldClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <p className="mb-3 text-xs font-semibold text-slate-400">
          {filtered.length} of {rows.length} listings
        </p>

        {filtered.length ? (
          <div className="grid gap-3">
            {filtered.map(({ property, moderation }) => (
              <Link key={property.id} href={`/admin/listings/${property.id}`}>
                <Card className="p-4 transition-shadow hover:shadow-md">
                  <div className="grid gap-3 sm:grid-cols-[64px_1.6fr_1fr_1fr_auto] sm:items-center">
                    <div className="relative hidden h-14 w-14 overflow-hidden rounded-xl bg-slate-100 sm:block">
                      <Image src={property.imageUrl} alt="" fill sizes="56px" className="object-cover" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{property.title}</p>
                      <p className="text-xs text-slate-500">{property.location}, {property.city}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-600">{property.type === "sale" ? "For sale" : "For rent"} · ${property.price.toLocaleString()}{property.type === "rent" ? "/mo" : ""}</p>
                    <p className="text-xs text-slate-500">{moderation ? `Updated ${formatDate(moderation.updatedAt)}` : "No moderation history"}</p>
                    <StatusPill status={moderation?.status ?? "published"} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No listings found" description="Try a different search or filter." />
        )}
      </RequirePermission>
    </PageFrame>
  );
}

export function ListingDetailPage({ listingId }: { listingId: string }) {
  const { account } = useAuth();
  const { actorAccountId, actorName } = useActor();
  useAdminState();
  const { showToast } = useToast();
  const canView = useHasPermission(account?.id, "listings.view");
  const canModerate = useHasPermission(account?.id, "listings.moderate");

  const [changesOpen, setChangesOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);

  const property = mockProperties.find((item) => item.id === listingId);

  if (!canView) {
    return (
      <PageFrame title="Property Listings" description="">
        <RequirePermission granted={false}>{null}</RequirePermission>
      </PageFrame>
    );
  }

  if (!property) {
    return (
      <PageFrame title="Listing not found" description="This listing could not be found.">
        <EmptyState title="Listing not found" description="The listing may have been removed, or the link is incorrect." />
      </PageFrame>
    );
  }

  const moderation = AdminService.getModerationRecord(property.id);
  const status = moderation?.status ?? "published";

  const checklist = [
    ["Required fields complete", Boolean(property.title && property.description && property.location)],
    ["Images present", Boolean(property.imageUrl)],
    ["Price entered", property.price > 0],
    ["Location reasonable", Boolean(property.city && property.location)],
    ["Description appropriate length", property.description.length > 20],
  ] as const;

  return (
    <PageFrame
      title={property.title}
      description={`${property.location}, ${property.city} · ${property.type === "sale" ? "For sale" : "For rent"}`}
      action={
        <Link href="/admin/listings" className="text-sm font-bold text-slate-500 hover:text-[#219b31]">
          Back to Property Listings
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-900">Listing information</h3>
              <StatusPill status={status} />
            </div>
            <div className="relative mt-4 h-56 w-full overflow-hidden rounded-2xl bg-slate-100">
              <Image src={property.imageUrl} alt={property.title} fill sizes="800px" className="object-cover" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{property.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-slate-400">Price</dt><dd className="mt-1 font-semibold text-slate-700">${property.price.toLocaleString()}{property.type === "rent" ? "/mo" : ""}</dd></div>
              <div><dt className="text-xs text-slate-400">Property type</dt><dd className="mt-1 font-semibold text-slate-700 capitalize">{property.propertyType}</dd></div>
              <div><dt className="text-xs text-slate-400">Bed / Bath</dt><dd className="mt-1 font-semibold text-slate-700">{property.bedrooms} bed · {property.bathrooms} bath</dd></div>
              <div><dt className="text-xs text-slate-400">Area</dt><dd className="mt-1 font-semibold text-slate-700">{property.sqm} sqm</dd></div>
              <div><dt className="text-xs text-slate-400">Seller</dt><dd className="mt-1 font-semibold text-slate-700">Not linked to a seller account in this prototype</dd></div>
              <div><dt className="text-xs text-slate-400">Report count</dt><dd className="mt-1 font-semibold text-slate-700">{moderation?.reportCount ?? 0}</dd></div>
            </dl>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Moderation checklist</h3>
            <p className="mt-1 text-xs text-slate-500">Informational only — legal title or ownership is not verified in this prototype.</p>
            <ul className="mt-4 space-y-2">
              {checklist.map(([label, ok]) => (
                <li key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
                  <span className="font-semibold text-slate-700">{label}</span>
                  <span className={`text-xs font-bold ${ok ? "text-[#219b31]" : "text-amber-600"}`}>{ok ? "OK" : "Needs attention"}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Moderation history</h3>
            <div className="mt-4 divide-y divide-slate-100">
              {moderation?.history.length ? (
                moderation.history.map((entry, index) => (
                  <div key={index} className="py-3 first:pt-0">
                    <p className="text-sm font-semibold text-slate-800">{entry.status.replace(/_/g, " ")}</p>
                    {entry.reason && <p className="mt-0.5 text-xs text-slate-500">{entry.reason}</p>}
                    <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(entry.at)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No moderation history — this listing has never been reviewed.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {canModerate && (
            <Card>
              <h3 className="text-lg font-black text-slate-900">Actions</h3>
              <div className="mt-4 flex flex-col gap-2">
                {status !== "published" && <PrimaryButton onClick={() => setApproveOpen(true)}>Approve</PrimaryButton>}
                {status === "published" && <SecondaryButton onClick={() => setUnpublishOpen(true)}>Unpublish</SecondaryButton>}
                {["unpublished", "rejected", "changes_requested", "archived"].includes(status) && (
                  <SecondaryButton onClick={() => setRestoreOpen(true)}>Restore</SecondaryButton>
                )}
                <SecondaryButton onClick={() => setChangesOpen(true)}>Request changes</SecondaryButton>
                <SecondaryButton onClick={() => setRejectOpen(true)} className="border-red-200 text-red-600 hover:border-red-300 hover:text-red-700">
                  Reject
                </SecondaryButton>
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Approve this listing?"
        description="The listing becomes publishable and appears in public discovery again."
        confirmLabel="Approve listing"
        onConfirm={() => {
          AdminService.setListingStatus(property.id, "published", actorAccountId, actorName, "Approved by moderator.");
          setApproveOpen(false);
          showToast("Listing approved.");
        }}
      />

      <ReasonFormModal
        open={changesOpen}
        onClose={() => setChangesOpen(false)}
        title="Request changes"
        description="The listing is hidden from public discovery until resubmitted."
        submitLabel="Request changes"
        reasonLabel="What needs to change?"
        noteLabel="Customer-visible explanation (optional)"
        onSubmit={({ reason, note }) => {
          AdminService.setListingStatus(property.id, "changes_requested", actorAccountId, actorName, reason, note);
          setChangesOpen(false);
          showToast("Changes requested.");
        }}
      />

      <ReasonFormModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        destructive
        title="Reject this listing"
        description="The listing is hidden from public discovery."
        submitLabel="Reject listing"
        reasonLabel="Internal reason"
        noteLabel="Customer-visible explanation"
        noteRequired
        onSubmit={({ reason, note }) => {
          AdminService.setListingStatus(property.id, "rejected", actorAccountId, actorName, reason, note);
          setRejectOpen(false);
          showToast("Listing rejected.");
        }}
      />

      <ReasonFormModal
        open={unpublishOpen}
        onClose={() => setUnpublishOpen(false)}
        destructive
        title="Unpublish this listing"
        description="The listing disappears from public discovery immediately."
        submitLabel="Unpublish listing"
        reasonLabel="Internal reason"
        noteLabel="Customer-visible explanation"
        noteRequired
        onSubmit={({ reason, note }) => {
          AdminService.setListingStatus(property.id, "unpublished", actorAccountId, actorName, reason, note);
          setUnpublishOpen(false);
          showToast("Listing unpublished.");
        }}
      />

      <ConfirmModal
        open={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        title="Restore this listing?"
        description="The listing becomes publishable and appears in public discovery again."
        confirmLabel="Restore listing"
        onConfirm={() => {
          AdminService.setListingStatus(property.id, "published", actorAccountId, actorName, "Restored by moderator.");
          setRestoreOpen(false);
          showToast("Listing restored.");
        }}
      />
    </PageFrame>
  );
}
