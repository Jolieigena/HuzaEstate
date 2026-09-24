"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PropertyApi } from "@/lib/properties/api";
import type { Property } from "@/lib/properties/types";

const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:8081/api/property-service";

const listeners = new Set<() => void>();

/** Call after a create/edit/delete/status change against property-service so every mounted
 *  listings hook refetches instead of showing stale data until the next navigation. */
export function notifyPropertiesChanged() {
  listeners.forEach((listener) => listener());
}

function useRefreshVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const listener = () => setVersion((v) => v + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return version;
}

/** Public browse set from property-service: published, non-expired listings only. */
export function useAllProperties(): Property[] {
  const [properties, setProperties] = useState<Property[]>([]);
  const version = useRefreshVersion();

  useEffect(() => {
    let cancelled = false;
    fetch(`${PROPERTY_API_URL}/properties?limit=200`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed to load properties"))))
      .then((data) => {
        if (!cancelled) setProperties(data.properties as Property[]);
      })
      .catch(() => {
        // Backend unavailable — leave the list as it was rather than blanking the page.
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  return properties;
}

/** The signed-in seller's own listings in every status (published, off-market, archived,
 *  rejected, expired). `loaded` stays false until the first response so callers can tell
 *  "no listings yet" from "still loading". */
export function useMyProperties(): { properties: Property[]; loaded: boolean } {
  const { token, isAuthReady } = useAuth();
  const [state, setState] = useState<{ properties: Property[]; loaded: boolean }>({ properties: [], loaded: false });
  const version = useRefreshVersion();

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    PropertyApi.mine(token).then((result) => {
      if (!cancelled && result.ok) setState({ properties: result.data, loaded: true });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, version]);

  return state;
}

/** One listing by id. Signed-in owners and administrators can also open it while it isn't
 *  public, which the browse list can't show. */
export function useProperty(id: string): { property: Property | null; loading: boolean } {
  const { token, isAuthReady } = useAuth();
  const [state, setState] = useState<{ id: string; property: Property | null } | null>(null);
  const version = useRefreshVersion();

  useEffect(() => {
    if (!isAuthReady) return;
    let cancelled = false;
    PropertyApi.byId(id, token).then((result) => {
      if (!cancelled) setState({ id, property: result.ok ? result.data : null });
    });
    return () => {
      cancelled = true;
    };
  }, [id, token, isAuthReady, version]);

  return { property: state?.id === id ? state.property : null, loading: !state || state.id !== id };
}
