"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import Dialog from "@/components/Dialog";
import { AdminApi } from "@/lib/admin/api";
import type { Property, PropertyStatus } from "@/lib/properties/types";
import { useToast } from "@/lib/toast-context";
import { PrimaryButton, SecondaryButton, formatMoney } from "./ui";

export type ReviewDecision = Extract<PropertyStatus, "published" | "changes_requested" | "rejected">;

/** Read-through of a listing awaiting a decision, with the decision buttons alongside — shared by
 *  the platform-admin and org-admin Properties pages. The caller decides what each button does
 *  (publish straight away, or hand off to its reason modal). */
export function ListingReviewDialog({ property, onClose, onDecide }: { property: Property | null; onClose: () => void; onDecide: (property: Property, decision: ReviewDecision) => void }) {
  const titleId = useId();
  return (
    <Dialog open={property !== null} onClose={onClose} labelledBy={titleId} panelClassName="max-w-2xl">
      {property && (
        <div className="p-6 sm:p-8">
          <h2 id={titleId} className="mb-1 pr-6 text-xl font-black text-slate-900">
            Review listing
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Posted by {property.ownerName ?? "an unknown owner"}
            {property.ownerEmail ? ` · ${property.ownerEmail}` : ""}
            {property.ownerPhone ? ` · ${property.ownerPhone}` : ""}
          </p>
          <ReviewGallery key={property.id} property={property} />
          <h3 className="text-lg font-bold text-slate-900">{property.title}</h3>
          <p className="mb-3 text-sm text-slate-500">
            {property.location}, {property.city}
            {property.country ? `, ${property.country}` : ""}
          </p>
          <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            {[
              ["Price", `${formatMoney(property.price, "USD")}${property.type === "rent" ? " /mo" : ""}`],
              ["Type", `${property.type === "sale" ? "For sale" : "For rent"} · ${property.propertyType}`],
              ["Size", `${property.sqm} m²`],
              ["Bedrooms", String(property.bedrooms)],
              ["Bathrooms", String(property.bathrooms)],
                          ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-bold uppercase text-slate-400">{label}</dt>
                <dd className="font-semibold text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
          {property.description && <p className="mb-5 max-h-40 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-slate-600">{property.description}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <PrimaryButton className="min-h-10 px-4 py-2 text-sm" onClick={() => onDecide(property, "published")}>
              Publish
            </PrimaryButton>
            <SecondaryButton className="min-h-10 px-4 py-2 text-sm" onClick={() => onDecide(property, "changes_requested")}>
              Request changes
            </SecondaryButton>
            <SecondaryButton className="min-h-10 px-4 py-2 text-sm text-red-600!" onClick={() => onDecide(property, "rejected")}>
              Reject
            </SecondaryButton>
            <Link href={`/properties/${property.id}`} className="ml-auto text-sm font-bold text-slate-500 hover:text-[#219b31]">
              Open full page →
            </Link>
          </div>
        </div>
      )}
    </Dialog>
  );
}

// Every photo on the listing — the categorised `photos` when present, else the older gallery
// array, else just the cover — as a large preview with a thumbnail strip underneath.
function ReviewGallery({ property }: { property: Property }) {
  const urls = [property.photos?.map((p) => p.url), property.galleryImages, [property.imageUrl]].find((list) => list?.length) ?? [];
  const labels = property.photos?.length ? property.photos.map((p) => p.category) : [];
  const [index, setIndex] = useState(0);
  if (!urls.length) return null;
  const step = (delta: number) => setIndex((i) => (i + delta + urls.length) % urls.length);
  return (
    <div className="mb-4">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urls[index]} alt="" className="h-64 w-full rounded-xl border border-slate-200 bg-slate-100 object-cover" />
        {urls.length > 1 && (
          <>
            <button type="button" aria-label="Previous photo" onClick={() => step(-1)} className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-black text-slate-800 shadow hover:bg-white">
              ‹
            </button>
            <button type="button" aria-label="Next photo" onClick={() => step(1)} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-black text-slate-800 shadow hover:bg-white">
              ›
            </button>
          </>
        )}
        <span className="absolute bottom-2 right-2 rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-bold text-white">
          {labels[index] ? `${labels[index]} · ` : ""}
          {index + 1} / {urls.length}
        </span>
      </div>
      {urls.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {urls.map((url, i) => (
            <button key={`${url}-${i}`} type="button" aria-label={`Show photo ${i + 1}`} aria-current={i === index} onClick={() => setIndex(i)} className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${i === index ? "border-[#219b31]" : "border-transparent opacity-70 hover:opacity-100"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Per-seller auto-publish, keyed by seller id, loaded in one request for the whole table. A seller
 *  missing from the map is simply out of this viewer's scope (or beyond the first 200), so the
 *  toggle isn't offered for them. `null` = no explicit setting (follows the country / platform default). */
export function useSellerAutoPublish(token: string | null, enabled: boolean) {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Record<string, boolean | null>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !enabled) return;
    let cancelled = false;
    AdminApi.listUsers(token, { role: "seller_manager", limit: 200 }).then((result) => {
      if (cancelled || !result.ok) return;
      setSettings(Object.fromEntries(result.data.users.map((u) => [u.id, u.autoPublish ?? null])));
    });
    return () => {
      cancelled = true;
    };
  }, [token, enabled]);

  async function set(seller: { id: string; name: string }, next: boolean) {
    if (!token || saving) return;
    setSaving(seller.id);
    const result = await AdminApi.updateUser(token, seller.id, { autoPublish: next });
    setSaving(null);
    if (result.ok) {
      setSettings((prev) => ({ ...prev, [seller.id]: result.data.autoPublish ?? null }));
      showToast(next ? `${seller.name}'s listings will now publish without review.` : `${seller.name}'s listings will now go through review.`);
    } else showToast(result.error, "error");
  }

  return { settings, saving, set };
}

/** Switch under the owner's name: on = this seller's listings publish without review, off = they're
 *  always reviewed. A seller with no explicit setting shows off, with a tooltip saying it follows the default. */
export function SellerAutoPublishToggle({ seller, value, busy, onChange }: { seller: { id: string; name: string }; value: boolean | null | undefined; busy: boolean; onChange: (next: boolean) => void }) {
  if (value === undefined) return null;
  const on = value === true;
  return (
    <label className="mt-1.5 inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-500" title={value === null ? "Not set — follows the organisation / platform default" : undefined}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`Auto-publish listings from ${seller.name}`}
        disabled={busy}
        onClick={() => onChange(!on)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${on ? "bg-[#219b31]" : "bg-slate-300"}`}
      >
        <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : ""}`} />
      </button>
      Auto-publish
    </label>
  );
}
