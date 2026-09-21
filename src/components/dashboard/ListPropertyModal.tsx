"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { PortfolioProperty } from "@/lib/portfolio/portfolioService";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { fieldClass } from "@/components/admin/ui";

const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:8081/api/property-service";

export type ListMode = "resale" | "rent";

/** "List for Resale" / "List for Rent", launched from the Portfolio tab.
 *  Publishing a listing means a real POST to property-service (the same
 *  request post-property/page.tsx makes) — mirrors it here with the
 *  portfolio property's specs pre-filled, rather than reusing the
 *  now-superseded localStorage SellerListingsStoreEngine (see
 *  src/lib/sellerListings/hooks.ts's comment on why that store is dead). */
export default function ListPropertyModal({
  property,
  mode,
  onClose,
}: {
  property: PortfolioProperty | null;
  mode: ListMode;
  onClose: () => void;
}) {
  const router = useRouter();
  const { token, isApprovedSeller, account } = useAuth();
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");

  if (!property) return null;

  const suggestedPrice =
    mode === "resale"
      ? property.currentEstimatedValue ?? property.purchasePrice ?? 0
      : Math.round(((property.currentEstimatedValue ?? property.purchasePrice ?? 0) * 0.006) / 10) * 10; // ~0.6%/mo rule-of-thumb starting point, editable below

  const priceValue = price || String(suggestedPrice);

  if (!isApprovedSeller) {
    return (
      <ConfirmModal
        open
        onClose={onClose}
        onConfirm={() => router.push("/become-a-seller")}
        title="Manager Portal access needed"
        description={
          <>
            Publishing a listing happens through the Manager Portal, which needs administrator-approved seller access first. Apply now — you&apos;ll
            land back here once approved.
          </>
        }
        confirmLabel="Apply to become a seller"
      />
    );
  }

  return (
    <ConfirmModal
      open
      onClose={onClose}
      title={mode === "resale" ? `List "${property.name}" for resale` : `List "${property.name}" for rent`}
      description={`This publishes a new ${mode === "resale" ? "for-sale" : "for-rent"} listing from your property's details. You can edit or unpublish it any time from Manager Portal → My Listings.`}
      confirmLabel={mode === "resale" ? "Publish resale listing" : "Publish rental listing"}
      onConfirm={async () => {
        setError("");
        const [neighborhood, ...cityParts] = property.location.split(",");
        const city = cityParts.length ? cityParts.join(",").trim() : neighborhood.trim();
        try {
          const res = await fetch(`${PROPERTY_API_URL}/properties`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              title: property.name,
              description: `A ${property.propertyType} in ${property.location}, listed by its owner via HuzaEstate.`,
              price: Number(priceValue) || 0,
              currency: mode === "rent" ? "USD/month" : "USD",
              location: neighborhood.trim(),
              city,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              sqm: property.areaSqm,
              imageUrl: property.imageUrl,
              type: mode === "resale" ? "sale" : "rent",
              // MyProperty's richer PropertyType (villa/townhouse/detached_house/...) has no
              // direct match in the marketplace listing's simpler "house" | "apartment" | "land" —
              // only "apartment" maps 1:1, everything else collapses to "house".
              propertyType: property.propertyType === "apartment" ? "apartment" : "house",
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => null);
            setError(data?.message || "Could not publish your listing. Please try again.");
            return;
          }
          onClose();
          router.push("/manager?tab=listings");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not reach the server. Please try again.");
        }
      }}
    >
      <div className="mb-2">
        <label className="block text-sm font-bold text-slate-700 mb-2">{mode === "resale" ? "Asking price (USD)" : "Monthly rent (USD)"}</label>
        <input
          type="number"
          min={0}
          value={priceValue}
          onChange={(e) => setPrice(e.target.value)}
          className={fieldClass}
        />
        <p className="text-xs text-slate-400 mt-1.5">
          {account?.name ?? "You"}&apos;re listed as the owner{property.currentEstimatedValue ? ` — suggested from this property's current estimated value` : ""}.
        </p>
        {error && <p className="text-xs font-semibold text-red-600 mt-2">{error}</p>}
      </div>
    </ConfirmModal>
  );
}
