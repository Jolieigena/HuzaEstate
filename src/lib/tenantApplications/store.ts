// Singleton store engine for tenant applications, mirroring
// src/lib/sellerListings/store.ts and src/lib/tours/store.ts.

import { TenantApplicationsStorageService } from "./storage";
import type { ApplicationStage, TenantApplication } from "./types";

type Listener = () => void;

let applications: TenantApplication[] | null = null;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function ensureLoaded(): TenantApplication[] {
  if (applications !== null) return applications;
  applications = TenantApplicationsStorageService.load();
  return applications;
}

function persist() {
  if (applications) TenantApplicationsStorageService.save(applications);
}

export const TenantApplicationsStoreEngine = {
  getAll(): TenantApplication[] {
    return ensureLoaded();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Moves one application to a new stage — this is also what makes a
   *  listing's status real: setting an application to "approved" makes its
   *  property show "Pending" in Manager Portal, "leased" makes it show
   *  "Leased", automatically (see deriveListingStatus). */
  setStage(id: string, stage: ApplicationStage): void {
    const current = ensureLoaded();
    applications = current.map((a) => (a.id === id ? { ...a, stage, updatedAt: new Date().toISOString() } : a));
    persist();
    notifyListeners();
  },
};

/** A property's status is derived from its applications, not stored
 *  separately: if any application for it has been finalized ("leased"),
 *  the property is Leased; if any is "approved" (lease drawn up, awaiting
 *  finalization), it's Pending; otherwise there's no override and the
 *  caller's own default (still "Active" for a listing with no
 *  applications, or new/screening/rejected ones only) applies. */
export function deriveListingStatus(propertyId: string, applications: TenantApplication[]): "Leased" | "Pending" | undefined {
  const forProperty = applications.filter((a) => a.propertyId === propertyId);
  if (forProperty.some((a) => a.stage === "leased")) return "Leased";
  if (forProperty.some((a) => a.stage === "approved")) return "Pending";
  return undefined;
}
