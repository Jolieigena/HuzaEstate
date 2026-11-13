"use client";

import { Concept } from "@/lib/build/types";
import { BuildProjectService } from "@/lib/build/projectService";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";
import { designWithAi } from "@/lib/build/aiApi";
import { conceptFromAiFloors } from "@/lib/build/conceptGenerator";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import EditPanel from "@/components/shared/EditPanel";
import type { Attachment } from "@/lib/ai/attachments";

const SUGGESTED_REQUESTS = [
  "Make the kitchen larger",
  "Move the guest bedroom downstairs",
  "Add a home office",
  "Add a bathroom upstairs",
  "Make the living room bigger",
  "Add a bigger staircase",
];

/** "Edit with AI" for the floor plan: a pane on the right, so the plan stays in view while the person says what to change. */
export default function RefineDrawer({ projectId, concept, open, onClose }: { projectId: string; concept: Concept | null; open: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const { token } = useAuth();
  const project = useBuildProjectContext();

  if (!concept) return null;

  const apply = async (request: string, attachments: Attachment[]): Promise<string | null> => {
    if (!token) return "Please sign in again.";
    const outcome = await designWithAi(token, project.brief, { request, floors: concept.floors, attachments });
    if (!outcome.ok) return outcome.error;
    // The figures (area, rooms) are worked out again from the new plan.
    const { metrics } = conceptFromAiFloors(project.brief, outcome.floors);
    BuildProjectService.refineConcept(projectId, concept.id, request, `Changed with AI: "${request}"`, { ...metrics, sustainabilityScore: concept.metrics.sustainabilityScore, efficiencyScore: concept.metrics.efficiencyScore }, outcome.floors);
    showToast("Your design was changed. It is saved as a new version.");
    return null;
  };

  return <EditPanel storageKey={`build-plan:${projectId}:${concept.id}`} open={open} onClose={onClose} suggestions={SUGGESTED_REQUESTS} placeholder="e.g. Make the kitchen larger and add a home office" onSubmit={apply} />;
}
