import type { RenovationProject } from "./types";

const PROJECTS_KEY = "huzaestate_renovate_projects_v1";
const SEEDED_FLAG_KEY = "huzaestate_renovate_seeded_v1";

/**
 * Thin, defensive localStorage wrapper for Renovation projects. This is a
 * frontend prototype: there is no real backend, so everything lives in the
 * browser. All reads/writes are wrapped in try/catch because localStorage
 * can be unavailable (private browsing, storage quota, disabled by policy)
 * or hold corrupted JSON from a previous version of this prototype.
 */
export const RenovationStorageService = {
  isAvailable(): boolean {
    try {
      const testKey = "__huzaestate_renovate_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  loadProjects(): RenovationProject[] {
    try {
      const raw = window.localStorage.getItem(PROJECTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as RenovationProject[];
    } catch {
      return [];
    }
  },

  saveProjects(projects: RenovationProject[]): boolean {
    try {
      window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      return true;
    } catch {
      return false;
    }
  },

  hasSeeded(): boolean {
    try {
      return window.localStorage.getItem(SEEDED_FLAG_KEY) === "true";
    } catch {
      return true; // fail safe: never reseed if we can't tell
    }
  },

  markSeeded(): void {
    try {
      window.localStorage.setItem(SEEDED_FLAG_KEY, "true");
    } catch {
      // ignore — worst case we try seeding again next load, which is guarded
      // by loadProjects().length === 0 anyway
    }
  },
};
