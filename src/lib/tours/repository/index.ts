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

  let mergedScenes = existing?.scenes || [];
  
  if (patch.scenes) {
    mergedScenes = patch.scenes;
  } else if (patch.operationId && mergedScenes.length > 0) {
    // If it's a partial patch for a specific operationId (from legacy/single-scene endpoints)
    mergedScenes = mergedScenes.map(scene => {
      if (scene.operationId === patch.operationId) {
        return {
          ...scene,
          status: patch.status as any ?? scene.status,
          phase: patch.phase ?? scene.phase,
          worldId: patch.worldId ?? scene.worldId,
          viewerUrl: patch.viewerUrl ?? scene.viewerUrl,
          thumbnailUrl: (patch as any).thumbnailUrl ?? scene.thumbnailUrl,
          panoUrl: (patch as any).panoUrl ?? scene.panoUrl,
          spzUrl: (patch as any).spzUrl ?? scene.spzUrl,
          rawSpzUrls: (patch as any).rawSpzUrls ?? scene.rawSpzUrls,
          colliderUrl: (patch as any).colliderUrl ?? scene.colliderUrl,
          caption: (patch as any).caption ?? scene.caption,
          semanticsMetadata: (patch as any).semanticsMetadata ?? scene.semanticsMetadata,
          error: patch.error ?? scene.error,
          readyAt: patch.readyAt ?? scene.readyAt,
        };
      }
      return scene;
    });
  }

  // Recalculate overall status based on scenes
  let overallStatus = patch.status ?? existing?.status ?? 'pending';
  let overallPhase = patch.phase ?? existing?.phase ?? 'queued';

  if (mergedScenes.length > 0) {
    if (mergedScenes.every(s => s.status === 'ready')) {
      overallStatus = 'ready';
      overallPhase = 'ready';
    } else if (mergedScenes.some(s => s.status === 'failed')) {
      overallStatus = 'failed';
      overallPhase = 'failed';
    }
  }

  const record: TourRecord = {
    ...existing,
    ...patch,
    status: overallStatus,
    phase: overallPhase,
    scenes: mergedScenes,
    id: existing?.id ?? patch.id ?? newId("tour"),
    propertyId,
    requestedAt: existing?.requestedAt ?? patch.requestedAt ?? now,
    updatedAt: now,
  };

  await repo.set(propertyId, record);
  return record;
}

export * from "./types";
