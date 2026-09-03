import { RenovationStorageService } from "./storage";
import { renovationSeedProjects } from "./seed";
import { newId, createProject } from "./factory";
import { calculateRenovationBudget, RenovationBudgetInputs } from "./budget";
import { calculateRenovationTimeline, TimelineInputs } from "./timeline";
import type { MyProperty } from "../myProperties";
import {
  ActivityCategory,
  ActivityEvent,
  ActivityEventType,
  AgentMessage,
  ContractorQuotation,
  CreateProjectInput,
  DemoContractor,
  ExtractedRequirement,
  GenerationStageKey,
  GENERATION_STAGES,
  ManualRenovationDesign,
  ProfessionalReviewRequest,
  ProjectDocument,
  ProjectVersion,
  QuotationRequest,
  QuotationStatus,
  RenovationAssessment,
  RenovationConcept,
  RenovationCreationMode,
  RenovationProject,
  RenovationProjectStatus,
  RenovationPropertyInfo,
  ScopeItem,
  TargetedEdit,
  UploadCategory,
  UploadedFile,
} from "./types";

export const DEMO_OWNER_ID = "demo-user";

type Listener = () => void;

let projects: RenovationProject[] | null = null;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function ensureLoaded(): RenovationProject[] {
  if (projects !== null) return projects;
  const stored = RenovationStorageService.loadProjects();
  if (stored.length === 0 && !RenovationStorageService.hasSeeded()) {
    const seeded = renovationSeedProjects(DEMO_OWNER_ID);
    RenovationStorageService.saveProjects(seeded);
    RenovationStorageService.markSeeded();
    projects = seeded;
  } else {
    projects = stored;
  }
  return projects;
}

function persist() {
  if (projects) RenovationStorageService.saveProjects(projects);
}

function activityEvent(type: ActivityEventType, category: ActivityCategory, actor: string, details?: string, link?: string, relatedItem?: string): ActivityEvent {
  return { id: newId("activity"), type, category, actor, timestamp: new Date().toISOString(), details, link, relatedItem };
}

interface MutateOptions {
  activity?: ActivityEvent;
  touchStatus?: RenovationProjectStatus;
}

function mutate(id: string, fn: (project: RenovationProject) => RenovationProject, options?: MutateOptions): RenovationProject | undefined {
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

/** Statuses that come before the assessment/generation flow has produced anything durable yet. */
const EARLY_STATUSES: RenovationProjectStatus[] = ["draft", "property_setup", "assessment_in_progress"];

export const RenovationProjectService = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot(): RenovationProject[] {
    return ensureLoaded();
  },

  isStorageAvailable(): boolean {
    return RenovationStorageService.isAvailable();
  },

  getAll(ownerId: string = DEMO_OWNER_ID): RenovationProject[] {
    return ensureLoaded().filter((p) => p.ownerId === ownerId);
  },

  getById(id: string): RenovationProject | undefined {
    return ensureLoaded().find((p) => p.id === id);
  },

  create(input: CreateProjectInput, ownerId: string = DEMO_OWNER_ID): RenovationProject {
    const project = createProject(input, ownerId);
    const list = ensureLoaded();
    projects = [project, ...list];
    persist();
    notify();
    return project;
  },

  rename(id: string, name: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, name: name.trim() || p.name }), {
      activity: activityEvent("project_renamed", "system", "You", `Renamed project to "${name.trim()}".`),
    });
  },

  updateDescription(id: string, description: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, description }));
  },

  duplicate(id: string): RenovationProject | undefined {
    const source = this.getById(id);
    if (!source) return undefined;
    const now = new Date().toISOString();
    const copy: RenovationProject = {
      ...source,
      id: newId("renov"),
      name: `${source.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      status: source.status === "archived" ? "draft" : source.status,
      reviewRequests: [],
      quotationRequest: null,
      quotations: [],
      activity: [activityEvent("project_created", "system", "You", `Duplicated from "${source.name}".`)],
    };
    const list = ensureLoaded();
    projects = [copy, ...list];
    persist();
    notify();
    return copy;
  },

  archive(id: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, status: "archived" }), { activity: activityEvent("project_archived", "system", "You", "Project archived.") });
  },

  restore(id: string, restoreStatus: RenovationProjectStatus = "draft"): RenovationProject | undefined {
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

  changeCreationMode(id: string, mode: RenovationCreationMode): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, creationMode: mode }));
  },

  // ---- Property ----
  beginPropertySetup(id: string): RenovationProject | undefined {
    return mutate(id, (p) => (p.status === "draft" ? { ...p, status: "property_setup" } : p));
  },

  selectOwnedProperty(id: string, property: MyProperty): RenovationProject | undefined {
    const info: RenovationPropertyInfo = {
      source: "owned",
      myPropertyId: property.id,
      name: property.name,
      imageUrl: property.imageUrl,
      propertyType: property.propertyType,
      ownershipStatus: property.ownershipStatus === "owned" ? "owner" : property.ownershipStatus === "rented" ? "renting_with_permission" : "unconfirmed",
      address: property.location,
      location: property.location,
      coordinates: null,
      approxAreaSqm: property.areaSqm,
      floors: property.floors,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      constructionYear: property.constructionYear,
      occupancy: property.occupancy,
      accessInfo: "",
      willBeOccupiedDuringRenovation: property.occupancy === "occupied" ? true : null,
    };
    return mutate(
      id,
      (p) => ({ ...p, property: info, status: EARLY_STATUSES.includes(p.status) ? "assessment_in_progress" : p.status }),
      { activity: activityEvent("property_selected", "assessment", "You", `Selected "${property.name}" as the property being renovated.`) }
    );
  },

  registerProperty(id: string, property: RenovationPropertyInfo): RenovationProject | undefined {
    return mutate(
      id,
      (p) => ({ ...p, property: { ...property, source: "registered" }, status: EARLY_STATUSES.includes(p.status) ? "assessment_in_progress" : p.status }),
      { activity: activityEvent("property_selected", "assessment", "You", `Registered "${property.name || "a new property"}" as the property being renovated.`) }
    );
  },

  setInspirationOnly(id: string, listingId: string, imageUrl: string, name: string): RenovationProject | undefined {
    const file: UploadedFile = {
      id: newId("upload"),
      name,
      fileType: "jpg",
      size: 0,
      category: "sketch",
      previewUrl: imageUrl,
      status: "uploaded",
      uploadedAt: new Date().toISOString(),
      uploadedBy: "You",
      description: "Added as visual inspiration only — not the property being renovated.",
    };
    return mutate(
      id,
      (p) => ({ ...p, uploads: { ...p.uploads, inspiration: [file, ...p.uploads.inspiration] } }),
      { activity: activityEvent("assessment_updated", "assessment", "You", `Added "${name}" as inspiration only.`) }
    );
  },

  updatePropertyDetails(id: string, patch: Partial<RenovationPropertyInfo>): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, property: { ...p.property, ...patch } }));
  },

  // ---- Assessment (whole-object save, called after every wizard step) ----
  saveAssessment(id: string, assessment: RenovationAssessment, note?: string): RenovationProject | undefined {
    return mutate(
      id,
      (p) => {
        const isComplete = assessment.completedSteps.includes("review") && assessment.disclaimerAccepted;
        const nextStatus: RenovationProjectStatus = EARLY_STATUSES.includes(p.status) ? (isComplete ? "ready_to_generate" : "assessment_in_progress") : p.status;
        return { ...p, assessment, status: nextStatus };
      },
      { activity: activityEvent("assessment_updated", "assessment", "You", note ?? "Updated the renovation assessment.") }
    );
  },

  // ---- Uploads ----
  addUploads(id: string, category: keyof RenovationProject["uploads"], files: UploadedFile[]): RenovationProject | undefined {
    return mutate(
      id,
      (p) => ({ ...p, uploads: { ...p.uploads, [category]: [...files, ...p.uploads[category]] } }),
      { activity: activityEvent("photograph_uploaded", "assessment", "You", `Uploaded ${files.length} file${files.length === 1 ? "" : "s"}.`) }
    );
  },

  removeUpload(id: string, category: keyof RenovationProject["uploads"], fileId: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, uploads: { ...p.uploads, [category]: p.uploads[category].filter((f) => f.id !== fileId) } }));
  },

  // ---- Brief ----
  confirmBrief(id: string, summary: string, missingInformation: string[]): RenovationProject | undefined {
    return mutate(
      id,
      (p) => ({
        ...p,
        brief: { confirmed: true, confirmedAt: new Date().toISOString(), summary, missingInformation },
        status: EARLY_STATUSES.includes(p.status) ? "ready_to_generate" : p.status,
      }),
      { activity: activityEvent("brief_confirmed", "assessment", "You", "Confirmed the renovation brief.") }
    );
  },

  // ---- Agent conversation ----
  appendAgentMessages(id: string, messages: AgentMessage[]): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, agentConversation: { ...p.agentConversation, messages: [...p.agentConversation.messages, ...messages] } }));
  },

  setExtractedRequirements(id: string, requirements: ExtractedRequirement[]): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, agentConversation: { ...p.agentConversation, extractedRequirements: requirements } }), {
      activity: activityEvent("ai_conversation_updated", "design", "You", "Updated extracted requirements from Huza AI."),
    });
  },

  clearAgentConversation(id: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, agentConversation: { messages: [], extractedRequirements: p.agentConversation.extractedRequirements } }));
  },

  // ---- Manual design ----
  saveManualDesign(id: string, design: ManualRenovationDesign, summary: string, asNewVersion = false): RenovationProject | undefined {
    return mutate(
      id,
      (p) => {
        if (!asNewVersion) return { ...p, manualDesign: design };
        const version: ProjectVersion = {
          id: newId("version"),
          number: p.versions.length + 1,
          createdAt: new Date().toISOString(),
          createdBy: "You",
          source: "manual_change",
          changeSummary: summary,
          selected: false,
        };
        return { ...p, manualDesign: design, versions: [...p.versions, version] };
      },
      { activity: activityEvent(asNewVersion ? "version_created" : "assessment_updated", "design", "You", summary) }
    );
  },

  // ---- Generation ----
  startGeneration(id: string): RenovationProject | undefined {
    return mutate(
      id,
      (p) => ({ ...p, status: "generating", generation: { status: "in_progress", currentStageIndex: 0, startedAt: new Date().toISOString(), completedStageKeys: [] } }),
      { activity: activityEvent("generation_started", "design", "Huza AI", "Started generating three renovation concepts.") }
    );
  },

  advanceGenerationStage(id: string, stageKey: GenerationStageKey, stageIndex: number): RenovationProject | undefined {
    return mutate(id, (p) => ({
      ...p,
      generation: {
        ...p.generation,
        currentStageIndex: stageIndex,
        completedStageKeys: p.generation.completedStageKeys.includes(stageKey) ? p.generation.completedStageKeys : [...p.generation.completedStageKeys, stageKey],
      },
    }));
  },

  completeGeneration(id: string, concepts: RenovationConcept[]): RenovationProject | undefined {
    return mutate(
      id,
      (p) => {
        const versions: ProjectVersion[] = concepts.map((c, i) => ({
          id: newId("version"),
          number: p.versions.length + i + 1,
          createdAt: c.generatedAt,
          createdBy: "Huza AI",
          source: "initial_ai_generation",
          changeSummary: `${c.name} concept generated from the confirmed renovation brief.`,
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
      { activity: activityEvent("concepts_created", "design", "Huza AI", "Generated Essential Refresh, Balanced Transformation and Premium Reconfiguration concepts.") }
    );
  },

  failGeneration(id: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, status: "ready_to_generate", generation: { ...p.generation, status: "failed" } }), {
      activity: activityEvent("generation_failed", "system", "Huza AI", "Concept generation failed."),
    });
  },

  cancelGeneration(id: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, status: "ready_to_generate", generation: { ...p.generation, status: "cancelled" } }), {
      activity: activityEvent("generation_cancelled", "system", "You", "Cancelled concept generation."),
    });
  },

  // ---- Concepts ----
  selectConcept(id: string, conceptId: string): RenovationProject | undefined {
    const project = this.getById(id);
    const concept = project?.concepts.find((c) => c.id === conceptId);
    return mutate(id, (p) => ({ ...p, selectedConceptId: conceptId }), {
      activity: activityEvent("concept_selected", "design", "You", `Selected "${concept?.name ?? "a concept"}" as the preferred concept.`),
    });
  },

  duplicateConceptAsVersion(id: string, conceptId: string): RenovationProject | undefined {
    const project = this.getById(id);
    const source = project?.concepts.find((c) => c.id === conceptId);
    if (!source) return undefined;
    const copy: RenovationConcept = { ...source, id: newId("concept"), version: source.version + 1, generatedAt: new Date().toISOString(), name: `${source.name} (Copy)` };
    return mutate(
      id,
      (p) => {
        const version: ProjectVersion = {
          id: newId("version"),
          number: p.versions.length + 1,
          createdAt: copy.generatedAt,
          createdBy: "You",
          source: "manual_change",
          changeSummary: `Duplicated "${source.name}" as a new version.`,
          conceptId: copy.id,
          selected: false,
        };
        return { ...p, concepts: [...p.concepts, copy], versions: [...p.versions, version] };
      },
      { activity: activityEvent("version_created", "design", "You", `Duplicated "${source.name}" as a new concept version.`) }
    );
  },

  refineConcept(id: string, conceptId: string, request: string, changeSummary: string, patch: Partial<RenovationConcept>): RenovationProject | undefined {
    const project = this.getById(id);
    const source = project?.concepts.find((c) => c.id === conceptId);
    if (!source) return undefined;
    const refined: RenovationConcept = { ...source, ...patch, id: newId("concept"), version: source.version + 1, generatedAt: new Date().toISOString() };
    return mutate(
      id,
      (p) => {
        const version: ProjectVersion = {
          id: newId("version"),
          number: p.versions.length + 1,
          createdAt: refined.generatedAt,
          createdBy: "Huza AI",
          source: "full_ai_refinement",
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
      { activity: activityEvent("version_created", "design", "You", `Requested a refinement: "${request}"`) }
    );
  },

  applyTargetedEdit(id: string, conceptId: string, edit: Omit<TargetedEdit, "id" | "createdAt" | "resultingVersionId">, patch: Partial<RenovationConcept>): RenovationProject | undefined {
    const project = this.getById(id);
    const source = project?.concepts.find((c) => c.id === conceptId);
    if (!source) return undefined;
    const edited: RenovationConcept = { ...source, ...patch, id: newId("concept"), version: source.version + 1, generatedAt: new Date().toISOString() };
    const fullEdit: TargetedEdit = { ...edit, id: newId("edit"), createdAt: new Date().toISOString(), resultingVersionId: null };
    return mutate(
      id,
      (p) => {
        const version: ProjectVersion = {
          id: newId("version"),
          number: p.versions.length + 1,
          createdAt: edited.generatedAt,
          createdBy: "Huza AI",
          source: "targeted_ai_edit",
          changeSummary: `Targeted edit: "${edit.requestedChange}"`,
          relatedAreaKey: edit.areaKey,
          conceptId: edited.id,
          selected: p.selectedConceptId === conceptId,
        };
        return {
          ...p,
          status: "refinement_in_progress",
          concepts: [...p.concepts, edited],
          versions: [...p.versions, version],
          targetedEdits: [...p.targetedEdits, { ...fullEdit, resultingVersionId: version.id }],
          selectedConceptId: p.selectedConceptId === conceptId ? edited.id : p.selectedConceptId,
        };
      },
      { activity: activityEvent("targeted_edit_generated", "design", "You", `Generated a targeted edit: "${edit.requestedChange}"`) }
    );
  },

  // ---- Versions ----
  restoreVersion(id: string, versionId: string): RenovationProject | undefined {
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

  renameVersion(id: string, versionId: string, summary: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, versions: p.versions.map((v) => (v.id === versionId ? { ...v, changeSummary: summary } : v)) }));
  },

  deleteVersion(id: string, versionId: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, versions: p.versions.filter((v) => v.id !== versionId) }));
  },

  // ---- Scope of work ----
  generateScope(id: string, items: ScopeItem[]): RenovationProject | undefined {
    return mutate(
      id,
      (p) => ({ ...p, scope: items, scopeGeneratedAt: new Date().toISOString(), status: p.status === "concepts_ready" || p.status === "refinement_in_progress" ? "scope_ready" : p.status }),
      { activity: activityEvent("scope_updated", "scope", "Huza AI", "Generated a room-by-room scope of work.") }
    );
  },

  addScopeItem(id: string, item: ScopeItem): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, scope: [...p.scope, item] }), { activity: activityEvent("scope_updated", "scope", "You", `Added scope item "${item.task}".`) });
  },

  updateScopeItem(id: string, itemId: string, patch: Partial<ScopeItem>): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, scope: p.scope.map((s) => (s.id === itemId ? { ...s, ...patch } : s)) }));
  },

  deleteScopeItem(id: string, itemId: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, scope: p.scope.filter((s) => s.id !== itemId) }), { activity: activityEvent("scope_updated", "scope", "You", "Removed a scope item.") });
  },

  reorderScopeItems(id: string, orderedIds: string[]): RenovationProject | undefined {
    return mutate(id, (p) => {
      const byId = new Map(p.scope.map((s) => [s.id, s]));
      const reordered = orderedIds.map((oid, i) => {
        const item = byId.get(oid);
        return item ? { ...item, sequence: i + 1 } : item;
      }).filter(Boolean) as ScopeItem[];
      return { ...p, scope: reordered };
    });
  },

  // ---- Budget & timeline ----
  recalculateBudget(id: string, inputs: RenovationBudgetInputs): RenovationProject | undefined {
    const estimate = calculateRenovationBudget(inputs);
    return mutate(id, (p) => ({ ...p, budget: estimate }), { activity: activityEvent("budget_recalculated", "budget", "You", "Recalculated the indicative renovation budget.") });
  },

  recalculateTimeline(id: string, inputs: TimelineInputs): RenovationProject | undefined {
    const estimate = calculateRenovationTimeline(inputs);
    return mutate(id, (p) => ({ ...p, timeline: estimate }), { activity: activityEvent("budget_recalculated", "budget", "You", "Recalculated the renovation timeline.") });
  },

  // ---- Professional review ----
  requestReview(id: string, request: Omit<ProfessionalReviewRequest, "id" | "status" | "submittedAt" | "feedback">): RenovationProject | undefined {
    const full: ProfessionalReviewRequest = { ...request, id: newId("review"), status: "submitted", submittedAt: new Date().toISOString(), feedback: [] };
    return mutate(
      id,
      (p) => ({ ...p, status: "awaiting_professional_review", reviewRequests: [full, ...p.reviewRequests] }),
      { activity: activityEvent("review_requested", "professionals", "You", `Requested a ${request.type.replace(/_/g, " ")}.`) }
    );
  },

  cancelReview(id: string, reviewId: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, reviewRequests: p.reviewRequests.map((r) => (r.id === reviewId ? { ...r, status: "cancelled" } : r)) }), {
      activity: activityEvent("review_requested", "professionals", "You", "Cancelled a professional review request."),
    });
  },

  updateReview(id: string, reviewId: string, update: (review: ProfessionalReviewRequest) => ProfessionalReviewRequest, details?: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, reviewRequests: p.reviewRequests.map((review) => review.id === reviewId ? update(review) : review) }), {
      activity: activityEvent("professional_responded", "professionals", "Professional", details ?? "Professional review updated.", undefined, reviewId),
    });
  },

  replyToFeedback(id: string, reviewId: string, feedbackId: string, reply: string): RenovationProject | undefined {
    return mutate(id, (p) => ({
      ...p,
      reviewRequests: p.reviewRequests.map((r) => (r.id === reviewId ? { ...r, feedback: r.feedback.map((f) => (f.id === feedbackId ? { ...f, response: reply } : f)) } : r)),
    }));
  },

  markFeedbackAddressed(id: string, reviewId: string, feedbackId: string, addressed: boolean): RenovationProject | undefined {
    return mutate(id, (p) => ({
      ...p,
      reviewRequests: p.reviewRequests.map((r) => (r.id === reviewId ? { ...r, feedback: r.feedback.map((f) => (f.id === feedbackId ? { ...f, addressed } : f)) } : r)),
    }));
  },

  // ---- Quotations ----
  requestQuotations(id: string, request: Omit<QuotationRequest, "id" | "requestedAt">, contractors: DemoContractor[], generatedQuotations: ContractorQuotation[]): RenovationProject | undefined {
    const full: QuotationRequest = { ...request, id: newId("quote-req"), requestedAt: new Date().toISOString() };
    return mutate(
      id,
      (p) => ({ ...p, status: "quotation_received", quotationRequest: full, quotations: generatedQuotations }),
      { activity: activityEvent("quotations_requested", "quotations", "You", `Requested quotations from ${contractors.length} contractor${contractors.length === 1 ? "" : "s"}.`) }
    );
  },

  withdrawQuotationRequest(id: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, quotationRequest: null, quotations: p.quotations.map((q) => ({ ...q, status: "withdrawn" as QuotationStatus })) }), {
      activity: activityEvent("quotations_requested", "quotations", "You", "Withdrew the quotation request."),
    });
  },

  acceptQuotation(id: string, quotationId: string): RenovationProject | undefined {
    const project = this.getById(id);
    const quotation = project?.quotations.find((q) => q.id === quotationId);
    return mutate(
      id,
      (p) => ({ ...p, status: "ready_for_execution", quotations: p.quotations.map((q) => (q.id === quotationId ? { ...q, status: "accepted" } : q)) }),
      { activity: activityEvent("quotation_accepted", "quotations", "You", `Accepted the quotation from ${quotation?.contractor.companyName ?? "a contractor"}. No payment was processed.`) }
    );
  },

  declineQuotation(id: string, quotationId: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, quotations: p.quotations.map((q) => (q.id === quotationId ? { ...q, status: "declined" } : q)) }));
  },

  updateQuotation(id: string, quotationId: string, update: (quotation: ContractorQuotation) => ContractorQuotation, details?: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, quotations: p.quotations.map((quotation) => quotation.id === quotationId ? update(quotation) : quotation) }), {
      activity: activityEvent("quotation_received", "quotations", "Contractor", details ?? "Quotation updated.", undefined, quotationId),
    });
  },

  // ---- Documents ----
  addDocuments(id: string, documents: ProjectDocument[]): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, documents: [...documents, ...p.documents] }), {
      activity: activityEvent("photograph_uploaded", "documents", "You", `Uploaded ${documents.length} document${documents.length === 1 ? "" : "s"}.`),
    });
  },

  renameDocument(id: string, documentId: string, name: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, documents: p.documents.map((d) => (d.id === documentId ? { ...d, name } : d)) }));
  },

  moveDocumentCategory(id: string, documentId: string, category: ProjectDocument["category"]): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, documents: p.documents.map((d) => (d.id === documentId ? { ...d, category } : d)) }));
  },

  archiveDocument(id: string, documentId: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, documents: p.documents.map((d) => (d.id === documentId ? { ...d, status: "archived" } : d)) }));
  },

  deleteDocument(id: string, documentId: string): RenovationProject | undefined {
    return mutate(id, (p) => ({ ...p, documents: p.documents.filter((d) => d.id !== documentId) }));
  },

  logDocumentDownload(id: string, documentName: string): RenovationProject | undefined {
    return mutate(id, (p) => p, { activity: activityEvent("document_downloaded", "documents", "You", `Downloaded "${documentName}".`) });
  },

  // ---- Activity (generic) ----
  logActivity(id: string, type: ActivityEventType, category: ActivityCategory, details?: string): RenovationProject | undefined {
    return mutate(id, (p) => p, { activity: activityEvent(type, category, "You", details) });
  },
};

export type { UploadCategory };
