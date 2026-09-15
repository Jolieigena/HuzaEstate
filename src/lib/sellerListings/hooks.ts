"use client";

import { useEffect, useState } from "react";
import { mockProperties } from "@/lib/data";
import type { Property } from "@/lib/properties/types";
import { usePropertyOverrides } from "@/lib/propertyOverrides/hooks";
import { applyOverride } from "@/lib/propertyOverrides/store";

const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:8081/api/property-service";

/** Real, backend-posted listings (property-service, MongoDB-backed) — supersedes the old
 *  localStorage-based seller-listings store. Fetched fresh on every mount rather than
 *  cached, so a page navigated to right after posting a new listing sees it immediately. */
function useBackendProperties(): Property[] {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${PROPERTY_API_URL}/properties?limit=200`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed to load properties"))))
      .then((data) => {
        if (!cancelled) setProperties(data.properties as Property[]);
      })
      .catch(() => {
        // Network/backend unavailable — fall back to just the curated fixtures below
        // rather than leaving the page blank.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return properties;
}

/** Real backend-posted listings plus the curated mockProperties fixtures (so the
 *  marketplace still looks populated before many real listings exist), with any
 *  per-property edits (see propertyOverrides) applied on top. */
export function useAllProperties(): Property[] {
  const backendProperties = useBackendProperties();
  const overrides = usePropertyOverrides();
  const base = [...backendProperties, ...mockProperties];
  return Object.keys(overrides).length ? base.map((p) => applyOverride(p, overrides)) : base;
}
