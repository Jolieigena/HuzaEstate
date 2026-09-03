"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRenovationProjectContext } from "@/components/renovate/RenovationProjectContext";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { ASSESSMENT_STEP_KEYS, ASSESSMENT_STEP_LABELS, AssessmentStepKey, RenovationAssessment, RenovationPropertyInfo } from "@/lib/renovate/types";
import { collectAssessmentWarnings, validateStep, StepErrors } from "@/lib/renovate/assessmentValidation";
import { useToast } from "@/lib/toast-context";
import AgentPanel from "@/components/renovate/AgentPanel";
import StepProperty from "@/components/renovate/assessment/StepProperty";
import StepAreas from "@/components/renovate/assessment/StepAreas";
import StepCondition from "@/components/renovate/assessment/StepCondition";
import StepKeepRemoveChange from "@/components/renovate/assessment/StepKeepRemoveChange";
import StepStyle from "@/components/renovate/assessment/StepStyle";
import StepBudgetTimeline from "@/components/renovate/assessment/StepBudgetTimeline";
import StepSafety from "@/components/renovate/assessment/StepSafety";
import StepReview from "@/components/renovate/assessment/StepReview";

function cloneAssessment(a: RenovationAssessment): RenovationAssessment {
  return JSON.parse(JSON.stringify(a));
}
function cloneProperty(p: RenovationPropertyInfo): RenovationPropertyInfo {
  return JSON.parse(JSON.stringify(p));
}

function initialStepIndex(assessment: RenovationAssessment): number {
  const firstIncomplete = ASSESSMENT_STEP_KEYS.findIndex((k) => !assessment.completedSteps.includes(k));
  return firstIncomplete === -1 ? ASSESSMENT_STEP_KEYS.length - 1 : firstIncomplete;
}

function initialView(project: { creationMode: string; assessment: RenovationAssessment }): "wizard" | "agent" {
  return project.creationMode === "ai" && project.assessment.completedSteps.includes("review") && project.assessment.disclaimerAccepted ? "agent" : "wizard";
}

export default function AssessmentWizardPage() {
  const project = useRenovationProjectContext();
  const router = useRouter();
  const { showToast } = useToast();

  const [draft, setDraft] = useState<RenovationAssessment>(() => cloneAssessment(project.assessment));
  const [propertyDraft, setPropertyDraft] = useState<RenovationPropertyInfo>(() => cloneProperty(project.property));
  const [stepIndex, setStepIndex] = useState(() => initialStepIndex(project.assessment));
  const [errors, setErrors] = useState<StepErrors>({});
  const [dirty, setDirty] = useState(false);
  const [view, setView] = useState<"wizard" | "agent">(() => initialView(project));

  const [loadedProjectId, setLoadedProjectId] = useState(project.id);
  if (project.id !== loadedProjectId) {
    setLoadedProjectId(project.id);
    setDraft(cloneAssessment(project.assessment));
    setPropertyDraft(cloneProperty(project.property));
    setStepIndex(initialStepIndex(project.assessment));
    setErrors({});
    setDirty(false);
    setView(initialView(project));
  }

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const stepKey = ASSESSMENT_STEP_KEYS[stepIndex];
  const warnings = useMemo(() => collectAssessmentWarnings(draft), [draft]);

  const patch = <K extends keyof RenovationAssessment>(key: K, value: RenovationAssessment[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    if (Object.keys(errors).length) setErrors({});
  };

  const persist = (nextAssessment: RenovationAssessment, nextProperty: RenovationPropertyInfo, note?: string) => {
    RenovationProjectService.updatePropertyDetails(project.id, nextProperty);
    RenovationProjectService.saveAssessment(project.id, nextAssessment, note);
    setDirty(false);
  };

  const goToStep = (index: number) => {
    persist(draft, propertyDraft, `Updated the "${ASSESSMENT_STEP_LABELS[stepKey]}" step.`);
    setStepIndex(index);
    setErrors({});
  };

  const handleBack = () => {
    if (stepIndex === 0) return;
    goToStep(stepIndex - 1);
  };

  const handleContinue = () => {
    const stepErrors = validateStep(stepKey, draft, propertyDraft);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    const completedSteps = draft.completedSteps.includes(stepKey) ? draft.completedSteps : [...draft.completedSteps, stepKey];
    const next = { ...draft, completedSteps };
    setDraft(next);
    persist(next, propertyDraft, `Completed the "${ASSESSMENT_STEP_LABELS[stepKey]}" step.`);
    if (stepIndex < ASSESSMENT_STEP_KEYS.length - 1) setStepIndex(stepIndex + 1);
  };

  const handleSaveAndExit = () => {
    persist(draft, propertyDraft, "Saved assessment progress.");
    showToast("Draft saved.");
    router.push(`/studio/renovate/${project.id}`);
  };

  const finalizeReview = (): RenovationAssessment | null => {
    if (!draft.disclaimerAccepted) {
      setErrors({ disclaimer: "Please confirm this before continuing." });
      return null;
    }
    const reviewStep: AssessmentStepKey = "review";
    const completedSteps = draft.completedSteps.includes(reviewStep) ? draft.completedSteps : [...draft.completedSteps, reviewStep];
    const next = { ...draft, completedSteps };
    setDraft(next);
    persist(next, propertyDraft, "Confirmed the renovation brief.");
    const summary = `Renovate ${next.areas.map((a) => a.customLabel || a.areaKey).join(", ") || "the property"} in a ${next.style.primaryStyle ?? "TBD"} style${
      next.budgetTimeline.targetBudget ? `, targeting ${next.budgetTimeline.targetBudget.toLocaleString()} RWF` : ""
    }.`;
    RenovationProjectService.confirmBrief(project.id, summary, []);
    return next;
  };

  const handleContinueToAgent = () => {
    if (!finalizeReview()) return;
    setView("agent");
    showToast("Brief confirmed. Continue the conversation with Huza AI.");
  };

  const handleOpenDesigner = () => {
    if (!finalizeReview()) return;
    router.push(`/studio/renovate/${project.id}/designer`);
  };

  const handleSaveAsDraft = () => {
    persist(draft, propertyDraft, "Saved assessment as draft.");
    showToast("Draft saved.");
    router.push(`/studio/renovate/${project.id}`);
  };

  if (view === "agent") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Huza AI renovation conversation</h1>
            <p className="text-slate-500 text-sm">Refine your brief in conversation, then generate concepts when you&apos;re ready.</p>
          </div>
          <button type="button" onClick={() => setView("wizard")} className="text-sm font-bold text-[#2ec440] hover:text-[#28b039] whitespace-nowrap">
            Edit structured brief
          </button>
        </div>
        <AgentPanel project={project} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ol className="hidden lg:flex items-center bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
        {ASSESSMENT_STEP_KEYS.map((key, index) => {
          const isCurrent = index === stepIndex;
          const isComplete = draft.completedSteps.includes(key);
          return (
            <li key={key} className="flex items-center flex-1 last:flex-none">
              <button type="button" onClick={() => goToStep(index)} className={`flex items-center gap-2 text-left ${isCurrent ? "text-slate-900" : "text-slate-400"}`}>
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isCurrent ? "bg-[#2ec440] text-white" : isComplete ? "bg-[#2ec440]/10 text-[#2ec440]" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isComplete && !isCurrent ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="text-xs font-bold whitespace-nowrap hidden xl:inline">{ASSESSMENT_STEP_LABELS[key]}</span>
              </button>
              {index < ASSESSMENT_STEP_KEYS.length - 1 && <div className="flex-1 h-px bg-slate-200 mx-3" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      <div className="lg:hidden bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
          <span>
            Step {stepIndex + 1} of {ASSESSMENT_STEP_KEYS.length}
          </span>
          <span>{ASSESSMENT_STEP_LABELS[stepKey]}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-[#2ec440] rounded-full transition-all" style={{ width: `${((stepIndex + 1) / ASSESSMENT_STEP_KEYS.length) * 100}%` }} />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 sm:p-7">
        <h1 className="text-xl font-black text-slate-900 mb-1">{ASSESSMENT_STEP_LABELS[stepKey]}</h1>
        <p className="text-slate-500 text-sm mb-6">
          Step {stepIndex + 1} of {ASSESSMENT_STEP_KEYS.length}
        </p>

        {stepKey === "property" && <StepProperty value={propertyDraft} onChange={(p) => { setPropertyDraft((prev) => ({ ...prev, ...p })); setDirty(true); }} errors={errors} />}
        {stepKey === "areas" && <StepAreas value={draft.areas} onChange={(areas) => patch("areas", areas)} errors={errors} />}
        {stepKey === "condition" && (
          <StepCondition
            areas={draft.areas}
            conditions={draft.conditions}
            onChangeConditions={(c) => patch("conditions", c)}
            uploads={project.uploads}
            onChangeUploads={(u) => {
              if (u.photos) RenovationProjectService.addUploads(project.id, "photos", u.photos.filter((f) => !project.uploads.photos.some((e) => e.id === f.id)));
              // Uploads persist immediately (not part of the local draft) since files must survive step navigation without loss.
              setDirty(true);
            }}
          />
        )}
        {stepKey === "keep_remove_change" && <StepKeepRemoveChange areas={draft.areas} items={draft.keepRemoveChange} onChange={(items) => patch("keepRemoveChange", items)} />}
        {stepKey === "style" && (
          <StepStyle
            value={draft.style}
            onChange={(p) => patch("style", { ...draft.style, ...p })}
            inspirationFiles={project.uploads.inspiration}
            onChangeInspirationFiles={(files) => {
              const added = files.filter((f) => !project.uploads.inspiration.some((e) => e.id === f.id));
              if (added.length) RenovationProjectService.addUploads(project.id, "inspiration", added);
            }}
          />
        )}
        {stepKey === "budget_timeline" && (
          <StepBudgetTimeline
            value={draft.budgetTimeline}
            onChange={(p) => patch("budgetTimeline", { ...draft.budgetTimeline, ...p })}
            warnings={warnings}
            errors={errors}
          />
        )}
        {stepKey === "safety" && <StepSafety value={draft.safety} onChange={(p) => patch("safety", { ...draft.safety, ...p })} />}
        {stepKey === "review" && (
          <>
            <StepReview
              property={propertyDraft}
              assessment={draft}
              uploads={project.uploads}
              warnings={warnings}
              onEditStep={(key) => setStepIndex(ASSESSMENT_STEP_KEYS.indexOf(key))}
              onToggleDisclaimer={(accepted) => {
                setDraft((prev) => ({ ...prev, disclaimerAccepted: accepted }));
                setDirty(true);
                setErrors({});
              }}
            />
            {errors.disclaimer && (
              <p className="text-red-600 text-sm font-semibold mt-3" role="alert">
                {errors.disclaimer}
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepIndex === 0}
            className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button type="button" onClick={handleSaveAndExit} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
            Save and Exit
          </button>
        </div>

        {stepKey === "review" ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={handleSaveAsDraft} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
              Save as Draft
            </button>
            <button type="button" onClick={handleOpenDesigner} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors whitespace-nowrap">
              Open Manual Planner
            </button>
            {project.creationMode === "ai" && (
              <button type="button" onClick={handleContinueToAgent} className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-[#2ec440] text-white font-bold transition-colors shadow-lg whitespace-nowrap">
                Continue to Huza AI
              </button>
            )}
          </div>
        ) : (
          <button type="button" onClick={handleContinue} className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-[#2ec440] text-white font-bold transition-colors shadow-lg">
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
