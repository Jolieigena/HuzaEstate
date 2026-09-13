"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Property } from "@/lib/properties/types";
import { AdminService } from "./service";
import type { ListingModerationRecord, ListingModerationStatus } from "./types";

/** Statuses that keep a listing out of public discovery. Anything else —
 * including "published", "reported" (a report alone doesn't take a live
 * listing down), or no moderation record at all — stays visible, which
 * matches today's behavior for all 80 seeded properties unchanged. */
const HIDDEN_STATUSES: ListingModerationStatus[] = ["awaiting_moderation", "changes_requested", "rejected", "unpublished", "archived"];

export function isListingVisible(record: ListingModerationRecord | undefined): boolean {
  if (!record) return true;
  return !HIDDEN_STATUSES.includes(record.status);
}

/**
 * Filters a property list down to publicly-visible listings. Reads the
 * admin moderation overlay via `useSyncExternalStore`, whose server
 * snapshot is the untouched empty state — so SSR output is byte-identical
 * to today's unfiltered rendering and there is no hydration mismatch; the
 * client re-filters once the real persisted overlay loads.
 */
export function useVisibleListings(properties: Property[]): Property[] {
  const state = useSyncExternalStore(AdminService.subscribe, AdminService.getSnapshot, AdminService.getServerSnapshot);
  return useMemo(() => properties.filter((property) => isListingVisible(state.listingModeration[property.id])), [properties, state]);
}

export function useIsListingVisible(propertyId: string): boolean {
  const state = useSyncExternalStore(AdminService.subscribe, AdminService.getSnapshot, AdminService.getServerSnapshot);
  return isListingVisible(state.listingModeration[propertyId]);
}

/** The specific moderation status for one listing — "published" when there's
 *  no record at all, matching today's default-visible behavior. Used by the
 *  Manager Portal to show/toggle "Remove from Market" and "Archive" (the
 *  same underlying statuses an admin can also set), not just whether a
 *  listing happens to be visible right now. */
export function useListingModerationStatus(propertyId: string): ListingModerationStatus {
  const state = useSyncExternalStore(AdminService.subscribe, AdminService.getSnapshot, AdminService.getServerSnapshot);
  return state.listingModeration[propertyId]?.status ?? "published";
}
