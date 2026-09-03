"use client";

import { useMemo, useSyncExternalStore } from "react";
import { RenovationProjectService, DEMO_OWNER_ID } from "./projectService";

const EMPTY_PROJECTS: ReturnType<typeof RenovationProjectService.getSnapshot> = [];

export function useRenovationProjects(ownerId: string = DEMO_OWNER_ID) {
  const all = useSyncExternalStore(RenovationProjectService.subscribe, RenovationProjectService.getSnapshot, () => EMPTY_PROJECTS);
  const projects = useMemo(() => all.filter((p) => p.ownerId === ownerId), [all, ownerId]);
  return { projects, ready: true };
}

export function useRenovationProject(id: string | undefined) {
  const all = useSyncExternalStore(RenovationProjectService.subscribe, RenovationProjectService.getSnapshot, () => EMPTY_PROJECTS);
  const project = useMemo(() => (id ? all.find((p) => p.id === id) : undefined), [all, id]);
  return { project, ready: true };
}
