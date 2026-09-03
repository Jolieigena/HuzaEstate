"use client";

import { useSyncExternalStore } from "react";
import { BuildProjectService } from "@/lib/build/projectService";
import type { BuildProject } from "@/lib/build/types";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import type { RenovationProject } from "@/lib/renovate/types";

const EMPTY_BUILD: BuildProject[] = [];
const EMPTY_RENOVATE: RenovationProject[] = [];

/**
 * Admin-only "every project regardless of owner" views. The customer-facing
 * hooks in `lib/build/hooks.ts` / `lib/renovate/hooks.ts` intentionally
 * filter to one owner (the signed-in customer); oversight needs the full
 * set, so this reads the same services without that filter.
 */
export function useAllBuildProjects() {
  return useSyncExternalStore(BuildProjectService.subscribe, BuildProjectService.getSnapshot, () => EMPTY_BUILD);
}

export function useAllRenovationProjects() {
  return useSyncExternalStore(RenovationProjectService.subscribe, RenovationProjectService.getSnapshot, () => EMPTY_RENOVATE);
}
