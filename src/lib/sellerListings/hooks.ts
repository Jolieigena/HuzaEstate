"use client";

import { useEffect, useState } from "react";
import type { Property } from "@/lib/properties/types";
import { usePropertyOverrides } from "@/lib/propertyOverrides/hooks";
import { applyOverride } from "@/lib/propertyOverrides/store";

const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:8081/api/property-service";

const listeners = new Set<() => void>();

/** Call after a real create/edit/delete against property-service (see EditPropertyModal.tsx,
 *  ManagerDashboard.tsx's delete handler, post-property/page.tsx) so every mounted
 *  useAllProperties() consumer refetches instead of showing stale data until next navigation. */
export function notifyPropertiesChanged() {
  listeners.forEach((listener) => listener());
}

/** Real, backend-posted listings (property-service, MongoDB-backed) — supersedes the old
 *  localStorage-based seller-listings store. Fetched fresh on every mount, and again whenever
 *  notifyPropertiesChanged() fires, so a page doesn't keep showing a just-edited/deleted
 *  listing's old state. */
function useBackendProperties(): Property[] {
  const [properties, setProperties] = useState<Property[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const listener = () => setVersion((v) => v + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

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
  }, [version]);

  return properties;
}

/** Real backend-posted listings (property-service), with any per-property edits
 *  (see propertyOverrides) applied on top. */
export function useAllProperties(): Property[] {
  const backendProperties = useBackendProperties();
  const overrides = usePropertyOverrides();
  return Object.keys(overrides).length ? backendProperties.map((p) => applyOverride(p, overrides)) : backendProperties;
}
