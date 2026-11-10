"use client";

import { useEffect, useRef, useState } from "react";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { generateAllConcepts, ConceptGenerationInput } from "@/lib/renovate/conceptGenerator";
import { GENERATION_STAGES, RenovationProject, SAFETY_CONCERN_LABELS, SafetyConcernKey } from "@/lib/renovate/types";
import { useToast } from "@/lib/toast-context";
import { useAuth } from "@/lib/auth-context";
import { previewRenovation, RenovateRoom } from "@/lib/renovate/aiPreview";

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

const ROOM_FOR_AREA: Record<string, RenovateRoom> = {
  kitchen: "kitchen",
  bathroom: "bathroom",
  living_room: "living-room",
  dining_room: "dining-room",
  bedroom: "bedroom",
  home_office: "home-office",
  exterior_facade: "exterior",
  roofing: "exterior",
  balcony: "exterior",
  terrace: "exterior",
  garage: "exterior",
  garden: "garden",
  landscaping: "garden",
};

const DIRECTION_WISH: Record<string, string> = {
  essential_refresh: "A light refresh: keep the furniture and layout, change paint, finishes and small details so it feels new on a small budget.",
  balanced_transformation: "A balanced renovation: new finishes, lighting and some new furniture, with the same layout.",
  premium_reconfiguration: "A premium renovation: high-end materials, built-in storage, statement lighting and designer furniture.",
};

/** A small copy of the AI's picture (a JPEG of at most 1100 px), so three of them still fit with the project in the browser. */
function shrinkPicture(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, 1100 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
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
      // With a photo of the room, the AI starts renovating it at once, one picture for each of the three directions, while the steps play.
      const area = project.assessment.areas[0];
      const photo = project.uploads.photos.find((p) => p.relatedAreaId === area?.id && p.previewUrl?.startsWith("data:image/")) ?? project.uploads.photos.find((p) => p.previewUrl?.startsWith("data:image/"));
      const directions = ["essential_refresh", "balanced_transformation", "premium_reconfiguration"];
      const drawing =
        token && photo?.previewUrl
          ? Promise.all(
              directions.map((direction) =>
                previewRenovation(token, {
                  photos: [photo.previewUrl as string],
                  room: ROOM_FOR_AREA[area?.areaKey ?? ""] ?? "living-room",
                  style: project.assessment.style.primaryStyle ?? "modern",
                  wish: [DIRECTION_WISH[direction], area?.desiredOutcome].filter(Boolean).join(" "),
                }),
              ),
            )
          : Promise.resolve(null);
      const startIndex = Math.max(0, project.generation.currentStageIndex);
      for (let i = startIndex; i < GENERATION_STAGES.length; i++) {
        if (cancelledRef.current) return;
        await new Promise((resolve) => setTimeout(resolve, STAGE_DELAY_MS));
        if (cancelledRef.current) return;
        RenovationProjectService.advanceGenerationStage(project.id, GENERATION_STAGES[i].key, i);
      }
      if (cancelledRef.current) return;
      const concepts = generateAllConcepts(buildGenerationInput(project));
      const pictures = await drawing;
      if (cancelledRef.current) return;
      if (pictures && photo?.previewUrl) {
        for (let i = 0; i < concepts.length; i++) {
          const outcome = pictures[i];
          if (!outcome?.ok) continue;
          const after = await shrinkPicture(outcome.result.imageUrl);
          concepts[i].beforeImage = photo.previewUrl;
          concepts[i].afterImage = after;
          concepts[i].areaViews = concepts[i].areaViews.map((view) => ({ ...view, beforeImage: photo.previewUrl as string, afterImage: after }));
        }
      }
      RenovationProjectService.completeGeneration(project.id, concepts);
      showToast("Your three renovation concepts are ready.");
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
        <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Something went wrong preparing your concepts. Your brief was kept — try again.</p>
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

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#2ec440]/10 text-[#2ec440] flex items-center justify-center mx-auto mb-5">
        <svg className="w-7 h-7 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
      <h2 className="text-xl font-black text-slate-900 mb-2">Generating your renovation concepts</h2>
      <p className="text-slate-500 text-sm mb-1">Huza AI is exploring three renovation directions based on your confirmed brief.</p>
      <p className="text-slate-400 text-xs mb-8">Elapsed time: {elapsedSec}s</p>

      <div className="max-w-md mx-auto space-y-3 text-left mb-8" aria-live="polite">
        {GENERATION_STAGES.map((stage, index) => {
          const done = project.generation.completedStageKeys.includes(stage.key);
          const active = index === project.generation.currentStageIndex && !done;
          return (
            <div key={stage.key} className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${active ? "border-[#2ec440] bg-[#2ec440]/5" : done ? "border-slate-100 bg-slate-50" : "border-slate-100"}`}>
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  done ? "bg-[#2ec440] text-white" : active ? "bg-[#2ec440]/20 text-[#2ec440]" : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </span>
              <div>
                <p className={`text-sm font-bold ${done || active ? "text-slate-900" : "text-slate-400"}`}>{stage.label}</p>
                <p className="text-xs text-slate-400">{stage.helper}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-3 gap-3 max-w-lg mx-auto mb-8" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>

      <button type="button" onClick={handleCancel} className="text-sm font-bold text-slate-500 hover:text-red-600 transition-colors">
        Cancel generation
      </button>
    </div>
  );
}
