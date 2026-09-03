import { BuildStorageService } from "./storage";
import { buildSeedProjects } from "./seed";
import { newId, createProject } from "./factory";
import { calculateBudget, BudgetInputs } from "./budget";
import { getTemplate } from "./templates";
import {
  ActivityEvent,
  ActivityEventType,
  ActivityCategory,
  BuildProject,
  BuildProjectStatus,
  Concept,
  CreateProjectInput,
  CreationMode,
  DesignBrief,
  GenerationStageKey,
  GENERATION_STAGES,
  ManualDesign,
  ProfessionalReviewRequest,
  ProjectDocument,
  ProjectVersion,
  VersionSource,
} from "./types";

export const DEMO_OWNER_ID = "demo-user";

type Listener = () => void;

let projects: BuildProject[] | null = null;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function ensureLoaded(): BuildProject[] {
  if (projects !== null) return projects;
  const stored = BuildStorageService.loadProjects();
  if (stored.length === 0 && !BuildStorageService.hasSeeded()) {
    const seeded = buildSeedProjects(DEMO_OWNER_ID);
    BuildStorageService.saveProjects(seeded);
    BuildStorageService.markSeeded();
    projects = seeded;
  } else {
    projects = stored;
  }
  return projects;
}

function persist() {
  if (projects) BuildStorageService.saveProjects(projects);
}

function activityEvent(
  type: ActivityEventType,
  category: ActivityCategory,
  actor: string,
  details?: string,
  link?: string,
  relatedItem?: string
): ActivityEvent {
  return { id: newId("activity"), type, category, actor, timestamp: new Date().toISOString(), details, link, relatedItem };
}

interface MutateOptions {
  activity?: ActivityEvent;
  touchStatus?: BuildProjectStatus;
}

function mutate(id: string, fn: (project: BuildProject) => BuildProject, options?: MutateOptions): BuildProject | undefined {
  const list = ensureLoaded();
  const index = list.findIndex((p) => p.id === id);
  if (index === -1) return undefined;
  let updated = fn(list[index]);
  updated = { ...updated, updatedAt: new Date().toISOString() };
  if (options?.touchStatus) updated.status = options.touchStatus;
  if (options?.activity) updated = { ...updated, activity: [options.activity, ...updated.activity] };
  const next = [...list];
  next[index] = updated;
  projects = next;
  persist();
  notify();
  return updated;
}

export const BuildProjectService = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot(): BuildProject[] {
    return ensureLoaded();
  },

  isStorageAvailable(): boolean {
    return BuildStorageService.isAvailable();
  },

  getAll(ownerId: string = DEMO_OWNER_ID): BuildProject[] {
    return ensureLoaded().filter((p) => p.ownerId === ownerId);
  },

  getById(id: string): BuildProject | undefined {
    return ensureLoaded().find((p) => p.id === id);
  },

  create(input: CreateProjectInput, ownerId: string = DEMO_OWNER_ID): BuildProject {
    const project = createProject(input, ownerId);
    const list = ensureLoaded();
    projects = [project, ...list];
    persist();
    notify();
    return project;
  },

  rename(id: string, name: string): BuildProject | undefined {
    return mutate(id, (p) => ({ ...p, name: name.trim() || p.name }), {
      activity: activityEvent("project_renamed", "system", "You", `Renamed project to "${name.trim()}".`),
    });
  },

  updateDescription(id: string, description: string): BuildProject | undefined {
    return mutate(id, (p) => ({ ...p, description }));
  },

  duplicate(id: string): BuildProject | undefined {
    const source = this.getById(id);
    if (!source) return undefined;
    const now = new Date().toISOString();
    const copy: BuildProject = {
      ...source,
      id: newId("project"),
      name: `${source.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      status: source.status === "archived" ? "draft" : source.status,
      reviewRequests: [],
      activity: [activityEvent("project_created", "system", "You", `Duplicated from "${source.name}".`)],
    };
    const list = ensureLoaded();
    projects = [copy, ...list];
    persist();
    notify();
    return copy;
  },

  archive(id: string): BuildProject | undefined {
    return mutate(
      id,
      (p) => ({ ...p, status: "archived" }),
      { activity: activityEvent("project_archived", "system", "You", "Project archived.") }
    );
  },

  restore(id: string, restoreStatus: BuildProjectStatus = "draft"): BuildProject | undefined {
    return mutate(id, (p) => ({ ...p, status: restoreStatus }), {
      activity: activityEvent("project_renamed", "system", "You", "Project restored from archive."),
    });
  },

  delete(id: string): void {
    const list = ensureLoaded();
    projects = list.filter((p) => p.id !== id);
    persist();
    notify();
  },

  changeCreationMode(id: string, mode: CreationMode): BuildProject | undefined {
    return mutate(id, (p) => ({ ...p, creationMode: mode }), {
      activity: activityEvent("brief_updated", "design", "You", `Changed creation mode to "${mode}".`),
    });
  },

  // ---- Brief ----
  saveBrief(id: string, brief: DesignBrief, note?: string): BuildProject | undefined {
    return mutate(
      id,
      (p) => {
        const isComplete = brief.completedSteps.includes("review") && brief.disclaimerAccepted;
        const nextStatus: BuildProjectStatus =
          p.status === "draft" || p.status === "brief_in_progress" ? (isComplete ? "ready_to_generate" : "brief_in_progress") : p.status;
        return { ...p, brief, status: nextStatus };
      },
      { activity: activityEvent("brief_updated", "design", "You", note ?? "Updated the design brief.") }
    );
  },

  // ---- Agent conversation ----
  appendAgentMessages(id: string, messages: BuildProject["agentConversation"]["messages"]): BuildProject | undefined {
    return mutate(id, (p) => ({
      ...p,
      agentConversation: { ...p.agentConversation, messages: [...p.agentConversation.messages, ...messages] },
    }));
  },

  setExtractedRequirements(id: string, requirements: BuildProject["agentConversation"]["extractedRequirements"]): BuildProject | undefined {
    return mutate(
      id,
      (p) => ({ ...p, agentConversation: { ...p.agentConversation, extractedRequirements: requirements } }),
      { activity: activityEvent("ai_conversation_updated", "design", "You", "Updated extracted requirements from Huza AI.") }
    );
  },

  // ---- Manual design ----
  saveManualDesign(id: string, design: ManualDesign, summary: string, asNewVersion = false): BuildProject | undefined {
    return mutate(
      id,
      (p) => {
        if (!asNewVersion) return { ...p, manualDesign: design };
        const version: ProjectVersion = {
          id: newId("version"),
          number: p.versions.length + 1,
          createdAt: new Date().toISOString(),
          createdBy: "You",
          source: "manual_edit",
          changeSummary: summary,
          selected: false,
        };
        return { ...p, manualDesign: design, versions: [...p.versions, version] };
      },
      { activity: activityEvent(asNewVersion ? "version_created" : "brief_updated", "design", "You", summary) }
    );
  },

  applyTemplate(id: string, templateId: string): BuildProject | undefined {
    const template = getTemplate(templateId);
    if (!template) return undefined;
    return mutate(
      id,
      (p) => ({ ...p, manualDesign: { floors: template.floors(), templateId }, templateId }),
      { activity: activityEvent("brief_updated", "design", "You", `Applied the "${template.name}" template.`) }
    );
  },

  // ---- Generation ----
  startGeneration(id: string): BuildProject | undefined {
    return mutate(
      id,
      (p) => ({ ...p, status: "generating", generation: { status: "in_progress", currentStageIndex: 0, startedAt: new Date().toISOString(), completedStageKeys: [] } }),
      { activity: activityEvent("concept_generation_started", "design", "Huza AI", "Started generating three concept directions.") }
    );
  },

  advanceGenerationStage(id: string, stageKey: GenerationStageKey, stageIndex: number): BuildProject | undefined {
    return mutate(id, (p) => ({
      ...p,
      generation: {
        ...p.generation,
        currentStageIndex: stageIndex,
        completedStageKeys: p.generation.completedStageKeys.includes(stageKey) ? p.generation.completedStageKeys : [...p.generation.completedStageKeys, stageKey],
      },
    }));
  },

  completeGeneration(id: string, concepts: Concept[]): BuildProject | undefined {
    return mutate(
      id,
      (p) => {
        const versions: ProjectVersion[] = concepts.map((c, i) => ({
          id: newId("version"),
          number: p.versions.length + i + 1,
          createdAt: c.generatedAt,
          createdBy: "Huza AI",
          source: "ai_generation" as VersionSource,
          changeSummary: `${c.name} concept generated from the confirmed design brief.`,
          conceptId: c.id,
          selected: false,
        }));
        return {
          ...p,
          status: "concepts_ready",
          concepts: [...p.concepts, ...concepts],
          versions: [...p.versions, ...versions],
          generation: { status: "completed", currentStageIndex: GENERATION_STAGES.length - 1, completedStageKeys: GENERATION_STAGES.map((s) => s.key) },
        };
      },
      { activity: activityEvent("concepts_generated", "design", "Huza AI", "Generated Efficient, Balanced and Spacious concepts.") }
    );
  },

  failGeneration(id: string): BuildProject | undefined {
    return mutate(
      id,
      (p) => ({ ...p, status: "ready_to_generate", generation: { ...p.generation, status: "failed" } }),
      { activity: activityEvent("generation_failed", "system", "Huza AI", "Concept generation failed.") }
    );
  },

  cancelGeneration(id: string): BuildProject | undefined {
    return mutate(
      id,
      (p) => ({ ...p, status: "ready_to_generate", generation: { ...p.generation, status: "cancelled" } }),
      { activity: activityEvent("generation_cancelled", "system", "You", "Cancelled concept generation.") }
    );
  },

  // ---- Concepts ----
  selectConcept(id: string, conceptId: string): BuildProject | undefined {
    const project = this.getById(id);
    const concept = project?.concepts.find((c) => c.id === conceptId);
    return mutate(
      id,
      (p) => ({ ...p, selectedConceptId: conceptId }),
      { activity: activityEvent("concept_selected", "design", "You", `Selected "${concept?.name ?? "a concept"}" as the preferred concept.`) }
    );
  },

  duplicateConceptAsVersion(id: string, conceptId: string): BuildProject | undefined {
    const project = this.getById(id);
    const source = project?.concepts.find((c) => c.id === conceptId);
    if (!source) return undefined;
    const copy: Concept = { ...source, id: newId("concept"), version: source.version + 1, generatedAt: new Date().toISOString(), name: `${source.name} (Copy)` };
    return mutate(
      id,
      (p) => {
        const version: ProjectVersion = {
          id: newId("version"),
          number: p.versions.length + 1,
          createdAt: copy.generatedAt,
          createdBy: "You",
          source: "manual_edit",
          changeSummary: `Duplicated "${source.name}" as a new version.`,
          conceptId: copy.id,
          selected: false,
        };
        return { ...p, concepts: [...p.concepts, copy], versions: [...p.versions, version] };
      },
      { activity: activityEvent("version_created", "design", "You", `Duplicated "${source.name}" as a new concept version.`) }
    );
  },

  refineConcept(id: string, conceptId: string, request: string, changeSummary: string, patch: Partial<Concept["metrics"]>): BuildProject | undefined {
    const project = this.getById(id);
    const source = project?.concepts.find((c) => c.id === conceptId);
    if (!source) return undefined;
    const refined: Concept = {
      ...source,
      id: newId("concept"),
      version: source.version + 1,
      generatedAt: new Date().toISOString(),
      metrics: { ...source.metrics, ...patch },
    };
    return mutate(
      id,
      (p) => {
        const version: ProjectVersion = {
          id: newId("version"),
          number: p.versions.length + 1,
          createdAt: refined.generatedAt,
          createdBy: "Huza AI",
          source: "ai_refinement",
          changeSummary,
          conceptId: refined.id,
          selected: p.selectedConceptId === conceptId,
        };
        return {
          ...p,
          status: "refinement_in_progress",
          concepts: [...p.concepts, refined],
          versions: [...p.versions, version],
          selectedConceptId: p.selectedConceptId === conceptId ? refined.id : p.selectedConceptId,
        };
      },
      { activity: activityEvent("refinement_requested", "design", "You", `Requested: "${request}"`) }
    );
  },

  // ---- Versions ----
  restoreVersion(id: string, versionId: string): BuildProject | undefined {
    const project = this.getById(id);
    const version = project?.versions.find((v) => v.id === versionId);
    if (!version) return undefined;
    return mutate(
      id,
      (p) => {
        const newVersion: ProjectVersion = { ...version, id: newId("version"), number: p.versions.length + 1, createdAt: new Date().toISOString(), changeSummary: `Restored from version ${version.number}.` };
        return { ...p, versions: [...p.versions, newVersion], selectedConceptId: version.conceptId ?? p.selectedConceptId };
      },
      { activity: activityEvent("version_created", "design", "You", `Restored version ${version.number} as the current version.`) }
    );
  },

  renameVersion(id: string, versionId: string, summary: string): BuildProject | undefined {
    return mutate(id, (p) => ({ ...p, versions: p.versions.map((v) => (v.id === versionId ? { ...v, changeSummary: summary } : v)) }));
  },

  deleteVersion(id: string, versionId: string): BuildProject | undefined {
    return mutate(id, (p) => ({ ...p, versions: p.versions.filter((v) => v.id !== versionId) }));
  },

  // ---- Budget ----
  recalculateBudget(id: string, inputs: BudgetInputs): BuildProject | undefined {
    const estimate = calculateBudget(inputs);
    return mutate(
      id,
      (p) => ({ ...p, budget: estimate }),
      { activity: activityEvent("budget_recalculated", "budget", "You", "Recalculated the indicative budget.") }
    );
  },

  // ---- Professional review ----
  requestReview(id: string, request: Omit<ProfessionalReviewRequest, "id" | "status" | "submittedAt" | "feedback">): BuildProject | undefined {
    const full: ProfessionalReviewRequest = { ...request, id: newId("review"), status: "submitted", submittedAt: new Date().toISOString(), feedback: [] };
    return mutate(
      id,
      (p) => ({ ...p, status: "awaiting_professional_review", reviewRequests: [full, ...p.reviewRequests] }),
      { activity: activityEvent("review_requested", "professional_review", "You", `Requested a ${request.type.replace(/_/g, " ")} review.`) }
    );
  },

  cancelReview(id: string, reviewId: string): BuildProject | undefined {
    return mutate(
      id,
      (p) => ({ ...p, reviewRequests: p.reviewRequests.map((r) => (r.id === reviewId ? { ...r, status: "cancelled" } : r)) }),
      { activity: activityEvent("review_requested", "professional_review", "You", "Cancelled a professional review request.") }
    );
  },

  updateReview(id: string, reviewId: string, update: (review: ProfessionalReviewRequest) => ProfessionalReviewRequest, details?: string): BuildProject | undefined {
    return mutate(id, (p) => ({ ...p, reviewRequests: p.reviewRequests.map((review) => review.id === reviewId ? update(review) : review) }), {
      activity: activityEvent("professional_commented", "professional_review", "Professional", details ?? "Professional review updated.", `/studio/build/${id}/professionals`, reviewId),
    });
  },

  replyToFeedback(id: string, reviewId: string, feedbackId: string, reply: string): BuildProject | undefined {
    return mutate(id, (p) => ({
      ...p,
      reviewRequests: p.reviewRequests.map((r) =>
        r.id === reviewId ? { ...r, feedback: r.feedback.map((f) => (f.id === feedbackId ? { ...f, reply } : f)) } : r
      ),
    }));
  },

  markFeedbackAddressed(id: string, reviewId: string, feedbackId: string, addressed: boolean): BuildProject | undefined {
    return mutate(id, (p) => ({
      ...p,
      reviewRequests: p.reviewRequests.map((r) =>
        r.id === reviewId ? { ...r, feedback: r.feedback.map((f) => (f.id === feedbackId ? { ...f, addressed } : f)) } : r
      ),
    }));
  },

  // ---- Documents ----
  addDocuments(id: string, documents: ProjectDocument[]): BuildProject | undefined {
    return mutate(
      id,
      (p) => ({ ...p, documents: [...documents, ...p.documents] }),
      { activity: activityEvent("file_uploaded", "documents", "You", `Uploaded ${documents.length} document${documents.length === 1 ? "" : "s"}.`) }
    );
  },

  renameDocument(id: string, documentId: string, name: string): BuildProject | undefined {
    return mutate(id, (p) => ({ ...p, documents: p.documents.map((d) => (d.id === documentId ? { ...d, name } : d)) }));
  },

  moveDocumentCategory(id: string, documentId: string, category: ProjectDocument["category"]): BuildProject | undefined {
    return mutate(id, (p) => ({ ...p, documents: p.documents.map((d) => (d.id === documentId ? { ...d, category } : d)) }));
  },

  archiveDocument(id: string, documentId: string): BuildProject | undefined {
    return mutate(id, (p) => ({ ...p, documents: p.documents.map((d) => (d.id === documentId ? { ...d, status: "archived" } : d)) }));
  },

  deleteDocument(id: string, documentId: string): BuildProject | undefined {
    return mutate(id, (p) => ({ ...p, documents: p.documents.filter((d) => d.id !== documentId) }));
  },

  logDocumentDownload(id: string, documentName: string): BuildProject | undefined {
    return mutate(id, (p) => p, { activity: activityEvent("document_downloaded", "documents", "You", `Downloaded "${documentName}".`) });
  },

  // ---- Activity (generic) ----
  logActivity(id: string, type: ActivityEventType, category: ActivityCategory, details?: string): BuildProject | undefined {
    return mutate(id, (p) => p, { activity: activityEvent(type, category, "You", details) });
  },
};
