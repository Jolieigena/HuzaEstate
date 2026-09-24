import type { BuildProject } from "./types";
import { canUseBrowserStorage, readBrowserFlag, readBrowserJson, writeBrowserFlag, writeBrowserJson } from "@/lib/storage/browserStorage";

const PROJECTS_KEY = "huzaestate_build_projects_v2";
const SEEDED_FLAG_KEY = "huzaestate_build_seeded_v2";

/**
 * Thin, defensive localStorage wrapper for Build projects. This is a frontend
 * prototype: there is no real backend, so everything lives in the browser.
 * All reads/writes are wrapped in try/catch because localStorage can be
 * unavailable (private browsing, storage quota, disabled by policy) or hold
 * corrupted JSON from a previous version of this prototype.
 */
export const BuildStorageService = {
  isAvailable(): boolean {
    return canUseBrowserStorage("__huzaestate_build_test__");
  },

  loadProjects(): BuildProject[] {
    const projects = readBrowserJson<unknown>(PROJECTS_KEY, []);
    return Array.isArray(projects) ? (projects as BuildProject[]) : [];
  },

  saveProjects(projects: BuildProject[]): boolean {
    return writeBrowserJson(PROJECTS_KEY, projects);
  },

  hasSeeded(): boolean {
    return readBrowserFlag(SEEDED_FLAG_KEY, true);
  },

  markSeeded(): void {
    writeBrowserFlag(SEEDED_FLAG_KEY);
  },
};
