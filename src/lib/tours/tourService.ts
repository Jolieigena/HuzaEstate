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

type TourApiResponse = TourApiResult | { error: string };

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

/**
 * Kicks off generation for a property. Only whitelisted, structured
 * property fields (plus the property's own photos) are sent — the server
 * (src/app/api/tours/generate) builds the actual World Labs prompt itself,
 * and decides there whether enough categorized exterior angles exist to
 * generate from multiple photos rather than just the cover shot; this
 * function has no way to inject an arbitrary prompt (that's the separate
 * dev-only test panel).
 */
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

/** Polls World Labs (via our server) for the current state of a generation.
 *  propertyId is included so the server can download+store the finished
 *  assets under the right property and persist the record — see
 *  /api/tours/status. */
export async function getWorldGenerationStatus(operationId: string, propertyId: string): Promise<TourApiResponse> {
  try {
    const res = await fetch(`/api/tours/status?operationId=${encodeURIComponent(operationId)}&propertyId=${encodeURIComponent(propertyId)}`);
    return (await res.json()) as TourApiResponse;
  } catch {
    return { error: "Could not reach the tour service." };
  }
}

function applyResult(propertyId: string, data: TourApiResult) {
  TourStoreEngine.mutate((s) => {
    const existing = s.tours[propertyId];
    if (!existing) return;
    existing.status = data.status;
    existing.phase = data.phase;
    existing.worldId = data.worldId;
    existing.viewerUrl = data.viewerUrl;
    existing.thumbnailUrl = data.thumbnailUrl;
    existing.panoUrl = data.panoUrl;
    existing.spzUrl = data.spzUrl;
    existing.rawSpzUrls = data.rawSpzUrls;
    existing.colliderUrl = data.colliderUrl;
    existing.caption = data.caption;
    existing.semanticsMetadata = data.semanticsMetadata;
    existing.error = data.error;
    existing.providerMode = data.providerMode;
    existing.updatedAt = new Date().toISOString();
    if (data.status !== "pending") existing.readyAt = new Date().toISOString();
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
  if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
    markFailed(propertyId, "Timed out waiting for World Labs to finish generating this tour.");
    return;
  }

  const data = await getWorldGenerationStatus(operationId, propertyId);

  if (!("status" in data)) {
    markFailed(propertyId, data.error);
    return;
  }

  if (data.status === "pending") {
    const delay = POLL_SCHEDULE_MS[attempt] ?? POLL_STEADY_STATE_MS;
    setTimeout(() => pollUntilSettled(propertyId, operationId, startedAt, attempt + 1), delay);
    applyResult(propertyId, data);
    return;
  }

  applyResult(propertyId, data);
}

/** Store-integrated orchestrator the UI actually calls: marks the property
 *  pending, starts generation, and drives polling until it settles. Built
 *  on generateWorldForProperty/getWorldGenerationStatus above. */
export const TourService = {
  getForProperty(propertyId: string): TourRecord | undefined {
    return TourStoreEngine.getStore().tours[propertyId];
  },

  async requestTour(property: Property): Promise<void> {
    const propertyId = property.id;
    const now = new Date().toISOString();

    TourStoreEngine.mutate((s) => {
      s.tours[propertyId] = { id: `local_${propertyId}`, propertyId, status: "pending", phase: "queued", requestedAt: now, updatedAt: now };
    });

    const data = await generateWorldForProperty(property);

    if (!("operationId" in data)) {
      markFailed(propertyId, data.error);
      return;
    }

    TourStoreEngine.mutate((s) => {
      const existing = s.tours[propertyId];
      if (!existing) return;
      existing.operationId = data.operationId;
      existing.providerMode = data.providerMode;
      existing.updatedAt = new Date().toISOString();
    });
    if (data.status !== "pending") {
      applyResult(propertyId, data);
    } else {
      TourStoreEngine.mutate((s) => {
        const existing = s.tours[propertyId];
        if (existing) existing.phase = "generating";
      });
    }

    if (data.status === "pending") {
      pollUntilSettled(propertyId, data.operationId, Date.now());
    }
  },

  retry(property: Property): Promise<void> {
    return TourService.requestTour(property);
  },
};
