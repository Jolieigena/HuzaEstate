"use client";

import PropertyCard from "@/components/PropertyCard";
import Reveal from "@/components/Reveal";
import { PropertyGridSkeleton } from "@/components/PropertyCardSkeleton";
import { notifyPropertiesChanged } from "@/lib/sellerListings/hooks";
import type { Property } from "@/lib/properties/types";

interface PublicPropertyGridProps {
  properties: Property[];
  limit?: number;
  className: string;
  /** Home page wraps each card in a staggered Reveal animation; a boolean
   * flag (not a callback) so this prop stays serializable across the
   * Server → Client boundary when a Server Component page renders this. */
  revealAnimation?: boolean;
  /** Optionally display a 'Featured' badge on the property cards */
  showFeaturedBadge?: boolean;
  /** The listings have not arrived yet: grey placeholders are shown instead of an empty grid. */
  loading?: boolean;
  /** Loading failed and there is nothing to show. */
  failed?: boolean;
}

/** Public property grid: the listings passed in are already the published, non-expired browse set. */
export default function PublicPropertyGrid({ properties, limit, className, revealAnimation, showFeaturedBadge, loading, failed }: PublicPropertyGridProps) {
  const shown = limit ? properties.slice(0, limit) : properties;
  if (shown.length === 0 && loading) return <PropertyGridSkeleton count={limit ?? 6} className={className} />;
  if (shown.length === 0 && failed) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-semibold text-slate-600">We could not load the listings.</p>
        <button type="button" onClick={notifyPropertiesChanged} className="mt-3 text-sm font-bold text-[#219b31] underline hover:text-[#28b039]">
          Try again
        </button>
      </div>
    );
  }
  return (
    <div className={className}>
      {shown.map((property, index) =>
        revealAnimation ? (
          <Reveal key={property.id} delay={index * 120}>
            <PropertyCard property={property} isFeatured={showFeaturedBadge} />
          </Reveal>
        ) : (
          <PropertyCard key={property.id} property={property} isFeatured={showFeaturedBadge} />
        )
      )}
    </div>
  );
}
