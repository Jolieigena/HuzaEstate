"use client";

import { useEffect, useState } from "react";
import { ExecutionProjectService } from "./executionService";
import { ExecutionProject, ExecutionRole, ExecutionProjectStatus } from "./types";

export function useExecutionProjects(userId?: string, role: ExecutionRole = "customer") {
  const [projects, setProjects] = useState<ExecutionProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const update = () => {
      if (userId) {
        setProjects(ExecutionProjectService.getByUserId(userId, role));
      } else {
        setProjects(ExecutionProjectService.getAll());
      }
      setIsLoading(false);
    };

    update();
    const unsubscribe = ExecutionProjectService.subscribe(update);
    return () => { unsubscribe(); };
  }, [userId, role]);

  return { projects, isLoading };
}

export function useExecutionProject(id: string) {
  const [project, setProject] = useState<ExecutionProject | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const update = () => {
      setProject(ExecutionProjectService.getById(id));
      setIsLoading(false);
    };

    update();
    const unsubscribe = ExecutionProjectService.subscribe(update);
    return () => { unsubscribe(); };
  }, [id]);

  return { project, isLoading };
}

export function filterExecutionProjects(
  projects: ExecutionProject[],
  filter: "all" | "active" | "at_risk" | "handover" | "completed"
) {
  switch (filter) {
    case "active":
      return projects.filter((p) => p.status === "active" || p.status === "ready_to_start" || p.status === "setup_in_progress");
    case "at_risk":
      return projects.filter((p) => p.status === "at_risk" || p.status === "delayed" || p.status === "paused");
    case "handover":
      return projects.filter((p) => p.status === "substantial_completion" || p.status === "snagging" || p.status === "ready_for_handover");
    case "completed":
      return projects.filter((p) => p.status === "handed_over" || p.status === "archived");
    default:
      return projects;
  }
}
