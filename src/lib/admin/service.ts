import { ProfessionalService } from "@/lib/professional/service";
import { ADMIN_STORAGE_KEY } from "./featureFlags";
import { buildInitialAdminState, seedSharedRecords } from "./seed";
import type {
  AccountRestriction, AccountRestrictionKind, AccountStatus, AdminNote, AdminRole,
  AdminState, AdminUserRecord, AiFeatureFlags, AuditLogEntry, ContentArea, ContentItem, ContentStatus,
  Dispute, DisputeStatus, DocumentReviewDecision, ListingModerationStatus, PlatformSettings, PrivilegedAccessReason,
  SupportCase, SupportCategory, SupportPriority, SupportStatus, VerificationHistoryEntry,
} from "./types";

type Listener = () => void;
const listeners = new Set<Listener>();
let state: AdminState | null = null;

const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const SERVER_SNAPSHOT: AdminState = buildInitialAdminState();

function persist() {
  try {
    if (state) window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // surfaced through isStorageAvailable
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

function mutate(update: (current: AdminState) => AdminState) {
  const current = ensureLoaded();
  state = { ...update(current), version: current.version + 1 };
  persist();
  notify();
  return state;
}

function ensureLoaded(): AdminState {
  if (state) return state;
  try {
    const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
    state = raw ? { ...buildInitialAdminState(), ...JSON.parse(raw) } : buildInitialAdminState();
  } catch {
    state = buildInitialAdminState();
  }
  state = seedSharedRecords(state as AdminState);
  persist();
  return state;
}

/** Appends an append-only audit entry. Called explicitly by every mutating
 * admin action (not automatically inside `mutate`, since only the calling
 * method knows the actor/action/resource semantics worth recording). */
function logAudit(entry: Omit<AuditLogEntry, "id" | "at">) {
  if (!state) return;
  state.auditLog.unshift({ ...entry, id: id("audit"), at: new Date().toISOString() });
}

function notifyAdmins(type: string, title: string, description: string, href: string, recipientAccountId?: string) {
  if (!state) return;
  state.notifications.unshift({ id: id("admin_notification"), recipientAccountId, type, title, description, href, createdAt: new Date().toISOString(), read: false });
}

function addVerificationHistory(entry: Omit<VerificationHistoryEntry, "id" | "at">) {
  if (!state) return;
  state.verificationHistory.unshift({ ...entry, id: id("verification"), at: new Date().toISOString() });
}

function actorLabel(state: AdminState, actorAccountId: string) {
  return state.users[actorAccountId]?.name ?? actorAccountId;
}

export const AdminService = {
  subscribe(listener: Listener) {
    ensureLoaded();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return ensureLoaded();
  },
  getServerSnapshot(): AdminState {
    return SERVER_SNAPSHOT;
  },
  isStorageAvailable() {
    try {
      const key = "__huza_admin_test__";
      window.localStorage.setItem(key, "1");
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  getRoleAssignment(accountId?: string) {
    return ensureLoaded().roleAssignments.find((item) => item.accountId === accountId);
  },
  getAdminRole(accountId?: string): AdminRole | undefined {
    return this.getRoleAssignment(accountId)?.role;
  },
  countActiveSuperAdmins() {
    return ensureLoaded().roleAssignments.filter((item) => item.role === "super_admin").length;
  },

  assignRole(accountId: string, role: AdminRole, actorAccountId: string, reason: string, expiresAt?: string) {
    const current = ensureLoaded();
    const previous = current.roleAssignments.find((item) => item.accountId === accountId);
    mutate((state) => ({
      ...state,
      roleAssignments: [
        ...state.roleAssignments.filter((item) => item.accountId !== accountId),
        { accountId, role, assignedAt: new Date().toISOString(), assignedBy: actorAccountId, reason, expiresAt },
      ],
    }));
    logAudit({ actorAccountId, actorName: actorLabel(current, actorAccountId), actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "role_assigned", resourceType: "administrative_role", resourceId: accountId, previousValueSummary: previous ? previous.role : "No administrative role", newValueSummary: role, reason, result: "success" });
    notifyAdmins("role_assigned", "Administrative role assigned", `${current.users[accountId]?.name ?? accountId} was assigned ${role.replace(/_/g, " ")}.`, "/admin/roles", accountId);
    persist();
    notify();
    return { blocked: false as const };
  },
  removeRoleAssignment(accountId: string, actorAccountId: string, reason: string) {
    const current = ensureLoaded();
    const assignment = current.roleAssignments.find((item) => item.accountId === accountId);
    if (!assignment) return { blocked: false as const };
    if (assignment.role === "super_admin" && this.countActiveSuperAdmins() <= 1) {
      logAudit({ actorAccountId, actorName: actorLabel(current, actorAccountId), actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "role_removal_blocked", resourceType: "administrative_role", resourceId: accountId, reason: "Cannot remove the last active Super Administrator.", result: "blocked" });
      persist();
      notify();
      return { blocked: true as const, message: "Cannot remove the last active Super Administrator." };
    }
    mutate((state) => ({ ...state, roleAssignments: state.roleAssignments.filter((item) => item.accountId !== accountId) }));
    logAudit({ actorAccountId, actorName: actorLabel(current, actorAccountId), actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "role_removed", resourceType: "administrative_role", resourceId: accountId, previousValueSummary: assignment.role, reason, result: "success" });
    persist();
    notify();
    return { blocked: false as const };
  },

  listApplications() {
    return ProfessionalService.getSnapshot().profiles;
  },
  getApplication(profileId?: string) {
    return ProfessionalService.getProfile(profileId);
  },
  getVerificationHistory(profileId: string): VerificationHistoryEntry[] {
    return ensureLoaded().verificationHistory.filter((item) => item.profileId === profileId);
  },
  getLatestDocumentDecision(profileId: string, documentLabel: string): DocumentReviewDecision {
    const entries = this.getVerificationHistory(profileId).filter((item) => item.action === "document_reviewed" && item.documentLabel === documentLabel);
    return entries[0]?.documentDecision ?? "not_reviewed";
  },
  assignApplication(profileId: string, officerAccountId: string, actorAccountId: string) {
    const current = ensureLoaded();
    mutate((state) => ({ ...state, applicationAssignments: { ...state.applicationAssignments, [profileId]: officerAccountId } }));
    logAudit({ actorAccountId, actorName: actorLabel(current, actorAccountId), actorRole: this.getAdminRole(actorAccountId) ?? "system", action: officerAccountId === actorAccountId ? "application_assigned_to_self" : "application_reassigned", resourceType: "professional_application", resourceId: profileId, newValueSummary: actorLabel(current, officerAccountId), result: "success" });
    addVerificationHistory({ profileId, action: "assigned", actorAccountId, actorName: actorLabel(current, actorAccountId), detail: `Assigned to ${actorLabel(current, officerAccountId)}.` });
    persist();
    notify();
  },
  addApplicationNote(profileId: string, actorAccountId: string, actorName: string, text: string) {
    addVerificationHistory({ profileId, action: "note_added", actorAccountId, actorName, detail: text });
    persist();
    notify();
  },
  reviewDocument(profileId: string, documentLabel: string, decision: DocumentReviewDecision, actorAccountId: string, actorName: string) {
    addVerificationHistory({ profileId, action: "document_reviewed", actorAccountId, actorName, detail: `${documentLabel}: ${decision.replace(/_/g, " ")}`, documentLabel, documentDecision: decision });
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "document_reviewed", resourceType: "professional_application", resourceId: profileId, newValueSummary: `${documentLabel}: ${decision}`, result: "success" });
    persist();
    notify();
  },
  requestApplicationInformation(profileId: string, actorAccountId: string, actorName: string, detail: string) {
    ProfessionalService.updateProfile(profileId, { status: "more_information_required", verificationLabel: "More information required" });
    addVerificationHistory({ profileId, action: "info_requested", actorAccountId, actorName, detail });
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "information_requested", resourceType: "professional_application", resourceId: profileId, reason: detail, result: "success" });
    persist();
    notify();
  },
  approveApplication(profileId: string, actorAccountId: string, actorName: string, note: string) {
    ProfessionalService.updateProfile(profileId, { status: "approved", verificationLabel: "Demo verified", demoVerified: true });
    addVerificationHistory({ profileId, action: "approved", actorAccountId, actorName, detail: note || "Application approved." });
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "professional_approved", resourceType: "professional_application", resourceId: profileId, newValueSummary: "approved", reason: note, result: "success" });
    notifyAdmins("professional_approved", "Professional application approved", `${actorName} approved an application.`, `/admin/professionals/${profileId}`);
    persist();
    notify();
  },
  rejectApplication(profileId: string, actorAccountId: string, actorName: string, category: string, internalReason: string, applicantVisibleReason: string, reapplicationAllowed: boolean, earliestReapplicationDate?: string) {
    ProfessionalService.updateProfile(profileId, { status: "rejected", verificationLabel: "Not approved" });
    const reapplyNote = reapplicationAllowed ? (earliestReapplicationDate ? ` Reapplication is possible from ${earliestReapplicationDate}.` : " Reapplication is possible.") : " Reapplication is not currently permitted.";
    addVerificationHistory({ profileId, action: "rejected", actorAccountId, actorName, detail: `${category} — ${applicantVisibleReason}${reapplyNote}${internalReason ? ` (Internal: ${internalReason})` : ""}` });
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "professional_rejected", resourceType: "professional_application", resourceId: profileId, newValueSummary: "rejected", reason: internalReason || `${category}: ${applicantVisibleReason}`, result: "success" });
    persist();
    notify();
  },
  suspendVerification(profileId: string, actorAccountId: string, actorName: string, reason: string) {
    ProfessionalService.updateProfile(profileId, { status: "suspended", verificationLabel: "Verification suspended", acceptingNewWork: false });
    addVerificationHistory({ profileId, action: "suspended", actorAccountId, actorName, detail: reason });
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "verification_suspended", resourceType: "professional_application", resourceId: profileId, newValueSummary: "suspended", reason, result: "success" });
    persist();
    notify();
  },
  restoreVerification(profileId: string, actorAccountId: string, actorName: string) {
    ProfessionalService.updateProfile(profileId, { status: "approved", verificationLabel: "Demo verified", demoVerified: true });
    addVerificationHistory({ profileId, action: "restored", actorAccountId, actorName, detail: "Verification restored." });
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "verification_restored", resourceType: "professional_application", resourceId: profileId, newValueSummary: "approved", result: "success" });
    persist();
    notify();
  },

  getModerationRecord(propertyId: string) {
    return ensureLoaded().listingModeration[propertyId];
  },
  setListingStatus(propertyId: string, status: ListingModerationStatus, actorAccountId: string, actorName: string, reason?: string, customerVisibleExplanation?: string) {
    const current = ensureLoaded();
    const existing = current.listingModeration[propertyId];
    const record = {
      propertyId,
      status,
      reason,
      customerVisibleExplanation,
      reportCount: existing?.reportCount ?? 0,
      assignedModerator: existing?.assignedModerator,
      updatedAt: new Date().toISOString(),
      updatedBy: actorAccountId,
      history: [{ status, at: new Date().toISOString(), actorAccountId, reason }, ...(existing?.history ?? [])],
    };
    mutate((state) => ({ ...state, listingModeration: { ...state.listingModeration, [propertyId]: record } }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "listing_status_changed", resourceType: "property_listing", resourceId: propertyId, previousValueSummary: existing?.status ?? "published", newValueSummary: status, reason, result: "success" });
    persist();
    notify();
  },
  assignModerator(propertyId: string, moderatorAccountId: string, actorAccountId: string, actorName: string) {
    const current = ensureLoaded();
    const existing = current.listingModeration[propertyId];
    if (!existing) return;
    mutate((state) => ({ ...state, listingModeration: { ...state.listingModeration, [propertyId]: { ...existing, assignedModerator: moderatorAccountId } } }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "listing_moderator_assigned", resourceType: "property_listing", resourceId: propertyId, newValueSummary: actorLabel(current, moderatorAccountId), result: "success" });
    persist();
    notify();
  },

  getProjectFlag(projectId: string) {
    return ensureLoaded().projectFlags[projectId];
  },
  setAiGenerationRestricted(projectId: string, restricted: boolean, actorAccountId: string, actorName: string, reason?: string) {
    mutate((state) => ({
      ...state,
      projectFlags: { ...state.projectFlags, [projectId]: { projectId, aiGenerationRestricted: restricted, restrictedReason: restricted ? reason : undefined, restrictedBy: restricted ? actorAccountId : undefined, restrictedAt: restricted ? new Date().toISOString() : undefined } },
    }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: restricted ? "ai_generation_restricted" : "ai_generation_unrestricted", resourceType: "project", resourceId: projectId, reason, result: "success" });
    persist();
    notify();
  },
  recordPrivilegedAccess(projectId: string, module: "build" | "renovate", actorAccountId: string, actorName: string, reason: PrivilegedAccessReason, caseReference: string) {
    const entry = { id: id("access"), module, projectId, actorAccountId, actorName, reason, caseReference, at: new Date().toISOString() };
    mutate((state) => ({ ...state, privilegedAccessLog: [entry, ...state.privilegedAccessLog] }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "private_project_accessed", resourceType: "project", resourceId: projectId, reason: `${reason}: ${caseReference}`, result: "success" });
    persist();
    notify();
  },
  // ---- Support cases ----
  listSupportCases(): SupportCase[] {
    return [...ensureLoaded().supportCases].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  getSupportCase(caseId?: string) {
    return ensureLoaded().supportCases.find((item) => item.id === caseId);
  },
  createSupportCase(input: { requesterAccountId: string; requesterName: string; category: SupportCategory; priority: SupportPriority; subject: string; description: string; relatedProjectId?: string; relatedListingId?: string; relatedRequestId?: string; relatedQuotationId?: string }, actorAccountId: string, actorName: string) {
    const now = new Date().toISOString();
    const reference = `SUP-${1000 + ensureLoaded().supportCases.length}`;
    const record: SupportCase = { id: id("support"), reference, status: "new", createdAt: now, updatedAt: now, messages: [], statusHistory: [{ status: "new", at: now, actorAccountId }], ...input };
    mutate((state) => ({ ...state, supportCases: [record, ...state.supportCases] }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "support_case_created", resourceType: "support_case", resourceId: record.id, newValueSummary: record.reference, result: "success" });
    if (input.priority === "high" || input.priority === "urgent") notifyAdmins("high_priority_support_case", "High-priority support case", `${record.reference}: ${record.subject}`, `/admin/support/${record.id}`);
    persist();
    notify();
    return record;
  },
  updateSupportCaseStatus(caseId: string, status: SupportStatus, actorAccountId: string, actorName: string, note?: string) {
    const current = ensureLoaded();
    const existing = current.supportCases.find((item) => item.id === caseId);
    if (!existing) return;
    mutate((state) => ({ ...state, supportCases: state.supportCases.map((item) => (item.id === caseId ? { ...item, status, updatedAt: new Date().toISOString(), statusHistory: [...item.statusHistory, { status, at: new Date().toISOString(), actorAccountId, note }] } : item)) }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "support_case_status_changed", resourceType: "support_case", resourceId: caseId, previousValueSummary: existing.status, newValueSummary: status, reason: note, result: "success" });
    if (status === "escalated") notifyAdmins("support_case_escalated", "Support case escalated", `${existing.reference}: ${existing.subject}`, `/admin/support/${caseId}`);
    persist();
    notify();
  },
  assignSupportCase(caseId: string, assigneeAccountId: string, actorAccountId: string, actorName: string) {
    mutate((state) => ({ ...state, supportCases: state.supportCases.map((item) => (item.id === caseId ? { ...item, assignedTo: assigneeAccountId, status: item.status === "new" ? "assigned" : item.status, updatedAt: new Date().toISOString() } : item)) }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "support_case_assigned", resourceType: "support_case", resourceId: caseId, newValueSummary: actorLabel(ensureLoaded(), assigneeAccountId), result: "success" });
    persist();
    notify();
  },
  setSupportCasePriority(caseId: string, priority: SupportPriority, actorAccountId: string, actorName: string) {
    mutate((state) => ({ ...state, supportCases: state.supportCases.map((item) => (item.id === caseId ? { ...item, priority, updatedAt: new Date().toISOString() } : item)) }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "support_case_priority_changed", resourceType: "support_case", resourceId: caseId, newValueSummary: priority, result: "success" });
    persist();
    notify();
  },
  addSupportMessage(caseId: string, text: string, visibility: "customer" | "internal", actorAccountId: string, actorName: string) {
    const message = { id: id("support_msg"), caseId, authorAccountId: actorAccountId, authorName: actorName, visibility, text, createdAt: new Date().toISOString() };
    mutate((state) => ({ ...state, supportCases: state.supportCases.map((item) => (item.id === caseId ? { ...item, messages: [...item.messages, message], updatedAt: new Date().toISOString() } : item)) }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: visibility === "customer" ? "support_response_sent" : "support_note_added", resourceType: "support_case", resourceId: caseId, result: "success" });
    persist();
    notify();
  },
  resolveSupportCase(caseId: string, resolution: string, actorAccountId: string, actorName: string) {
    mutate((state) => ({ ...state, supportCases: state.supportCases.map((item) => (item.id === caseId ? { ...item, status: "resolved", resolution, updatedAt: new Date().toISOString(), statusHistory: [...item.statusHistory, { status: "resolved", at: new Date().toISOString(), actorAccountId, note: resolution }] } : item)) }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "support_case_resolved", resourceType: "support_case", resourceId: caseId, reason: resolution, result: "success" });
    persist();
    notify();
  },

  // ---- Disputes ----
  listDisputes(): Dispute[] {
    return [...ensureLoaded().disputes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  getDispute(disputeId?: string) {
    return ensureLoaded().disputes.find((item) => item.id === disputeId);
  },
  updateDisputeStatus(disputeId: string, status: DisputeStatus, actorAccountId: string, actorName: string, note?: string) {
    const current = ensureLoaded();
    const existing = current.disputes.find((item) => item.id === disputeId);
    if (!existing) return;
    mutate((state) => ({ ...state, disputes: state.disputes.map((item) => (item.id === disputeId ? { ...item, status, updatedAt: new Date().toISOString(), statusHistory: [...item.statusHistory, { status, at: new Date().toISOString(), actorAccountId, note }] } : item)) }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "dispute_status_changed", resourceType: "dispute", resourceId: disputeId, previousValueSummary: existing.status, newValueSummary: status, reason: note, result: "success" });
    persist();
    notify();
  },
  addDisputeNote(disputeId: string, actorAccountId: string, actorName: string, text: string) {
    const note: AdminNote = { id: id("note"), authorAccountId: actorAccountId, authorName: actorName, text, createdAt: new Date().toISOString() };
    mutate((state) => ({ ...state, disputes: state.disputes.map((item) => (item.id === disputeId ? { ...item, internalNotes: [note, ...item.internalNotes], updatedAt: new Date().toISOString() } : item)) }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "dispute_note_added", resourceType: "dispute", resourceId: disputeId, result: "success" });
    persist();
    notify();
  },
  recordRespondentResponse(disputeId: string, response: string, actorAccountId: string, actorName: string) {
    mutate((state) => ({ ...state, disputes: state.disputes.map((item) => (item.id === disputeId ? { ...item, respondentResponse: response, status: "under_review", updatedAt: new Date().toISOString(), statusHistory: [...item.statusHistory, { status: "under_review", at: new Date().toISOString(), actorAccountId, note: "Respondent response recorded." }] } : item)) }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "dispute_response_recorded", resourceType: "dispute", resourceId: disputeId, result: "success" });
    persist();
    notify();
  },
  proposeDisputeResolution(disputeId: string, proposal: string, actorAccountId: string, actorName: string) {
    mutate((state) => ({ ...state, disputes: state.disputes.map((item) => (item.id === disputeId ? { ...item, proposedResolution: proposal, status: "resolution_proposed", updatedAt: new Date().toISOString(), statusHistory: [...item.statusHistory, { status: "resolution_proposed", at: new Date().toISOString(), actorAccountId, note: proposal }] } : item)) }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "dispute_resolution_proposed", resourceType: "dispute", resourceId: disputeId, reason: proposal, result: "success" });
    persist();
    notify();
  },
  closeDispute(disputeId: string, finalOutcome: string, actorAccountId: string, actorName: string) {
    mutate((state) => ({ ...state, disputes: state.disputes.map((item) => (item.id === disputeId ? { ...item, finalOutcome, status: "closed", updatedAt: new Date().toISOString(), statusHistory: [...item.statusHistory, { status: "closed", at: new Date().toISOString(), actorAccountId, note: finalOutcome }] } : item)) }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "dispute_closed", resourceType: "dispute", resourceId: disputeId, reason: finalOutcome, result: "success" });
    persist();
    notify();
  },

  // ---- AI operations ----
  listAiGenerations() {
    return [...ensureLoaded().aiGenerations].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  updateAiFeatureFlags(update: Partial<AiFeatureFlags>, actorAccountId: string, actorName: string) {
    const current = ensureLoaded();
    mutate((state) => ({ ...state, aiFeatureFlags: { ...state.aiFeatureFlags, ...update } }));
    for (const [key, value] of Object.entries(update)) {
      logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "ai_setting_changed", resourceType: "ai_configuration", resourceId: key, previousValueSummary: String((current.aiFeatureFlags as unknown as Record<string, unknown>)[key]), newValueSummary: String(value), result: "success" });
    }
    persist();
    notify();
  },
  resolveAiFailure(generationId: string, actorAccountId: string, actorName: string, note: string) {
    mutate((state) => ({ ...state, aiGenerations: state.aiGenerations.map((item) => (item.id === generationId ? { ...item, resolved: true, operationalNote: note } : item)) }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "ai_failure_resolved", resourceType: "ai_generation", resourceId: generationId, reason: note, result: "success" });
    persist();
    notify();
  },
  linkAiFailureToSupportCase(generationId: string, supportCaseId: string, actorAccountId: string, actorName: string) {
    mutate((state) => ({ ...state, aiGenerations: state.aiGenerations.map((item) => (item.id === generationId ? { ...item, linkedSupportCaseId: supportCaseId } : item)) }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "ai_failure_linked_to_case", resourceType: "ai_generation", resourceId: generationId, newValueSummary: supportCaseId, result: "success" });
    persist();
    notify();
  },
  recordPrivilegedPromptAccess(generationId: string, actorAccountId: string, actorName: string, reason: PrivilegedAccessReason, caseReference: string) {
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "ai_prompt_accessed", resourceType: "ai_generation", resourceId: generationId, reason: `${reason}: ${caseReference}`, result: "success" });
    persist();
    notify();
  },

  // ---- Content ----
  listContent(): ContentItem[] {
    return [...ensureLoaded().contentItems].sort((a, b) => a.order - b.order);
  },
  getContent(contentId?: string) {
    return ensureLoaded().contentItems.find((item) => item.id === contentId);
  },
  saveContent(input: { id?: string; area: ContentArea; title: string; slug: string; content: string; order: number; publishAt?: string; expiryAt?: string }, actorAccountId: string, actorName: string) {
    const current = ensureLoaded();
    const existing = input.id ? current.contentItems.find((item) => item.id === input.id) : undefined;
    const now = new Date().toISOString();
    const version = { version: (existing?.versions.length ?? 0) + 1, content: input.content, savedAt: now, savedBy: actorName };
    const record: ContentItem = {
      id: existing?.id ?? id("content"),
      area: input.area,
      title: input.title,
      slug: input.slug,
      content: input.content,
      status: existing?.status ?? "draft",
      order: input.order,
      publishAt: input.publishAt,
      expiryAt: input.expiryAt,
      updatedAt: now,
      updatedBy: actorName,
      versions: [...(existing?.versions ?? []), version],
    };
    mutate((state) => ({ ...state, contentItems: existing ? state.contentItems.map((item) => (item.id === record.id ? record : item)) : [record, ...state.contentItems] }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: existing ? "content_updated" : "content_created", resourceType: "content_item", resourceId: record.id, newValueSummary: record.title, result: "success" });
    persist();
    notify();
    return record;
  },
  setContentStatus(contentId: string, status: ContentStatus, actorAccountId: string, actorName: string) {
    mutate((state) => ({ ...state, contentItems: state.contentItems.map((item) => (item.id === contentId ? { ...item, status, updatedAt: new Date().toISOString(), updatedBy: actorName } : item)) }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "content_status_changed", resourceType: "content_item", resourceId: contentId, newValueSummary: status, result: "success" });
    persist();
    notify();
  },
  restoreContentVersion(contentId: string, version: number, actorAccountId: string, actorName: string) {
    const current = ensureLoaded();
    const item = current.contentItems.find((c) => c.id === contentId);
    const target = item?.versions.find((v) => v.version === version);
    if (!item || !target) return;
    mutate((state) => ({ ...state, contentItems: state.contentItems.map((c) => (c.id === contentId ? { ...c, content: target.content, updatedAt: new Date().toISOString(), updatedBy: actorName, versions: [...c.versions, { version: c.versions.length + 1, content: target.content, savedAt: new Date().toISOString(), savedBy: actorName }] } : c)) }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "content_version_restored", resourceType: "content_item", resourceId: contentId, newValueSummary: `v${version}`, result: "success" });
    persist();
    notify();
  },

  // ---- Platform settings ----
  updateSettingsSection<K extends keyof PlatformSettings>(section: K, value: PlatformSettings[K], actorAccountId: string, actorName: string, previousSummary: string, newSummary: string) {
    mutate((state) => ({ ...state, settings: { ...state.settings, [section]: value } }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "system_setting_changed", resourceType: "platform_settings", resourceId: String(section), previousValueSummary: previousSummary, newValueSummary: newSummary, result: "success" });
    persist();
    notify();
  },
  toggleFeatureFlag(flagKey: string, enabled: boolean, actorAccountId: string, actorName: string) {
    mutate((state) => ({ ...state, settings: { ...state.settings, featureFlags: { ...state.settings.featureFlags, [flagKey]: enabled } } }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "feature_flag_changed", resourceType: "feature_flag", resourceId: flagKey, newValueSummary: enabled ? "enabled" : "disabled", result: "success" });
    if (!enabled) notifyAdmins("feature_disabled", "Feature disabled", `${flagKey.replace(/_/g, " ")} was disabled by ${actorName}.`, "/admin/settings");
    persist();
    notify();
  },

  logOversightAction(resourceType: "review_request" | "quotation", resourceId: string, actorAccountId: string, actorName: string, action: string, newValueSummary?: string) {
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action, resourceType, resourceId, newValueSummary, result: "success" });
    persist();
    notify();
  },
  getPrivilegedAccessLog(projectId?: string) {
    const log = ensureLoaded().privilegedAccessLog;
    return projectId ? log.filter((item) => item.projectId === projectId) : log;
  },

  listUsers(): AdminUserRecord[] {
    return Object.values(ensureLoaded().users).sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
  },
  getUserRecord(accountId?: string): AdminUserRecord | undefined {
    return accountId ? ensureLoaded().users[accountId] : undefined;
  },
  updateUserStatus(accountId: string, to: AccountStatus, actorAccountId: string, reason: string) {
    const current = ensureLoaded();
    const record = current.users[accountId];
    if (!record) return;
    const from = record.status;
    mutate((state) => ({
      ...state,
      users: {
        ...state.users,
        [accountId]: { ...record, status: to, statusHistory: [{ id: id("status"), from, to, reason, actorAccountId, at: new Date().toISOString() }, ...record.statusHistory] },
      },
    }));
    logAudit({ actorAccountId, actorName: actorLabel(current, actorAccountId), actorRole: this.getAdminRole(actorAccountId) ?? "system", action: `account_${to}`, resourceType: "user_account", resourceId: accountId, previousValueSummary: from, newValueSummary: to, reason, result: "success" });
    if (to === "suspended") notifyAdmins("account_suspended", "Account suspended", `${record.name} was suspended.`, `/admin/users/${accountId}`);
    persist();
    notify();
  },
  addRestriction(accountId: string, kind: AccountRestrictionKind, actorAccountId: string, reason: string, customerVisibleExplanation: string, expiryDate?: string, internalNote?: string) {
    const current = ensureLoaded();
    const record = current.users[accountId];
    if (!record) return;
    const restriction: AccountRestriction = { id: id("restriction"), kind, reason, effectiveDate: new Date().toISOString(), expiryDate, internalNote, customerVisibleExplanation, createdBy: actorAccountId, createdAt: new Date().toISOString(), active: true };
    mutate((state) => ({ ...state, users: { ...state.users, [accountId]: { ...record, restrictions: [restriction, ...record.restrictions] } } }));
    logAudit({ actorAccountId, actorName: actorLabel(current, actorAccountId), actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "account_restricted", resourceType: "user_account", resourceId: accountId, newValueSummary: kind, reason, result: "success" });
    persist();
    notify();
  },
  removeRestriction(accountId: string, restrictionId: string, actorAccountId: string) {
    const current = ensureLoaded();
    const record = current.users[accountId];
    if (!record) return;
    mutate((state) => ({ ...state, users: { ...state.users, [accountId]: { ...record, restrictions: record.restrictions.map((item) => (item.id === restrictionId ? { ...item, active: false } : item)) } } }));
    logAudit({ actorAccountId, actorName: actorLabel(current, actorAccountId), actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "account_restriction_lifted", resourceType: "user_account", resourceId: accountId, result: "success" });
    persist();
    notify();
  },
  addUserNote(accountId: string, actorAccountId: string, actorName: string, text: string) {
    const current = ensureLoaded();
    const record = current.users[accountId];
    if (!record) return;
    const note: AdminNote = { id: id("note"), authorAccountId: actorAccountId, authorName: actorName, text, createdAt: new Date().toISOString() };
    mutate((state) => ({ ...state, users: { ...state.users, [accountId]: { ...record, notes: [note, ...record.notes] } } }));
    logAudit({ actorAccountId, actorName, actorRole: this.getAdminRole(actorAccountId) ?? "system", action: "note_added", resourceType: "user_account", resourceId: accountId, result: "success" });
    persist();
    notify();
  },

  markNotificationRead(accountId: string, notificationId?: string) {
    mutate((current) => ({
      ...current,
      notifications: current.notifications.map((item) =>
        (!notificationId || item.id === notificationId) && (!item.recipientAccountId || item.recipientAccountId === accountId)
          ? { ...item, read: true }
          : item
      ),
    }));
  },
  markAllNotificationsRead(accountId: string) {
    this.markNotificationRead(accountId);
  },
};
