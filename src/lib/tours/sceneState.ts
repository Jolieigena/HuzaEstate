import type { TourRecord, TourScene } from "./types";

/** Normalize old single-scene records at the boundary without rewriting assets. */
export function scenesForRecord(record: TourRecord): TourScene[] {
  if (record.scenes?.length) return record.scenes;
  if (!record.operationId && !record.spzUrl && !record.panoUrl && !record.viewerUrl) return [];
  return [{
    id: record.operationId ?? record.id,
    category: "default",
    ...sceneFields(record),
    status: record.status,
  }];
}

/** Pick only scene fields: a record's identity and timestamps belong to the tour. */
export function sceneFields(value: Partial<TourScene>): Partial<TourScene> {
  const keys = ["status", "phase", "operationId", "worldId", "viewerUrl", "thumbnailUrl", "panoUrl", "spzUrl", "rawSpzUrls", "colliderUrl", "caption", "semanticsMetadata", "error", "providerMode", "readyAt"] as const;
  return Object.fromEntries(keys.filter((key) => key in value).map((key) => [key, value[key]]));
}

export function summarizeScenes(scenes: TourScene[]): Pick<TourRecord, "status" | "phase" | "error" | "readyAt"> {
  const pending = scenes.filter((scene) => scene.status === "pending");
  if (pending.length || !scenes.length) {
    const phase = pending.find((scene) => scene.phase === "storing_assets" || scene.phase === "downloading_assets")?.phase;
    return { status: "pending", phase: phase ?? "generating", error: undefined, readyAt: undefined };
  }
  const failed = scenes.find((scene) => scene.status === "failed");
  if (failed) return { status: "failed", phase: "failed", error: failed.error, readyAt: undefined };
  return { status: "ready", phase: "ready", error: undefined, readyAt: scenes.map((scene) => scene.readyAt).filter((value): value is string => Boolean(value)).sort().at(-1) };
}

/** Keep compatibility fields aligned with the first scene for older consumers. */
export function withSceneState(record: TourRecord, scenes: TourScene[]): TourRecord {
  const primary = scenes[0];
  return {
    ...record,
    ...(primary ? sceneFields(primary) : {}),
    scenes,
    ...summarizeScenes(scenes),
  };
}
