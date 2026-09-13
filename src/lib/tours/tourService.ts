"use client";

import { TourStoreEngine } from "./store";
import { newId } from "./ids";
import { sceneFields, scenesForRecord, withSceneState } from "./sceneState";
import type { TourRecord, TourScene } from "./types";
import type { Property } from "@/lib/properties/types";
import type { PropertyPromptInput } from "./promptBuilder";

const POLL_SCHEDULE_MS = [2_000, 3_000, 5_000, 8_000];
const POLL_STEADY_STATE_MS = 10_000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

interface TourApiResult extends Omit<TourScene, "id" | "category"> {
  id?: string;
  category?: string;
  spzUrls?: Record<string, string>;
  providerId?: string;
}

interface TourApiResponse {
  scenes?: TourApiResult[];
  error?: string;
  providerId?: string;
  providerMode?: "mock" | "live";
  prompt?: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isResult(value: unknown): value is TourApiResult {
  return isObject(value) && ["pending", "ready", "failed"].includes(String(value.status));
}

function errorMessage(value: unknown, fallback: string): string {
  return isObject(value) && typeof value.error === "string" ? value.error : fallback;
}

function toPromptInput(property: Property): PropertyPromptInput {
  return {
    propertyType: property.propertyType,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    location: property.location,
    city: property.city,
    description: property.description,
  };
}

export async function generateWorldForProperty(property: Property): Promise<TourApiResponse> {
  try {
    const res = await fetch("/api/tours/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: property.id, property: toPromptInput(property), imageUrl: property.imageUrl, photos: property.photos }),
    });
    const data: unknown = await res.json();
    if (!res.ok || !isObject(data) || !Array.isArray(data.scenes) || !data.scenes.every(isResult)) {
      return { error: errorMessage(data, "The tour service returned an invalid generation response.") };
    }
    return data as TourApiResponse;
  } catch {
    return { error: "Could not reach the tour service." };
  }
}

export async function attachExistingWorld(propertyId: string, worldId: string): Promise<TourApiResponse> {
  try {
    const res = await fetch("/api/tours/attach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, worldId }),
    });
    const data: unknown = await res.json();
    if (!res.ok || !isResult(data)) {
      return { error: errorMessage(data, "The tour service returned an invalid attachment response.") };
    }
    return { scenes: [data], providerMode: data.providerMode };
  } catch {
    return { error: "Could not reach the tour service." };
  }
}

export async function getWorldGenerationStatus(operationId: string, propertyId: string): Promise<TourApiResult | { error: string }> {
  try {
    const res = await fetch(`/api/tours/status?operationId=${encodeURIComponent(operationId)}&propertyId=${encodeURIComponent(propertyId)}`);
    const data: unknown = await res.json();
    if (!res.ok || !isResult(data)) {
      return { error: errorMessage(data, "The tour service returned an invalid status response.") };
    }
    return data;
  } catch {
    return { error: "Could not reach the tour service." };
  }
}

// A token identifies the whole local request, including its record lookup and
// polling. Cancellation/retry invalidates every outstanding callback from it.
const activeRequests = new Map<string, symbol>();
const isCurrent = (propertyId: string, token: symbol) => activeRequests.get(propertyId) === token;

function normalizeScene(result: TourApiResult): TourScene {
  const scene: TourScene = { ...result, id: result.id ?? result.operationId ?? newId("scene"), category: result.category ?? "default" };
  if (scene.status === "pending" && !scene.operationId) {
    return { ...scene, status: "failed", phase: "failed", error: "The tour service did not return a generation operation." };
  }
  if (scene.status === "ready") scene.readyAt ??= new Date().toISOString();
  return scene;
}

function markFailed(propertyId: string, token: symbol, error: string) {
  if (!isCurrent(propertyId, token)) return;
  TourStoreEngine.mutate((store) => {
    const current = store.tours[propertyId];
    if (!current) return;
    current.scenes = current.scenes.map((scene) => scene.status === "pending" ? { ...scene, status: "failed", phase: "failed", error } : scene);
    current.status = "failed";
    current.phase = "failed";
    current.error = error;
    current.updatedAt = new Date().toISOString();
  });
  activeRequests.delete(propertyId);
}

function applyResult(propertyId: string, token: symbol, operationId: string, result: TourApiResult) {
  if (!isCurrent(propertyId, token)) return;
  TourStoreEngine.mutate((store) => {
    const current = store.tours[propertyId];
    if (!current) return;
    const scenes = current.scenes.map((scene) => scene.operationId === operationId
      ? normalizeScene({ ...scene, ...sceneFields(result), operationId })
      : scene);
    store.tours[propertyId] = withSceneState({ ...current, updatedAt: new Date().toISOString() }, scenes);
    if (scenes.every((scene) => scene.status !== "pending")) activeRequests.delete(propertyId);
  });
}

async function pollUntilSettled(propertyId: string, token: symbol, operationId: string, startedAt: number, attempt = 0): Promise<void> {
  if (!isCurrent(propertyId, token)) return;
  if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
    applyResult(propertyId, token, operationId, { operationId, status: "failed", phase: "failed", error: "Timed out waiting for World Labs to finish generating this tour." });
    return;
  }
  const data = await getWorldGenerationStatus(operationId, propertyId);
  if (!isCurrent(propertyId, token)) return;
  const result: TourApiResult = "status" in data ? data : { operationId, status: "failed", phase: "failed", error: data.error };
  applyResult(propertyId, token, operationId, result);
  if (result.status === "pending" && isCurrent(propertyId, token)) {
    const delay = POLL_SCHEDULE_MS[attempt] ?? POLL_STEADY_STATE_MS;
    setTimeout(() => { void pollUntilSettled(propertyId, token, operationId, startedAt, attempt + 1); }, delay);
  }
}

function applyScenes(propertyId: string, token: symbol, data: TourApiResponse, replace: boolean) {
  if (!isCurrent(propertyId, token)) return;
  if (data.error || !data.scenes?.length) {
    markFailed(propertyId, token, data.error ?? "No scenes were generated.");
    return;
  }
  const results = data.scenes.map(normalizeScene);
  TourStoreEngine.mutate((store) => {
    const current = store.tours[propertyId];
    if (!current) return;
    const scenes = replace ? results : [
      ...current.scenes.filter((scene) => !results.some((result) => result.operationId === scene.operationId)),
      ...results,
    ];
    store.tours[propertyId] = withSceneState({ ...current, providerMode: data.providerMode ?? current.providerMode, updatedAt: new Date().toISOString() }, scenes);
    if (scenes.every((scene) => scene.status !== "pending")) activeRequests.delete(propertyId);
  });
  for (const scene of results) {
    if (scene.status === "pending" && scene.operationId) {
      void pollUntilSettled(propertyId, token, scene.operationId, Date.now());
    }
  }
}

function beginRequest(propertyId: string, phase: "queued" | "downloading_assets"): symbol {
  const token = Symbol(propertyId);
  activeRequests.set(propertyId, token);
  const now = new Date().toISOString();
  TourStoreEngine.mutate((store) => {
    const existing = store.tours[propertyId];
    store.tours[propertyId] = {
      ...existing,
      id: existing?.id ?? `local_${propertyId}`,
      propertyId, status: "pending", phase, error: undefined,
      requestedAt: now, updatedAt: now,
      scenes: existing ? scenesForRecord(existing) : [],
    };
  });
  return token;
}

export const TourService = {
  getForProperty(propertyId: string): TourRecord | undefined {
    return TourStoreEngine.getStore().tours[propertyId];
  },

  async requestTour(property: Property): Promise<void> {
    const propertyId = property.id;
    if (activeRequests.has(propertyId)) return;
    const token = beginRequest(propertyId, "queued");
    try {
      const response = await fetch(`/api/tours/record?propertyId=${encodeURIComponent(propertyId)}`);
      if (!isCurrent(propertyId, token)) return;
      if (response.ok) {
        const record = await response.json() as TourRecord;
        if (!isCurrent(propertyId, token)) return;
        const scenes = scenesForRecord(record);
        if (scenes.some((scene) => scene.status === "pending" && scene.operationId)) {
          applyScenes(propertyId, token, { scenes, providerMode: record.providerMode }, true);
          return;
        }
      } else if (response.status !== 404) {
        markFailed(propertyId, token, "Could not check for an existing tour. Please retry.");
        return;
      }
    } catch {
      markFailed(propertyId, token, "Could not check for an existing tour. Please retry.");
      return;
    }
    const data = await generateWorldForProperty(property);
    applyScenes(propertyId, token, data, true);
  },

  retry(property: Property): Promise<void> {
    return TourService.requestTour(property);
  },

  async attachExisting(propertyId: string, worldId: string): Promise<void> {
    const token = beginRequest(propertyId, "downloading_assets");
    const data = await attachExistingWorld(propertyId, worldId);
    applyScenes(propertyId, token, data, false);
  },

  cancelTour(propertyId: string): void {
    const token = activeRequests.get(propertyId);
    if (token) markFailed(propertyId, token, "Cancelled by user");
  },
};
