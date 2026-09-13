import { fileTourRepository } from "./fileRepository";
import { newId } from "../ids";
import { sceneFields, scenesForRecord, withSceneState } from "../sceneState";
import { assertPropertyId } from "../validation";
import type { TourRecord, TourScene } from "../types";
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
// Serialize scene updates in this process so concurrent completions cannot
// overwrite one another. A database repository should use a transaction.
const pendingWrites = new Map<string, Promise<unknown>>();

export function upsertTourRecord(propertyId: string, patch: Partial<TourRecord>): Promise<TourRecord> {
  assertPropertyId(propertyId);
  const previous = pendingWrites.get(propertyId) ?? Promise.resolve();
  const write = previous.catch(() => {}).then(async () => {
    const repo = getTourRepository();
    const existing = await repo.get(propertyId);
    const now = new Date().toISOString();
    let scenes = patch.scenes ?? (existing ? scenesForRecord(existing) : []);

    if (!patch.scenes && patch.operationId) {
      const index = scenes.findIndex((scene) => scene.operationId === patch.operationId);
      const scene: TourScene = {
        id: patch.operationId,
        category: "default",
        status: "pending",
        ...(index >= 0 ? scenes[index] : {}),
        ...sceneFields(patch),
      };
      scenes = index >= 0 ? scenes.map((current, i) => i === index ? scene : current) : [...scenes, scene];
    } else if (!patch.scenes && patch.status === "failed") {
      scenes = scenes.map((scene) => scene.status === "pending"
        ? { ...scene, status: "failed", phase: "failed", error: patch.error }
        : scene);
    }

    const record: TourRecord = {
      ...existing,
      ...patch,
      status: patch.status ?? existing?.status ?? "pending",
      scenes,
      id: existing?.id ?? patch.id ?? newId("tour"),
      propertyId,
      requestedAt: patch.requestedAt ?? existing?.requestedAt ?? now,
      updatedAt: now,
    };
    const result = scenes.length ? withSceneState(record, scenes) : record;
    await repo.set(propertyId, result);
    return result;
  });
  pendingWrites.set(propertyId, write);
  void write.finally(() => {
    if (pendingWrites.get(propertyId) === write) pendingWrites.delete(propertyId);
  }).catch(() => {});
  return write;
}

export * from "./types";
