"use client";

import { useSyncExternalStore } from "react";
import { TenantApplicationsStoreEngine } from "./store";
import { SEED_APPLICATIONS } from "./seed";
import type { TenantApplication } from "./types";

// getServerSnapshot is pinned to the fixed SEED_APPLICATIONS reference
// (never the live localStorage-backed value) for the same reason as
// src/lib/tours/hooks.ts and src/lib/sellerListings/hooks.ts: there's no
// localStorage on the server, so SSR must render a deterministic value.
// Unlike those stores (which start empty), this one's default *is* the
// seed data, so pinning to SEED_APPLICATIONS — rather than `[]` — is what
// keeps a first render's hydration consistent with what the client store
// also falls back to when nothing has been saved yet.
export function useTenantApplications(): TenantApplication[] {
  return useSyncExternalStore(
    TenantApplicationsStoreEngine.subscribe,
    () => TenantApplicationsStoreEngine.getAll(),
    () => SEED_APPLICATIONS
  );
}
