"use client";

import { useEffect, useRef, useState } from "react";
import { BuildProjectService } from "@/lib/build/projectService";
import { conceptFromAiFloors, generateAllConcepts } from "@/lib/build/conceptGenerator";
import { designWithAi } from "@/lib/build/aiApi";
import { useAuth } from "@/lib/auth-context";
import { BuildProject, GENERATION_STAGES } from "@/lib/build/types";
import { useToast } from "@/lib/toast-context";
import AiProgress from "@/components/shared/AiProgress";

const STAGE_DELAY_MS = 900;

export default function GenerationProgress({ project }: { project: BuildProject }) {
  const { showToast } = useToast();
  const { token } = useAuth();
  const [elapsedSec, setElapsedSec] = useState(0);
  const cancelledRef = useRef(false);
  const runningRef = useRef(false);

  useEffect(() => {
    if (project.generation.status !== "in_progress" || runningRef.current) return;
    runningRef.current = true;
    cancelledRef.current = false;

    const run = async () => {
      // The AI starts drawing at once, while the steps below play.
      const drawing = token ? designWithAi(token, project.brief) : Promise.resolve(null);
      const startIndex = Math.max(0, project.generation.currentStageIndex);
      for (let i = startIndex; i < GENERATION_STAGES.length; i++) {
        if (cancelledRef.current) return;
        await new Promise((resolve) => setTimeout(resolve, STAGE_DELAY_MS));
        if (cancelledRef.current) return;
        BuildProjectService.advanceGenerationStage(project.id, GENERATION_STAGES[i].key, i);
      }
      if (cancelledRef.current) return;
      const drawn = await drawing;
      if (cancelledRef.current) return;
      const concepts = drawn?.ok ? [conceptFromAiFloors(project.brief, drawn.floors)] : generateAllConcepts(project.brief);
      BuildProjectService.completeGeneration(project.id, concepts);
      showToast("Your design is ready.");
    };

    run().finally(() => {
      runningRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, project.generation.status, token]);

  useEffect(() => {
    if (project.generation.status !== "in_progress") return;
    const startedAt = project.generation.startedAt ? new Date(project.generation.startedAt).getTime() : Date.now();
    const interval = setInterval(() => setElapsedSec(Math.round((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [project.generation.status, project.generation.startedAt]);

  const handleCancel = () => {
    cancelledRef.current = true;
    BuildProjectService.cancelGeneration(project.id);
    showToast("Generation cancelled. Your brief was kept.", "info");
  };

  return (
    <AiProgress
      title="Generating your design"
      stages={GENERATION_STAGES}
      completedKeys={project.generation.completedStageKeys}
      elapsedSec={elapsedSec}
      tiles={[]}
      onCancel={handleCancel}
    />
  );
}
