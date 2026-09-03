"use client";

import { createContext, useContext, ReactNode } from "react";
import { BuildProject } from "@/lib/build/types";

const BuildProjectContext = createContext<BuildProject | undefined>(undefined);

export function BuildProjectProvider({ project, children }: { project: BuildProject; children: ReactNode }) {
  return <BuildProjectContext.Provider value={project}>{children}</BuildProjectContext.Provider>;
}

/** Access the current project inside any `/studio/build/[projectId]/*` page. */
export function useBuildProjectContext(): BuildProject {
  const ctx = useContext(BuildProjectContext);
  if (!ctx) throw new Error("useBuildProjectContext must be used within a Build project route");
  return ctx;
}
