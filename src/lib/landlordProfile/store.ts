// Singleton store engine for landlord profiles, mirroring
// src/lib/tenantApplications/store.ts.

import { LandlordProfileStorageService } from "./storage";
import type { LandlordProfile } from "./types";
import { DEFAULT_LANDLORD_PROFILE } from "./seed";

type Listener = () => void;

let profiles: LandlordProfile[] | null = null;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function ensureLoaded(): LandlordProfile[] {
  if (profiles !== null) return profiles;
  profiles = LandlordProfileStorageService.load();
  return profiles;
}

function persist() {
  if (profiles) LandlordProfileStorageService.save(profiles);
}

export const LandlordProfileStoreEngine = {
  getAll(): LandlordProfile[] {
    return ensureLoaded();
  },

  getByOwnerId(ownerId: string): LandlordProfile {
    return ensureLoaded().find((p) => p.ownerId === ownerId) ?? DEFAULT_LANDLORD_PROFILE;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  update(ownerId: string, patch: Partial<Omit<LandlordProfile, "ownerId">>): void {
    const current = ensureLoaded();
    const exists = current.some((p) => p.ownerId === ownerId);
    profiles = exists
      ? current.map((p) => (p.ownerId === ownerId ? { ...p, ...patch } : p))
      : [...current, { ...DEFAULT_LANDLORD_PROFILE, ...patch, ownerId }];
    persist();
    notifyListeners();
  },
};
