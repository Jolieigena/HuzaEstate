"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";
import { BuildProjectService } from "@/lib/build/projectService";
import { BRIEF_STEP_KEYS, BriefStepKey, DesignBrief, QUICK_BRIEF_STEP_KEYS, isQuickBrief } from "@/lib/build/types";
import { collectBriefWarnings, validateQuickStep, validateStep, StepErrors } from "@/lib/build/briefValidation";
import { useToast } from "@/lib/toast-context";
import AgentPanel from "@/components/build/AgentPanel";
import BriefStepBasics from "@/components/build/brief/BriefStepBasics";
import BriefStepPlot from "@/components/build/brief/BriefStepPlot";
import BriefStepHousehold from "@/components/build/brief/BriefStepHousehold";
import BriefStepStyle from "@/components/build/brief/BriefStepStyle";
import BriefStepBudget from "@/components/build/brief/BriefStepBudget";
import BriefStepSustainability from "@/components/build/brief/BriefStepSustainability";
import BriefStepReview from "@/components/build/brief/BriefStepReview";
import BriefQuickHome from "@/components/build/brief/BriefQuickHome";
import BriefQuickStyle from "@/components/build/brief/BriefQuickStyle";
import BriefQuickReview from "@/components/build/brief/BriefQuickReview";

const STEP_LABELS: Record<BriefStepKey, string> = {
  basics: "Project basics",
  plot: "Plot information",
  household: "Household & rooms",
  style: "Style & inspiration",
  budget: "Budget & timeline",
  sustainability: "Sustainability & accessibility",
  review: "Review brief",
};

// On the short path the same step keys carry different screens, so they are named for what the person sees.
const QUICK_STEP_LABELS: Partial<Record<BriefStepKey, string>> = {
  basics: "Your home",
  style: "Style & budget",
  review: "Confirm",
};

function cloneBrief(brief: DesignBrief): DesignBrief {
  return JSON.parse(JSON.stringify(brief));
}

function initialStepIndex(brief: DesignBrief, keys: readonly BriefStepKey[]): number {
  // On the short path a screen counts as done only when what it asks is really filled in: an older project may have the
  // first step ticked without ever having been asked for bedrooms.
  const quick = keys === QUICK_BRIEF_STEP_KEYS;
  const firstIncomplete = keys.findIndex((k) => !brief.completedSteps.includes(k) || (quick && Object.keys(validateQuickStep(k, brief)).length > 0));
  return firstIncomplete === -1 ? keys.length - 1 : firstIncomplete;
}

// Every brief starts on the short path; the full brief is one click away, and stays on for projects already deep into it.
function startsDetailed(project: { brief: DesignBrief }): boolean {
  return !isQuickBrief(project.brief);
}

function startKeys(project: { brief: DesignBrief }): readonly BriefStepKey[] {
  return startsDetailed(project) ? BRIEF_STEP_KEYS : QUICK_BRIEF_STEP_KEYS;
}

function initialView(project: { creationMode: string; brief: DesignBrief }): "wizard" | "agent" {
  return project.creationMode === "ai" && project.brief.completedSteps.includes("review") && project.brief.disclaimerAccepted ? "agent" : "wizard";
}

export default function BriefWizardPage() {
  const project = useBuildProjectContext();
  const router = useRouter();
  const { showToast } = useToast();

  const [draft, setDraft] = useState<DesignBrief>(() => cloneBrief(project.brief));
  const [detailed, setDetailed] = useState(() => startsDetailed(project));
  const quick = !detailed;
  const stepKeys: readonly BriefStepKey[] = quick ? QUICK_BRIEF_STEP_KEYS : BRIEF_STEP_KEYS;
  const labelOf = (key: BriefStepKey) => (quick ? QUICK_STEP_LABELS[key] : undefined) ?? STEP_LABELS[key];
  const [stepIndex, setStepIndex] = useState(() => initialStepIndex(project.brief, startKeys(project)));
  const [errors, setErrors] = useState<StepErrors>({});
  const [dirty, setDirty] = useState(false);
  const [view, setView] = useState<"wizard" | "agent">(() => initialView(project));

  // Reset local draft when switching to a different project. Adjusted during
  // render (React's recommended pattern for resetting state from a changed
  // id) rather than in an effect, so it never flashes stale content.
  const [loadedProjectId, setLoadedProjectId] = useState(project.id);
  if (project.id !== loadedProjectId) {
    setLoadedProjectId(project.id);
    setDraft(cloneBrief(project.brief));
    setDetailed(startsDetailed(project));
    setStepIndex(initialStepIndex(project.brief, startKeys(project)));
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

  const stepKey = stepKeys[stepIndex];
  const warnings = useMemo(() => collectBriefWarnings(draft), [draft]);

  const patchBrief = <K extends keyof DesignBrief>(key: K, patch: Partial<DesignBrief[K]>) => {
    setDraft((prev) => ({ ...prev, [key]: { ...(prev[key] as object), ...patch } }));
    setDirty(true);
    if (Object.keys(errors).length) setErrors({});
  };

  const persist = (next: DesignBrief, note?: string) => {
    BuildProjectService.saveBrief(project.id, next, note);
    setDirty(false);
  };

  const goToStep = (index: number) => {
    persist(draft, `Updated the "${labelOf(stepKey)}" step.`);
    setStepIndex(index);
    setErrors({});
  };

  const handleBack = () => {
    if (stepIndex === 0) return;
    goToStep(stepIndex - 1);
  };

  const handleContinue = () => {
    const stepErrors = quick ? validateQuickStep(stepKey, draft) : validateStep(stepKey, draft);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    const completedSteps = draft.completedSteps.includes(stepKey) ? draft.completedSteps : [...draft.completedSteps, stepKey];
    const next = { ...draft, completedSteps };
    setDraft(next);
    persist(next, `Completed the "${labelOf(stepKey)}" step.`);
    if (stepIndex < stepKeys.length - 1) setStepIndex(stepIndex + 1);
  };

  // Opens the full brief at the plot step, keeping what has been filled in.
  const handleAddDetail = () => {
    persist(draft, "Opened the full brief.");
    setDetailed(true);
    setStepIndex(BRIEF_STEP_KEYS.indexOf("plot"));
    setErrors({});
  };

  const handleSaveAndExit = () => {
    persist(draft, "Saved brief progress.");
    showToast("Draft saved.");
    router.push(`/studio/build/${project.id}`);
  };

  const finalizeReview = (): DesignBrief | null => {
    if (!draft.disclaimerAccepted) {
      setErrors({ disclaimer: "Please confirm this before continuing." });
      return null;
    }
    const reviewStep: BriefStepKey = "review";
    const completedSteps = draft.completedSteps.includes(reviewStep) ? draft.completedSteps : [...draft.completedSteps, reviewStep];
    const next = { ...draft, completedSteps };
    setDraft(next);
    persist(next, "Confirmed the design brief.");
    return next;
  };

  const handleContinueToAgent = () => {
    if (!finalizeReview()) return;
    setView("agent");
    showToast("Brief confirmed. Continue the conversation with Huza AI.");
  };

  // Confirming the brief starts the design: the three concepts are made right away, with the progress shown on the Concepts page.
  const handleStartDesigning = () => {
    if (!finalizeReview()) return;
    BuildProjectService.startGeneration(project.id);
    router.push(`/studio/build/${project.id}/concepts`);
  };

  const handleOpenDesigner = () => {
    if (!finalizeReview()) return;
    router.push(`/studio/build/${project.id}/designer`);
  };

  if (view === "agent") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Huza AI design conversation</h1>
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
      {/* Desktop horizontal step indicator */}
      <ol className="hidden lg:flex items-center bg-white border border-slate-100 rounded-2xl shadow-sm p-4 overflow-x-auto">
        {stepKeys.map((key, index) => {
          const isCurrent = index === stepIndex;
          const isComplete = draft.completedSteps.includes(key);
          return (
            <li key={key} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => goToStep(index)}
                className={`flex items-center gap-2 text-left ${isCurrent ? "text-slate-900" : "text-slate-400"}`}
              >
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
                <span className={`text-xs font-bold whitespace-nowrap hidden ${isCurrent || stepKeys.length <= 3 ? "lg:inline" : "2xl:inline"}`}>{labelOf(key)}</span>
              </button>
              {index < stepKeys.length - 1 && <div className="flex-1 h-px bg-slate-200 mx-3" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      {/* Mobile compact progress */}
      <div className="lg:hidden bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
          <span>
            Step {stepIndex + 1} of {stepKeys.length}
          </span>
          <span>{labelOf(stepKey)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-[#2ec440] rounded-full transition-all" style={{ width: `${((stepIndex + 1) / stepKeys.length) * 100}%` }} />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 sm:p-7">
        <h1 className="text-xl font-black text-slate-900 mb-1">{labelOf(stepKey)}</h1>
        <p className="text-slate-500 text-sm mb-6">Step {stepIndex + 1} of {stepKeys.length}</p>

        {quick && stepKey === "basics" && (
          <BriefQuickHome basics={draft.basics} household={draft.household} onChangeBasics={(p) => patchBrief("basics", p)} onChangeHousehold={(p) => patchBrief("household", p)} errors={errors} />
        )}
        {quick && stepKey === "style" && (
          <BriefQuickStyle style={draft.style} budget={draft.budget} onChangeStyle={(p) => patchBrief("style", p)} onChangeBudget={(p) => patchBrief("budget", p)} errors={errors} />
        )}
        {quick && stepKey === "review" && (
          <>
            <BriefQuickReview
              brief={draft}
              onEdit={(key) => setStepIndex(stepKeys.indexOf(key))}
              onAddDetail={handleAddDetail}
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

        {!quick && stepKey === "basics" && <BriefStepBasics value={draft.basics} onChange={(p) => patchBrief("basics", p)} errors={errors} />}
        {!quick && stepKey === "plot" && <BriefStepPlot value={draft.plot} onChange={(p) => patchBrief("plot", p)} errors={errors} />}
        {!quick && stepKey === "household" && <BriefStepHousehold value={draft.household} onChange={(p) => patchBrief("household", p)} errors={errors} />}
        {!quick && stepKey === "style" && <BriefStepStyle value={draft.style} onChange={(p) => patchBrief("style", p)} errors={errors} />}
        {!quick && stepKey === "budget" && <BriefStepBudget value={draft.budget} onChange={(p) => patchBrief("budget", p)} errors={errors} />}
        {!quick && stepKey === "sustainability" && (
          <BriefStepSustainability
            sustainability={draft.sustainability}
            accessibility={draft.accessibility}
            onChangeSustainability={(p) => patchBrief("sustainability", p)}
            onChangeAccessibility={(p) => patchBrief("accessibility", p)}
          />
        )}
        {!quick && stepKey === "review" && (
          <>
            <BriefStepReview
              brief={draft}
              warnings={warnings}
              onEditStep={(key) => setStepIndex(BRIEF_STEP_KEYS.indexOf(key))}
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

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleBack} disabled={stepIndex === 0} className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-xl border border-slate-200 bg-white px-6 font-bold text-slate-700 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40">
            Back
          </button>
          <button type="button" onClick={handleSaveAndExit} className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-xl px-4 font-bold text-slate-500 transition-colors hover:text-slate-900">
            Save and exit
          </button>
        </div>

        {stepKey === "review" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {project.creationMode === "ai" && (
              <button type="button" onClick={handleContinueToAgent} className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-xl px-4 font-bold text-slate-500 transition-colors hover:text-slate-900">
                Refine with Huza AI
              </button>
            )}
            <button type="button" onClick={handleOpenDesigner} className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-xl border border-slate-200 bg-white px-6 font-bold text-slate-700 transition-colors hover:border-slate-400">
              Continue manually
            </button>
            {project.creationMode === "ai" && (
              <button type="button" onClick={handleStartDesigning} className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-xl bg-slate-900 px-8 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
                Start designing
              </button>
            )}
          </div>
        ) : (
          <button type="button" onClick={handleContinue} className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-xl bg-slate-900 px-8 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
