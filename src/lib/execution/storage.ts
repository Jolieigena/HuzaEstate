import type { ExecutionProject } from "./types";

const PROJECTS_KEY = "huzaestate_execution_projects_v1";
const SEEDED_FLAG_KEY = "huzaestate_execution_seeded_v1";

/**
 * Defensive localStorage wrapper for Execution projects. Frontend prototype
 * storage matching Build & Renovate modules.
 */
export const ExecutionStorageService = {
  isAvailable(): boolean {
    try {
      const testKey = "__huzaestate_execution_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  loadProjects(): ExecutionProject[] {
    try {
      const raw = window.localStorage.getItem(PROJECTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as ExecutionProject[];
    } catch {
      return [];
    }
  },

  saveProjects(projects: ExecutionProject[]): boolean {
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
      // ignore
    }
  },
};
