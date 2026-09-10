import { fileTourRepository } from "./fileRepository";
import { newId } from "../ids";
import type { TourRecord } from "../types";
import type { TourRepository } from "./types";

/**
 * Resolves the active tour-record repository — the server-side source of
 * truth a buyer on any browser/device reads from (see
 * src/app/api/tours/record/route.ts), as opposed to the client-side
 * localStorage mirror (src/lib/tours/store.ts) that exists only for
 * instant/offline-friendly reads in the tab that generated it.
 *
 * Only one implementation exists today (see fileRepository.ts's dev-only
 * caveat), but this resolver — mirroring assetStorage/index.ts and
 * provider/index.ts — is the single place a real database implementation
 * would be swapped in later without touching any caller.
 */
export function getTourRepository(): TourRepository {
  return fileTourRepository;
}

/** Reads the existing record (if any), merges `patch` over it, and writes
 *  the result back — the one place id/propertyId/requestedAt/updatedAt
 *  bookkeeping happens, so every caller (generate route, status route)
 *  gets it right the same way. */
export async function upsertTourRecord(propertyId: string, patch: Partial<TourRecord>): Promise<TourRecord> {
  const repo = getTourRepository();
  const existing = await repo.get(propertyId);
  const now = new Date().toISOString();

  const record: TourRecord = {
    status: "pending",
    ...existing,
    ...patch,
    id: existing?.id ?? patch.id ?? newId("tour"),
    propertyId,
    requestedAt: existing?.requestedAt ?? patch.requestedAt ?? now,
    updatedAt: now,
  };

  await repo.set(propertyId, record);
  return record;
}

export * from "./types";
