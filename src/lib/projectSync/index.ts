import { BuildProjectService } from "@/lib/build/projectService";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import type { BuildProject } from "@/lib/build/types";
import type { RenovationProject } from "@/lib/renovate/types";
import { ProjectSyncEngine } from "./engine";

/** The two engines, one for each kind of project. `onProblem` shows a message to the person (a full account, a project that cannot be saved). */
export function createProjectSyncs(onProblem: (message: string) => void) {
  return {
    build: new ProjectSyncEngine<BuildProject>("build", BuildProjectService, onProblem),
    renovate: new ProjectSyncEngine<RenovationProject>("renovate", RenovationProjectService, onProblem),
  };
}
