"use client";

import PropertyCard from "@/components/PropertyCard";
import Reveal from "@/components/Reveal";
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
}

/** Public property grid: the listings passed in are already the published, non-expired browse set. */
export default function PublicPropertyGrid({ properties, limit, className, revealAnimation, showFeaturedBadge }: PublicPropertyGridProps) {
  const shown = limit ? properties.slice(0, limit) : properties;
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
