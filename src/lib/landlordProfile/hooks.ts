"use client";

import { useSyncExternalStore } from "react";
import { LandlordProfileStoreEngine } from "./store";
import { DEFAULT_LANDLORD_PROFILE } from "./seed";
import type { LandlordProfile } from "./types";

// getServerSnapshot pinned to the fixed DEFAULT_LANDLORD_PROFILE (never the
// live localStorage-backed value), matching src/lib/tenantApplications/hooks.ts
// — there's no localStorage on the server, so SSR must render a deterministic
// value that matches what the client store also falls back to pre-hydration.
export function useLandlordProfile(ownerId: string): LandlordProfile {
  return useSyncExternalStore(
    LandlordProfileStoreEngine.subscribe,
    () => LandlordProfileStoreEngine.getByOwnerId(ownerId),
    () => DEFAULT_LANDLORD_PROFILE
  );
}
