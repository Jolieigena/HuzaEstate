import { BuildProjectService } from "@/lib/build/projectService";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { DEMO_PROFILES } from "./profiles";
import type {
  ActivityItem, Clarification, Consultation, Message, ProfessionalProfile,
  ProfessionalRequestView, ProfessionalState, QuotationDraft, RequestMeta, ReviewDraft, StoredFile,
} from "./types";

const STORAGE_KEY = "huzaestate_professional_workspace_v1";
type Listener = () => void;
const listeners = new Set<Listener>();
let state: ProfessionalState | null = null;
let sourceSubscriptionsReady = false;

const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const isoInDays = (days: number) => { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString(); };
const label = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function emptyState(): ProfessionalState {
  return { version: 1, profiles: DEMO_PROFILES, requestMeta: [], clarifications: [], messages: [], consultations: [], reviewDrafts: [], quotationDrafts: [], files: [], activity: [], notifications: [], settings: {}, seeded: false };
}

const SERVER_SNAPSHOT: ProfessionalState = emptyState();

function persist() {
  try { if (state) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* surfaced through isStorageAvailable */ }
}

function notify() { listeners.forEach((listener) => listener()); }

function mutate(update: (current: ProfessionalState) => ProfessionalState) {
  const current = ensureLoaded();
  state = { ...update(current), version: current.version + 1 };
  persist();
  notify();
  return state;
}

function addMeta(meta: RequestMeta) {
  if (!state || state.requestMeta.some((item) => item.requestId === meta.requestId)) return;
  state.requestMeta.push(meta);
}

function assignedProfile(originalId?: string | null): string | null {
  const aliases: Record<string, string> = { "pro-1": "pro-1", "pro-3": "pro-3", "renov-pro-1": "pro-interior", "renov-pro-2": "pro-structural", "renov-pro-3": "pro-3", "renov-pro-4": "pro-1", "contractor-imara": "contractor-imara" };
  return originalId ? aliases[originalId] ?? originalId : null;
}

function syncRequestMeta() {
  if (!state) return;
  for (const project of BuildProjectService.getSnapshot()) {
    for (const request of project.reviewRequests) {
      const profileId = assignedProfile(request.professional?.id);
      if (profileId) addMeta({ requestId: request.id, source: "build_review", projectId: project.id, assignedProfileId: profileId, customerName: "Jane Doe", desiredResponseDate: request.expectedResponseDate ?? isoInDays(4), needsProfessionalAction: ["submitted", "resubmitted", "clarification_requested"].includes(request.status) });
    }
  }
  for (const project of RenovationProjectService.getSnapshot()) {
    for (const request of project.reviewRequests) {
      const profileId = assignedProfile(request.professional?.id);
      if (profileId) addMeta({ requestId: request.id, source: "renovate_review", projectId: project.id, assignedProfileId: profileId, customerName: "Jane Doe", desiredResponseDate: request.expectedResponseDate ?? isoInDays(5), needsProfessionalAction: ["submitted", "resubmitted", "clarification_requested"].includes(request.status) });
    }
    if (project.quotationRequest) {
      for (const quotation of project.quotations) {
        const profileId = assignedProfile(quotation.contractor.id);
        if (profileId) addMeta({ requestId: project.quotationRequest.id, source: "renovate_quotation", projectId: project.id, assignedProfileId: profileId, customerName: "Jane Doe", desiredResponseDate: quotation.validUntil, needsProfessionalAction: ["requested", "viewed", "clarification_requested", "draft", "preparing_quotation"].includes(quotation.status) });
      }
    }
  }
}

/** No-op — real professional accounts don't go through this local mock
 *  workspace (see ProfessionalShell.tsx). Kept as a pass-through so callers
 *  don't need to change. */
function seedSharedCustomerRecords() {
  if (!state) return;
  state.seeded = true;
  syncRequestMeta();
}

function ensureLoaded(): ProfessionalState {
  if (state) return state;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    state = raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
  } catch { state = emptyState(); }
  seedSharedCustomerRecords();
  syncRequestMeta();
  persist();
  if (!sourceSubscriptionsReady) {
    sourceSubscriptionsReady = true;
    const sourceChanged = () => {
      if (!state) return;
      syncRequestMeta();
      state = { ...state, version: state.version + 1 };
      persist();
      notify();
    };
    BuildProjectService.subscribe(sourceChanged);
    RenovationProjectService.subscribe(sourceChanged);
  }
  return state as ProfessionalState;
}

function record(profileId: string, category: ActivityItem["category"], type: string, description: string, href?: string) {
  if (!state) return;
  state.activity.unshift({ id: id("activity"), profileId, category, type, description, createdAt: new Date().toISOString(), href });
}

function professionalNotification(profileId: string, type: string, title: string, description: string, href: string) {
  if (!state) return;
  state.notifications.unshift({ id: id("notification"), profileId, type, title, description, href, createdAt: new Date().toISOString(), read: false });
}

export const ProfessionalService = {
  subscribe(listener: Listener) { ensureLoaded(); listeners.add(listener); return () => listeners.delete(listener); },
  getSnapshot() { return ensureLoaded(); },
  getServerSnapshot(): ProfessionalState { return SERVER_SNAPSHOT; },
  isStorageAvailable() { try { const key = "__huza_pro_test__"; window.localStorage.setItem(key, "1"); window.localStorage.removeItem(key); return true; } catch { return false; } },
  getProfileForAccount(accountId?: string) { return ensureLoaded().profiles.find((profile) => profile.accountId === accountId); },
  getProfile(profileId?: string) { return ensureLoaded().profiles.find((profile) => profile.id === profileId); },
  /** Public directory listing (src/app/professionals/page.tsx) — only
   *  admin-approved profiles, same "approved" status the admin verification
   *  workflow already gates on elsewhere in this app. */
  getApprovedProfiles(): ProfessionalProfile[] { return ensureLoaded().profiles.filter((profile) => profile.status === "approved"); },
  /** A cold inquiry from a visitor who found this profile in the public
   *  directory — not tied to any existing project/request, unlike
   *  sendMessage() above. Lands as real activity/notifications in the
   *  professional's own dashboard, same as any other event this service
   *  records, so it isn't a dead end. */
  contactProfile(profileId: string, input: { name: string; email: string; message: string }): boolean {
    const profile = this.getProfile(profileId);
    if (!profile) return false;
    const preview = input.message.length > 80 ? `${input.message.slice(0, 80)}…` : input.message;
    record(profileId, "messages", "inquiry_received", `New inquiry from ${input.name} (${input.email}): "${preview}"`, "/professional/messages");
    professionalNotification(profileId, "inquiry_received", "New inquiry", `${input.name} sent a message about your profile.`, "/professional/messages");
    persist();
    notify();
    return true;
  },

  getRequests(profileId: string): ProfessionalRequestView[] {
    const current = ensureLoaded();
    const views: ProfessionalRequestView[] = [];
    for (const meta of current.requestMeta.filter((item) => item.assignedProfileId === profileId)) {
      if (meta.source === "build_review") {
        const project = BuildProjectService.getById(meta.projectId); const request = project?.reviewRequests.find((item) => item.id === meta.requestId); if (!project || !request) continue;
        views.push({ id: request.id, source: meta.source, projectId: project.id, projectName: project.name, projectType: "Build", requestType: label(request.type), customerName: meta.customerName, location: [project.brief.basics.district, project.brief.basics.provinceOrCity].filter(Boolean).join(", ") || project.country, sharedVersion: project.versions.find((version) => version.id === request.versionId)?.changeSummary ?? "Selected concept", submittedAt: request.submittedAt, desiredResponseDate: meta.desiredResponseDate, status: request.status, assignedProfileId: profileId, questions: request.notes, documentIds: request.attachedDocumentIds, safetyFlag: false, professionalActionRequired: meta.needsProfessionalAction ?? false });
      } else if (meta.source === "renovate_review") {
        const project = RenovationProjectService.getById(meta.projectId); const request = project?.reviewRequests.find((item) => item.id === meta.requestId); if (!project || !request) continue;
        views.push({ id: request.id, source: meta.source, projectId: project.id, projectName: project.name, projectType: "Renovate", requestType: label(request.type), customerName: meta.customerName, location: project.property.location || project.property.address, sharedVersion: project.versions.find((version) => version.id === request.projectVersionId)?.changeSummary ?? "Selected renovation concept", submittedAt: request.submittedAt, desiredResponseDate: meta.desiredResponseDate, status: request.status, assignedProfileId: profileId, questions: request.questions, documentIds: request.documentIds, safetyFlag: Object.values(project.assessment.safety.concerns).some((value) => value === "yes" || value === "unknown"), professionalActionRequired: meta.needsProfessionalAction ?? false });
      } else {
        const project = RenovationProjectService.getById(meta.projectId); const quotation = project?.quotations.find((item) => assignedProfile(item.contractor.id) === profileId); if (!project || !project.quotationRequest || !quotation) continue;
        views.push({ id: project.quotationRequest.id, source: meta.source, projectId: project.id, projectName: project.name, projectType: "Renovate", requestType: "Contractor quotation", customerName: meta.customerName, location: project.property.location || project.property.address, sharedVersion: project.versions.find((version) => version.selected)?.changeSummary ?? "Shared scope", submittedAt: project.quotationRequest.requestedAt, desiredResponseDate: meta.desiredResponseDate, status: quotation.status, assignedProfileId: profileId, questions: project.quotationRequest.notes, documentIds: project.quotationRequest.documentIds, safetyFlag: Object.values(project.assessment.safety.concerns).some((value) => value === "yes" || value === "unknown"), professionalActionRequired: meta.needsProfessionalAction ?? false, quotationId: quotation.id });
      }
    }
    return views.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  },
  getRequest(profileId: string, requestId: string) { return this.getRequests(profileId).find((request) => request.id === requestId); },

  setRequestStatus(profileId: string, requestId: string, status: string, details: string) {
    const request = this.getRequest(profileId, requestId); if (!request) return false;
    if (request.source === "build_review") BuildProjectService.updateReview(request.projectId, requestId, (item) => ({ ...item, status: status as typeof item.status, expectedResponseDate: status === "accepted" ? isoInDays(4) : item.expectedResponseDate }), details);
    else if (request.source === "renovate_review") RenovationProjectService.updateReview(request.projectId, requestId, (item) => ({ ...item, status: status as typeof item.status, expectedResponseDate: status === "accepted" ? isoInDays(4) : item.expectedResponseDate }), details);
    else if (request.quotationId) RenovationProjectService.updateQuotation(request.projectId, request.quotationId, (item) => ({ ...item, status: status as typeof item.status }), details);
    mutate((current) => ({ ...current, requestMeta: current.requestMeta.map((meta) => meta.requestId === requestId && meta.assignedProfileId === profileId ? { ...meta, acceptedAt: status === "accepted" ? new Date().toISOString() : meta.acceptedAt, needsProfessionalAction: false } : meta) }));
    record(profileId, "requests", `request_${status}`, details, `/professional/requests/${requestId}`); professionalNotification(profileId, `request_${status}`, `Request ${label(status)}`, details, `/professional/requests/${requestId}`); persist(); notify(); return true;
  },
  declineRequest(profileId: string, requestId: string, reason: string, internalNote: string) {
    const ok = this.setRequestStatus(profileId, requestId, "declined", `Request declined: ${reason}.`); if (!ok) return false;
    mutate((current) => ({ ...current, requestMeta: current.requestMeta.map((meta) => meta.requestId === requestId && meta.assignedProfileId === profileId ? { ...meta, declineReason: reason, internalDeclineNote: internalNote } : meta) })); return true;
  },
  addClarification(profileId: string, requestId: string, input: Omit<Clarification, "id" | "profileId" | "requestId" | "createdAt">) {
    const clarification: Clarification = { ...input, id: id("clarification"), profileId, requestId, createdAt: new Date().toISOString() };
    mutate((current) => ({ ...current, clarifications: [clarification, ...current.clarifications], messages: [{ id: id("message"), requestId, profileId, sender: "system", text: `Clarification requested: ${input.question}`, createdAt: new Date().toISOString(), read: true }, ...current.messages] }));
    const request = this.getRequest(profileId, requestId);
    if (request && request.source !== "renovate_quotation") this.addReviewComment(profileId, requestId, { title: "Clarification requested", description: input.question, category: input.category, severity: input.category === "Safety" ? "critical" : "info", recommendation: input.blocksWork ? "Please respond before professional work continues." : "Please respond when practical.", customerActionRequired: true });
    this.setRequestStatus(profileId, requestId, "clarification_requested", "Professional requested clarification from the customer."); return clarification;
  },
  respondToClarification(clarificationId: string, response: string) { mutate((current) => ({ ...current, clarifications: current.clarifications.map((item) => item.id === clarificationId ? { ...item, response, respondedAt: new Date().toISOString() } : item) })); },
  sendMessage(profileId: string, requestId: string, text: string) { const message: Message = { id: id("message"), profileId, requestId, sender: "professional", text, createdAt: new Date().toISOString(), read: true }; mutate((current) => ({ ...current, messages: [...current.messages, message] })); record(profileId, "messages", "message_sent", "Message sent to customer.", "/professional/messages"); persist(); notify(); return message; },
  addReviewComment(profileId: string, requestId: string, input: { title: string; description: string; category: string; severity: "info" | "recommendation" | "issue" | "critical"; recommendation: string; customerActionRequired: boolean }) {
    const request = this.getRequest(profileId, requestId); const profile = this.getProfile(profileId); if (!request || !profile || request.source === "renovate_quotation") return false;
    if (request.source === "build_review") BuildProjectService.updateReview(request.projectId, requestId, (review) => ({ ...review, feedback: [...review.feedback, { id: id("feedback"), authorName: profile.displayName, authorProfession: profile.primarySpecialisation, createdAt: new Date().toISOString(), comment: input.description, severity: input.severity, addressed: false, title: input.title, category: input.category, recommendation: input.recommendation, customerActionRequired: input.customerActionRequired }] }), "Professional added a review comment.");
    else RenovationProjectService.updateReview(request.projectId, requestId, (review) => ({ ...review, feedback: [...review.feedback, { id: id("feedback"), authorName: profile.displayName, authorProfession: profile.primarySpecialisation, createdAt: new Date().toISOString(), comment: input.description, severity: input.severity, recommendation: input.recommendation, inspectionRequired: input.category === "Safety", addressed: false, title: input.title, category: input.category, customerActionRequired: input.customerActionRequired }] }), "Professional added a review comment.");
    record(profileId, "reviews", "comment_added", `Review comment added: ${input.title}.`, `/professional/reviews/${requestId}`); persist(); notify(); return true;
  },
  saveReviewDraft(profileId: string, requestId: string, update: Partial<ReviewDraft>) { mutate((current) => { const existing = current.reviewDrafts.find((draft) => draft.requestId === requestId) ?? { requestId, checklist: {}, privateNotes: "", annotations: [], lockedVersions: [] }; return { ...current, reviewDrafts: [...current.reviewDrafts.filter((draft) => draft.requestId !== requestId), { ...existing, ...update }] }; }); record(profileId, "reviews", "review_draft_saved", "Review draft saved privately.", `/professional/reviews/${requestId}`); persist(); notify(); },
  submitReview(profileId: string, requestId: string, outcome: string, summary: string) { const request = this.getRequest(profileId, requestId); if (!request || request.source === "renovate_quotation") return false; const draft = ensureLoaded().reviewDrafts.find((item) => item.requestId === requestId); const locked = { version: (draft?.lockedVersions.length ?? 0) + 1, submittedAt: new Date().toISOString(), outcome, summary }; this.saveReviewDraft(profileId, requestId, { outcome, summary, lockedVersions: [...(draft?.lockedVersions ?? []), locked] }); const status = outcome === "Changes required" || outcome === "Additional information required" ? "changes_requested" : "completed"; if (request.source === "build_review") BuildProjectService.updateReview(request.projectId, requestId, (item) => ({ ...item, status, outcome, customerVisibleSummary: summary }), "Professional review submitted to the customer."); else RenovationProjectService.updateReview(request.projectId, requestId, (item) => ({ ...item, status, outcome, customerVisibleSummary: summary }), "Professional review submitted to the customer."); record(profileId, "reviews", "review_submitted", `Review submitted: ${outcome}.`, `/professional/reviews/${requestId}`); persist(); notify(); return true; },
  saveQuotationDraft(profileId: string, draft: QuotationDraft) { mutate((current) => ({ ...current, quotationDrafts: [...current.quotationDrafts.filter((item) => item.quotationId !== draft.quotationId), draft] })); record(profileId, "quotations", "quotation_drafted", "Quotation draft saved.", `/professional/quotations/${draft.quotationId}`); persist(); notify(); },
  submitQuotation(profileId: string, quotationId: string, total: number, changes = "Initial itemised quotation") { const request = this.getRequests(profileId).find((item) => item.quotationId === quotationId); if (!request) return false; const draft = ensureLoaded().quotationDrafts.find((item) => item.quotationId === quotationId); const version = { version: (draft?.versions.length ?? 0) + 1, submittedAt: new Date().toISOString(), total, changes, validUntil: draft?.validUntil ?? isoInDays(30), status: "Submitted" }; if (draft) this.saveQuotationDraft(profileId, { ...draft, versions: [...draft.versions, version] }); RenovationProjectService.updateQuotation(request.projectId, quotationId, (quotation) => ({ ...quotation, status: draft?.versions.length ? "revised" : "submitted", total, validUntil: draft?.validUntil ?? quotation.validUntil, proposedDurationWeeks: draft?.durationWeeks ?? quotation.proposedDurationWeeks, includedScope: draft?.inclusions ?? quotation.includedScope, excludedScope: draft?.exclusions ?? quotation.excludedScope, paymentSchedule: draft?.paymentSchedule.join("; ") ?? quotation.paymentSchedule, warrantyInfo: draft?.warranty ?? quotation.warrantyInfo, assumptions: draft?.assumptions ?? quotation.assumptions }), "Contractor submitted an itemised quotation. No payment was processed."); record(profileId, "quotations", "quotation_submitted", `Quotation version ${version.version} submitted. No payment was processed.`, `/professional/quotations/${quotationId}`); persist(); notify(); return true; },
  addConsultation(profileId: string, consultation: Omit<Consultation, "id" | "profileId">) { const full = { ...consultation, id: id("consultation"), profileId }; mutate((current) => ({ ...current, consultations: [full, ...current.consultations] })); record(profileId, "consultations", "consultation_scheduled", `${consultation.type} proposed.`, "/professional/calendar"); persist(); notify(); return full; },
  updateConsultation(profileId: string, consultationId: string, update: Partial<Consultation>) { mutate((current) => ({ ...current, consultations: current.consultations.map((item) => item.id === consultationId && item.profileId === profileId ? { ...item, ...update } : item) })); },
  addFile(profileId: string, file: Omit<StoredFile, "id" | "ownerProfileId" | "createdAt">) { const stored = { ...file, id: id("file"), ownerProfileId: profileId, createdAt: new Date().toISOString() }; mutate((current) => ({ ...current, files: [stored, ...current.files] })); record(profileId, "documents", "file_added", `${file.name} added.`, "/professional/documents"); persist(); notify(); return stored; },
  removeOwnDraftFile(profileId: string, fileId: string) { mutate((current) => ({ ...current, files: current.files.filter((file) => !(file.id === fileId && file.ownerProfileId === profileId && !file.submitted)) })); },
  updateProfile(profileId: string, update: Partial<ProfessionalProfile>) { mutate((current) => ({ ...current, profiles: current.profiles.map((profile) => profile.id === profileId ? { ...profile, ...update, lastUpdatedAt: new Date().toISOString() } : profile) })); record(profileId, "profile", "profile_updated", "Professional profile updated.", "/professional/profile"); persist(); notify(); },
  updateSettings(profileId: string, update: Record<string, boolean | string>) { mutate((current) => ({ ...current, settings: { ...current.settings, [profileId]: { ...current.settings[profileId], ...update } } })); },
  markNotification(profileId: string, notificationId?: string) { mutate((current) => ({ ...current, notifications: current.notifications.map((item) => item.profileId === profileId && (!notificationId || item.id === notificationId) ? { ...item, read: true } : item) })); },
};

export function quotationTotal(draft: QuotationDraft) {
  const requiredLines = draft.lines.filter((line) => !line.optional);
  const subtotal = requiredLines.reduce((sum, line) => sum + line.quantity * (line.materialUnitCost + line.labourUnitCost) + line.otherCost, 0);
  const afterDiscount = Math.max(0, subtotal - draft.discount);
  const contingency = afterDiscount * (draft.contingencyPct / 100);
  const tax = (afterDiscount + contingency) * (draft.taxPct / 100);
  return { materials: requiredLines.reduce((sum, line) => sum + line.quantity * line.materialUnitCost, 0), labour: requiredLines.reduce((sum, line) => sum + line.quantity * line.labourUnitCost, 0), other: requiredLines.reduce((sum, line) => sum + line.otherCost, 0), optional: draft.lines.filter((line) => line.optional).reduce((sum, line) => sum + line.quantity * (line.materialUnitCost + line.labourUnitCost) + line.otherCost, 0), subtotal, contingency, tax, total: afterDiscount + contingency + tax };
}
