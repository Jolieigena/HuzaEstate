"use client";

import PropertyCard from "@/components/PropertyCard";
import Reveal from "@/components/Reveal";
import { useVisibleListings } from "@/lib/admin/listings";
import type { Property } from "@/lib/data";

interface PublicPropertyGridProps {
  properties: Property[];
  limit?: number;
  className: string;
  /** Home page wraps each card in a staggered Reveal animation; a boolean
   * flag (not a callback) so this prop stays serializable across the
   * Server → Client boundary when a Server Component page renders this. */
  revealAnimation?: boolean;
}

/**
 * Thin client boundary around the existing property-grid markup on public
 * pages, so listings an administrator has unpublished (or that are still
 * awaiting moderation) drop out of public discovery. `buy`/`rent`/`page.tsx`
 * (the home page) are Server Components and can't read the moderation
 * overlay themselves — this is the one place that filtering happens for
 * them. Markup/classNames are passed through unchanged from each caller.
 */
export default function PublicPropertyGrid({ properties, limit, className, revealAnimation }: PublicPropertyGridProps) {
  const visible = useVisibleListings(properties);
  const shown = limit ? visible.slice(0, limit) : visible;
  return (
    <div className={className}>
      {shown.map((property, index) =>
        revealAnimation ? (
          <Reveal key={property.id} delay={index * 120}>
            <PropertyCard property={property} />
          </Reveal>
        ) : (
          <PropertyCard key={property.id} property={property} />
        )
      )}
    </div>
  );
}
