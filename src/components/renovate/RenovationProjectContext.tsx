"use client";

import { createContext, useContext, ReactNode } from "react";
import { RenovationProject } from "@/lib/renovate/types";

const RenovationProjectContext = createContext<RenovationProject | undefined>(undefined);

export function RenovationProjectProvider({ project, children }: { project: RenovationProject; children: ReactNode }) {
  return <RenovationProjectContext.Provider value={project}>{children}</RenovationProjectContext.Provider>;
}

/** Access the current project inside any `/studio/renovate/[projectId]/*` page. */
export function useRenovationProjectContext(): RenovationProject {
  const ctx = useContext(RenovationProjectContext);
  if (!ctx) throw new Error("useRenovationProjectContext must be used within a Renovate project route");
  return ctx;
}
