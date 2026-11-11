"use client";

import { useEffect, useRef, useState } from "react";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { generateConcept, ConceptGenerationInput } from "@/lib/renovate/conceptGenerator";
import { GENERATION_STAGES, RENOVATION_AREA_LABELS, RenovationProject, SAFETY_CONCERN_LABELS, SafetyConcernKey } from "@/lib/renovate/types";
import AiProgress from "@/components/shared/AiProgress";
import { useToast } from "@/lib/toast-context";
import { useAuth } from "@/lib/auth-context";
import { redesignRooms } from "@/lib/renovate/redesign";

const STAGE_DELAY_MS = 900;

export function buildGenerationInput(project: RenovationProject): ConceptGenerationInput {
  const safetyFlagLabels = (Object.entries(project.assessment.safety.concerns) as [SafetyConcernKey, string][])
    .filter(([, v]) => v === "yes" || v === "unknown")
    .map(([key]) => SAFETY_CONCERN_LABELS[key]);
  return {
    areas: project.assessment.areas,
    keepRemoveChange: project.assessment.keepRemoveChange,
    primaryStyle: project.assessment.style.primaryStyle,
    targetBudget: project.assessment.budgetTimeline.targetBudget,
    minBudget: project.assessment.budgetTimeline.minBudget,
    maxBudget: project.assessment.budgetTimeline.maxBudget,
    propertyAreaSqm: project.property.approxAreaSqm,
    safetyFlagLabels,
    anyStructuralChangeExpected: project.assessment.areas.some((a) => a.structuralChangesExpected === true || a.structuralChangesExpected === "unknown"),
  };
}

export default function GenerationProgress({ project }: { project: RenovationProject }) {
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
      // The AI starts renovating the photo of each room at once, while the steps play.
      const drawing = token ? redesignRooms(token, project) : Promise.resolve(null);
      const startIndex = Math.max(0, project.generation.currentStageIndex);
      for (let i = startIndex; i < GENERATION_STAGES.length; i++) {
        if (cancelledRef.current) return;
        await new Promise((resolve) => setTimeout(resolve, STAGE_DELAY_MS));
        if (cancelledRef.current) return;
        RenovationProjectService.advanceGenerationStage(project.id, GENERATION_STAGES[i].key, i);
      }
      if (cancelledRef.current) return;
      const concept = generateConcept("balanced_transformation", buildGenerationInput(project));
      concept.name = "Your redesign";
      const outcome = await drawing;
      if (cancelledRef.current) return;
      if (outcome && outcome.views.length > 0) {
        const first = outcome.views[0];
        concept.beforeImage = first.beforeImage;
        concept.afterImage = first.afterImage;
        concept.areaViews = outcome.views;
      }
      RenovationProjectService.completeGeneration(project.id, [concept]);
      showToast("Your redesign is ready.");
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
    RenovationProjectService.cancelGeneration(project.id);
    showToast("Generation cancelled. Your assessment was kept.", "info");
  };

  if (project.generation.status === "failed") {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Generation failed</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Something went wrong preparing your redesign. Your brief was kept — try again.</p>
        <button
          type="button"
          onClick={() => RenovationProjectService.startGeneration(project.id)}
          className="bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          Retry Generation
        </button>
      </div>
    );
  }

  const rooms = project.assessment.areas.slice(0, 4).map((area) => ({
    src: project.uploads.photos.find((p) => p.relatedAreaId === area.id)?.previewUrl,
    label: area.customLabel || RENOVATION_AREA_LABELS[area.areaKey],
  }));
  const tiles = rooms.some((r) => r.src) ? rooms.filter((r) => r.src) : [];

  return (
    <AiProgress
      title="Designing your renovation"
      stages={GENERATION_STAGES}
      completedKeys={project.generation.completedStageKeys}
      elapsedSec={elapsedSec}
      tiles={tiles}
      onCancel={handleCancel}
    />
  );
}
