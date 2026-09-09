"use client";

import { TourStoreEngine } from "./store";
import type { TourRecord } from "./types";
import type { Property } from "@/lib/data";
import type { PropertyPromptInput } from "./promptBuilder";

const POLL_INTERVAL_MS = 2_000;

interface TourApiResult {
  operationId: string;
  status: "pending" | "ready" | "failed";
  worldId?: string;
  viewerUrl?: string;
  thumbnailUrl?: string;
  panoUrl?: string;
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
 * property fields are sent — the server (src/app/api/tours/generate)
 * builds the actual World Labs prompt itself; this function has no way to
 * inject an arbitrary prompt (that's the separate dev-only test panel).
 */
export async function generateWorldForProperty(property: Property): Promise<TourApiResponse> {
  try {
    const res = await fetch("/api/tours/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property: toPromptInput(property) }),
    });
    return (await res.json()) as TourApiResponse;
  } catch {
    return { error: "Could not reach the tour service." };
  }
}

/** Polls World Labs (via our server) for the current state of a generation.
 *  propertyId is included so the server can cache the panorama under the
 *  right key once the tour is ready (see /api/tours/status). */
export async function getWorldGenerationStatus(operationId: string, propertyId: string): Promise<TourApiResponse> {
  try {
    const res = await fetch(`/api/tours/status?operationId=${encodeURIComponent(operationId)}&propertyId=${encodeURIComponent(propertyId)}`);
    return (await res.json()) as TourApiResponse;
  } catch {
    return { error: "Could not reach the tour service." };
  }
}

async function pollUntilSettled(propertyId: string, operationId: string) {
  const data = await getWorldGenerationStatus(operationId, propertyId);

  if (!("status" in data)) {
    TourStoreEngine.mutate((s) => {
      const existing = s.tours[propertyId];
      if (existing) {
        existing.status = "failed";
        existing.error = data.error;
      }
    });
    return;
  }

  if (data.status === "pending") {
    setTimeout(() => pollUntilSettled(propertyId, operationId), POLL_INTERVAL_MS);
    return;
  }

  TourStoreEngine.mutate((s) => {
    const existing = s.tours[propertyId];
    if (!existing) return;
    existing.status = data.status;
    existing.worldId = data.worldId;
    existing.viewerUrl = data.viewerUrl;
    existing.thumbnailUrl = data.thumbnailUrl;
    existing.panoUrl = data.panoUrl;
    existing.error = data.error;
    existing.providerMode = data.providerMode;
    existing.readyAt = new Date().toISOString();
  });
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

    TourStoreEngine.mutate((s) => {
      s.tours[propertyId] = { propertyId, status: "pending", requestedAt: new Date().toISOString() };
    });

    const data = await generateWorldForProperty(property);

    if (!("operationId" in data)) {
      TourStoreEngine.mutate((s) => {
        const existing = s.tours[propertyId];
        if (existing) {
          existing.status = "failed";
          existing.error = data.error;
        }
      });
      return;
    }

    TourStoreEngine.mutate((s) => {
      const existing = s.tours[propertyId];
      if (!existing) return;
      existing.operationId = data.operationId;
      existing.providerMode = data.providerMode;
      if (data.status !== "pending") {
        existing.status = data.status;
        existing.worldId = data.worldId;
        existing.viewerUrl = data.viewerUrl;
        existing.thumbnailUrl = data.thumbnailUrl;
        existing.panoUrl = data.panoUrl;
        existing.readyAt = new Date().toISOString();
      }
    });

    if (data.status === "pending") {
      pollUntilSettled(propertyId, data.operationId);
    }
  },

  retry(property: Property): Promise<void> {
    return TourService.requestTour(property);
  },
};
