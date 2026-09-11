"use client";

import { TourStoreEngine } from "./store";
import type { TourRecord, TourPhase } from "./types";
import type { Property } from "@/lib/data";
import type { PropertyPromptInput } from "./promptBuilder";

// Quick checks at first (generation sometimes finishes fast), then settle
// into a slower, steady cadence — polling a fixed 2s forever was wasteful
// for a process that can run for minutes. See docs.worldlabs.ai/api: no
// published "expected duration" to tune against precisely, so this is a
// reasonable backoff rather than a value read off their docs.
const POLL_SCHEDULE_MS = [2_000, 3_000, 5_000, 8_000];
const POLL_STEADY_STATE_MS = 10_000;
// Real generations in this app have taken well under this; a generation
// still pending after 10 minutes is treated as failed rather than polled
// forever.
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

interface TourApiResult {
  operationId: string;
  status: "pending" | "ready" | "failed";
  phase?: TourPhase;
  worldId?: string;
  viewerUrl?: string;
  thumbnailUrl?: string;
  panoUrl?: string;
  spzUrl?: string;
  rawSpzUrls?: Record<string, string>;
  /** Only present on the raw dev-test-panel path (no propertyId, so no
   *  storage pipeline runs) — the provider's own field name for the same
   *  data rawSpzUrls carries once a real property/pipeline is involved. */
  spzUrls?: Record<string, string>;
  colliderUrl?: string;
  caption?: string;
  semanticsMetadata?: { groundPlaneOffsetMeters?: number; metricScaleFactor?: number };
  error?: string;
  providerId?: string;
  providerMode?: "mock" | "live";
  prompt?: string;
}

interface TourApiResponse {
  scenes?: TourApiResult[];
  error?: string;
  providerId?: string;
  providerMode?: "mock" | "live";
  prompt?: string;
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
    return (await res.json()) as TourApiResponse;
  } catch {
    return { error: "Could not reach the tour service." };
  }
}

export async function attachExistingWorld(propertyId: string, worldId: string): Promise<TourApiResponse> {
  try {
    const res = await fetch('/api/tours/attach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId, worldId }),
    });
    const data = await res.json();
    return { scenes: [data] };
  } catch {
    return { error: 'Could not reach the tour service.' };
  }
}

export async function getWorldGenerationStatus(operationId: string, propertyId: string): Promise<TourApiResult | { error: string }> {
  try {
    const res = await fetch(`/api/tours/status?operationId=${encodeURIComponent(operationId)}&propertyId=${encodeURIComponent(propertyId)}`);
    return (await res.json()) as TourApiResult | { error: string };
  } catch {
    return { error: "Could not reach the tour service." };
  }
}

function applyResult(propertyId: string, operationId: string, data: TourApiResult) {
  TourStoreEngine.mutate((s) => {
    const existing = s.tours[propertyId];
    if (!existing) return;
    
    if (!existing.scenes) {
      existing.scenes = [];
    }
    
    const sceneIdx = existing.scenes.findIndex(sc => sc.operationId === operationId);
    if (sceneIdx >= 0) {
      const scene = existing.scenes[sceneIdx];
      scene.status = data.status;
      scene.phase = data.phase;
      scene.worldId = data.worldId;
      scene.viewerUrl = data.viewerUrl;
      scene.thumbnailUrl = data.thumbnailUrl;
      scene.panoUrl = data.panoUrl;
      scene.spzUrl = data.spzUrl;
      scene.rawSpzUrls = data.rawSpzUrls;
      scene.colliderUrl = data.colliderUrl;
      scene.caption = data.caption;
      scene.semanticsMetadata = data.semanticsMetadata;
      scene.error = data.error;
      scene.providerMode = data.providerMode;
      if (data.status !== "pending") scene.readyAt = new Date().toISOString();
    } else {
      // New scene
      existing.scenes.push({
        id: operationId,
        category: 'default',
        operationId,
        status: data.status,
        phase: data.phase,
        worldId: data.worldId,
        viewerUrl: data.viewerUrl,
        thumbnailUrl: data.thumbnailUrl,
        panoUrl: data.panoUrl,
        spzUrl: data.spzUrl,
        rawSpzUrls: data.rawSpzUrls,
        colliderUrl: data.colliderUrl,
        caption: data.caption,
        semanticsMetadata: data.semanticsMetadata,
        error: data.error,
        providerMode: data.providerMode,
        readyAt: data.status !== "pending" ? new Date().toISOString() : undefined,
      });
    }

    // Update overall status
    if (existing.scenes.every(sc => sc.status === 'ready')) {
      existing.status = 'ready';
      existing.phase = 'ready';
      existing.readyAt = new Date().toISOString();
    } else if (existing.scenes.some(sc => sc.status === 'failed')) {
      existing.status = 'failed';
      existing.phase = 'failed';
    }
    
    existing.updatedAt = new Date().toISOString();
  });
}

function markFailed(propertyId: string, error: string | undefined) {
  TourStoreEngine.mutate((s) => {
    const existing = s.tours[propertyId];
    if (!existing) return;
    existing.status = "failed";
    existing.phase = "failed";
    existing.error = error;
    existing.updatedAt = new Date().toISOString();
  });
}

async function pollUntilSettled(propertyId: string, operationId: string, startedAt: number, attempt = 0) {
  const currentState = TourStoreEngine.getStore().tours[propertyId];
  if (currentState?.status === "failed" && currentState?.error === "Cancelled by user") {
    return; // Stop polling if cancelled
  }

  if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
    markFailed(propertyId, "Timed out waiting for World Labs to finish generating this tour.");
    return;
  }

  const data = await getWorldGenerationStatus(operationId, propertyId);

  const stateAfterFetch = TourStoreEngine.getStore().tours[propertyId];
  if (stateAfterFetch?.status === "failed" && stateAfterFetch?.error === "Cancelled by user") {
    return;
  }

  if (!("status" in data)) {
    // If one scene fails, do we fail the whole tour?
    // Let's just update the scene to failed and let applyResult handle overall status.
    applyResult(propertyId, operationId, { operationId, status: 'failed', phase: 'failed', error: data.error } as any);
    return;
  }

  if (data.status === "pending") {
    const delay = POLL_SCHEDULE_MS[attempt] ?? POLL_STEADY_STATE_MS;
    setTimeout(() => pollUntilSettled(propertyId, operationId, startedAt, attempt + 1), delay);
    applyResult(propertyId, operationId, data);
    return;
  }

  applyResult(propertyId, operationId, data);
}

export const TourService = {
  getForProperty(propertyId: string): TourRecord | undefined {
    return TourStoreEngine.getStore().tours[propertyId];
  },

  async requestTour(property: Property): Promise<void> {
    const propertyId = property.id;
    const now = new Date().toISOString();

    TourStoreEngine.mutate((s) => {
      const existing = s.tours[propertyId];
      if (existing) {
        existing.status = "pending";
        existing.phase = "queued";
        existing.requestedAt = now;
        existing.updatedAt = now;
        existing.error = undefined;
        existing.scenes = []; // reset scenes for new request
      } else {
        s.tours[propertyId] = { id: `local_${propertyId}`, propertyId, status: "pending", phase: "queued", requestedAt: now, updatedAt: now, scenes: [] };
      }
    });

    const data = await generateWorldForProperty(property);

    if (data.error || !data.scenes || data.scenes.length === 0) {
      markFailed(propertyId, data.error || 'No scenes were generated.');
      return;
    }

    TourStoreEngine.mutate((s) => {
      const existing = s.tours[propertyId];
      if (!existing) return;
      existing.scenes = data.scenes as any;
      existing.providerMode = data.providerMode;
      existing.updatedAt = new Date().toISOString();
      existing.phase = "generating";
    });

    for (const scene of data.scenes) {
      if (scene.status === "pending" && scene.operationId) {
        pollUntilSettled(propertyId, scene.operationId, Date.now());
      } else if (scene.operationId) {
        applyResult(propertyId, scene.operationId, scene);
      }
    }
  },

  retry(property: Property): Promise<void> {
    return TourService.requestTour(property);
  },

  async attachExisting(propertyId: string, worldId: string): Promise<void> {
    const now = new Date().toISOString();
    TourStoreEngine.mutate((s) => {
      const existing = s.tours[propertyId];
      if (existing) {
        existing.status = 'pending';
        existing.phase = 'downloading_assets';
        existing.updatedAt = now;
        existing.error = undefined;
      } else {
        s.tours[propertyId] = { id: `local_${propertyId}`, propertyId, status: 'pending', phase: 'downloading_assets', requestedAt: now, updatedAt: now, scenes: [] };
      }
    });

    const data = await attachExistingWorld(propertyId, worldId);
    if (data.error || !data.scenes || data.scenes.length === 0) {
      markFailed(propertyId, data.error);
      return;
    }
    
    const scene = data.scenes[0];
    if (scene.operationId) {
      applyResult(propertyId, scene.operationId, scene);
    }
  },

  cancelTour(propertyId: string): void {
    TourStoreEngine.mutate((s) => {
      const existing = s.tours[propertyId];
      if (existing && existing.status === 'pending') {
        existing.status = 'failed';
        existing.phase = 'failed';
        existing.error = 'Cancelled by user';
        existing.updatedAt = new Date().toISOString();
      }
    });
  },
};
