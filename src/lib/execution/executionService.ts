// Execution Project Service & Sub-services

import { ExecutionStorageService } from "./storage";
import { executionSeedProjects } from "./seed";
import {
  ExecutionProject,
  ExecutionProjectStatus,
  ExecutionRole,
  ExecutionTask,
  ExecutionMilestone,
  SiteDiaryEntry,
  ProgressReport,
  MaterialItem,
  MaterialSubstitution,
  InspectionRecord,
  ChangeRequest,
  ChangeOrder,
  IssueRecord,
  DefectItem,
  WarrantyIssue,
  ExecutionDocument,
  ExecutionActivityEvent,
  HandoverChecklist,
  HandoverStatus,
} from "./types";

type Listener = () => void;

let projects: ExecutionProject[] | null = null;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function ensureLoaded(): ExecutionProject[] {
  if (projects !== null) return projects;
  const stored = ExecutionStorageService.loadProjects();
  if (stored.length === 0 && !ExecutionStorageService.hasSeeded()) {
    const seeded = executionSeedProjects();
    ExecutionStorageService.saveProjects(seeded);
    ExecutionStorageService.markSeeded();
    projects = seeded;
  } else {
    projects = stored;
  }
  return projects;
}

function persist() {
  if (projects) ExecutionStorageService.saveProjects(projects);
}

function logActivity(
  p: ExecutionProject,
  actorName: string,
  actorRole: ExecutionRole,
  type: string,
  summary: string,
  relatedTab?: string,
  details?: string
): ExecutionActivityEvent {
  const event: ExecutionActivityEvent = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    executionId: p.id,
    timestamp: new Date().toISOString(),
    actorName,
    actorRole,
    type,
    summary,
    relatedTab,
    details,
  };
  return event;
}

function mutate(
  id: string,
  fn: (project: ExecutionProject) => ExecutionProject
): ExecutionProject | undefined {
  const list = ensureLoaded();
  const index = list.findIndex((p) => p.id === id);
  if (index === -1) return undefined;
  let updated = fn(list[index]);
  updated = { ...updated, updatedAt: new Date().toISOString() };
  const next = [...list];
  next[index] = updated;
  projects = next;
  persist();
  notify();
  return updated;
}

export const ExecutionProjectService = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getAll(): ExecutionProject[] {
    return ensureLoaded();
  },

  getById(id: string): ExecutionProject | undefined {
    return ensureLoaded().find((p) => p.id === id);
  },

  getByUserId(userId: string, role: ExecutionRole): ExecutionProject[] {
    const list = ensureLoaded();
    if (role === "administrator") return list;
    if (role === "customer") return list.filter((p) => p.customerId === userId || p.customerEmail.toLowerCase().includes(userId.toLowerCase()));
    if (role === "contractor") return list.filter((p) => p.contractorId === userId || p.contractorName.toLowerCase().includes("imara") || p.team.some((t) => t.userId === userId || t.role === "contractor"));
    return list.filter((p) => p.team.some((t) => t.userId === userId || t.role === role));
  },

  createFromSource(input: {
    name: string;
    sourceType: "build" | "renovate" | "manual" | "admin";
    sourceProjectId?: string;
    sourceQuotationId?: string;
    customerName: string;
    customerId: string;
    customerEmail: string;
    customerPhone: string;
    contractorName: string;
    contractorId: string;
    contractorEmail: string;
    contractorPhone: string;
    location: string;
    designVersionName: string;
    approvedScopeSummary: string;
    contractValue: number;
    currency: "RWF" | "USD";
    startDate: string;
    targetCompletionDate: string;
  }): ExecutionProject {
    const list = ensureLoaded();
    const id = `exec-${input.sourceType}-${Date.now()}`;
    const newProj: ExecutionProject = {
      id,
      name: input.name,
      sourceType: input.sourceType,
      sourceProjectId: input.sourceProjectId,
      sourceQuotationId: input.sourceQuotationId,
      customerName: input.customerName,
      customerId: input.customerId,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      contractorName: input.contractorName,
      contractorId: input.contractorId,
      contractorEmail: input.contractorEmail,
      contractorPhone: input.contractorPhone,
      location: input.location,
      designVersionName: input.designVersionName,
      approvedScopeSummary: input.approvedScopeSummary,
      contractValue: input.contractValue,
      originalContractValue: input.contractValue,
      currency: input.currency,
      startDate: input.startDate,
      targetCompletionDate: input.targetCompletionDate,
      status: "setup_in_progress",
      overallProgressPercent: 0,
      nextRequiredAction: "Complete execution project setup workflow.",
      team: [
        {
          id: `tm-${Date.now()}-1`,
          userId: input.customerId,
          name: input.customerName,
          role: "customer",
          email: input.customerEmail,
          phone: input.customerPhone,
          permissions: ["view", "approve_changes", "accept_handover"],
          startDate: input.startDate,
          contactPreferences: "Email",
          isEmergencyContact: true,
          confirmed: false,
        },
        {
          id: `tm-${Date.now()}-2`,
          userId: input.contractorId,
          name: input.contractorName,
          role: "contractor",
          email: input.contractorEmail,
          phone: input.contractorPhone,
          company: input.contractorName,
          permissions: ["update_schedule", "site_diary", "submit_milestones"],
          startDate: input.startDate,
          contactPreferences: "Phone",
          isEmergencyContact: true,
          confirmed: false,
        },
      ],
      approvals: [
        { id: `app-${Date.now()}-1`, name: "Building / Renovation Permit", category: "permit", status: "not_started", supportingDocIds: [] },
        { id: "app-2", name: "Property Owner / Management Approval", category: "owner", status: "not_started", supportingDocIds: [] },
      ],
      communication: {
        primaryChannel: "Huza Messaging",
        progressReportFrequency: "weekly",
        siteMeetingFrequency: "weekly",
        emergencyContacts: `${input.contractorName}: ${input.contractorPhone}`,
        changeApprovalContacts: input.customerName,
        inspectionContacts: "Assigned Professional",
      },
      customerSetupConfirmed: false,
      contractorSetupConfirmed: false,
      leadProfessionalSetupConfirmed: false,
      workPackages: [],
      tasks: [],
      milestones: [],
      siteDiary: [],
      progressReports: [],
      materials: [],
      substitutions: [],
      inspections: [],
      changeRequests: [],
      changeOrders: [],
      issues: [],
      defects: [],
      handoverChecklist: {
        scopeCompleted: false,
        approvedChangesCompleted: false,
        requiredInspectionsPassed: false,
        openDefectsAddressed: false,
        siteCleaned: false,
        wasteRemoved: false,
        utilitiesTested: false,
        customerWalkthroughCompleted: false,
        documentsUploaded: false,
        warrantiesProvided: false,
        maintenanceInfoProvided: false,
      },
      handoverStatus: "not_started",
      warranties: [],
      warrantyIssues: [],
      documents: [],
      activity: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const initialActivity = logActivity(newProj, input.customerName, "customer", "project_created", `Created execution project for ${input.name}.`, "overview");
    newProj.activity.unshift(initialActivity);

    projects = [newProj, ...list];
    persist();
    notify();
    return newProj;
  },

  confirmSetupStep(id: string, role: ExecutionRole, actorName: string): ExecutionProject | undefined {
    return mutate(id, (p) => {
      let cust = p.customerSetupConfirmed;
      let cont = p.contractorSetupConfirmed;
      let lead = p.leadProfessionalSetupConfirmed;
      if (role === "customer") cust = true;
      if (role === "contractor") cont = true;
      if (role === "architect" || role === "engineer") lead = true;

      const team = p.team.map((t) => (t.role === role ? { ...t, confirmed: true } : t));

      let newStatus = p.status;
      if (cust && cont) {
        newStatus = "ready_to_start";
      }

      const act = logActivity(p, actorName, role, "setup_confirmed", `Confirmed project setup baseline.`, "overview");
      return {
        ...p,
        team,
        customerSetupConfirmed: cust,
        contractorSetupConfirmed: cont,
        leadProfessionalSetupConfirmed: lead,
        status: newStatus,
        activity: [act, ...p.activity],
      };
    });
  },

  activateProject(id: string, actorName: string, actorRole: ExecutionRole): ExecutionProject | undefined {
    return mutate(id, (p) => {
      const act = logActivity(p, actorName, actorRole, "project_activated", `Activated execution project. Delivery in progress.`, "overview");
      return {
        ...p,
        status: "active",
        nextRequiredAction: "Begin site preparation and daily site diary logging.",
        activity: [act, ...p.activity],
      };
    });
  },

  pauseProject(id: string, actorName: string, actorRole: ExecutionRole, reason: string): ExecutionProject | undefined {
    return mutate(id, (p) => {
      const act = logActivity(p, actorName, actorRole, "project_paused", `Paused project: ${reason}`, "overview");
      return {
        ...p,
        status: "paused",
        isPausedByAdmin: actorRole === "administrator",
        adminNotes: reason,
        activity: [act, ...p.activity],
      };
    });
  },

  resumeProject(id: string, actorName: string, actorRole: ExecutionRole): ExecutionProject | undefined {
    return mutate(id, (p) => {
      const act = logActivity(p, actorName, actorRole, "project_resumed", `Resumed active project execution.`, "overview");
      return {
        ...p,
        status: "active",
        isPausedByAdmin: false,
        activity: [act, ...p.activity],
      };
    });
  },
};

export const ExecutionScheduleService = {
  addTask(projectId: string, task: Omit<ExecutionTask, "id">, actorName: string, actorRole: ExecutionRole): ExecutionProject | undefined {
    return mutate(projectId, (p) => {
      const id = `tsk-${Date.now()}`;
      const newTask: ExecutionTask = { ...task, id };
      const act = logActivity(p, actorName, actorRole, "task_created", `Added task "${task.title}".`, "schedule");
      return {
        ...p,
        tasks: [...p.tasks, newTask],
        activity: [act, ...p.activity],
      };
    });
  },

  updateTask(projectId: string, taskId: string, updates: Partial<ExecutionTask>, actorName: string, actorRole: ExecutionRole, delayReason?: string): ExecutionProject | undefined {
    return mutate(projectId, (p) => {
      const tasks = p.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const updated = { ...t, ...updates };
        if (delayReason) updated.delayReason = delayReason;
        return updated;
      });

      // Recalculate overall progress
      const totalProgress = tasks.length > 0 ? Math.round(tasks.reduce((sum, t) => sum + t.progressPercent, 0) / tasks.length) : p.overallProgressPercent;

      const act = logActivity(p, actorName, actorRole, "task_updated", `Updated task progress to ${updates.progressPercent ?? "modified"}%.`, "schedule");
      return {
        ...p,
        tasks,
        overallProgressPercent: totalProgress,
        activity: [act, ...p.activity],
      };
    });
  },
};

export const SiteDiaryService = {
  addEntry(projectId: string, entry: Omit<SiteDiaryEntry, "id" | "status" | "amendments" | "comments">, actorName: string, actorRole: ExecutionRole): ExecutionProject | undefined {
    return mutate(projectId, (p) => {
      const id = `sd-${Date.now()}`;
      const newEntry: SiteDiaryEntry = {
        ...entry,
        id,
        status: "locked",
        amendments: [],
        comments: [],
      };
      const act = logActivity(p, actorName, actorRole, "site_diary_submitted", `Logged daily site diary entry for ${entry.date}.`, "site-diary");
      return {
        ...p,
        siteDiary: [newEntry, ...p.siteDiary],
        activity: [act, ...p.activity],
      };
    });
  },

  amendEntry(projectId: string, entryId: string, reason: string, fieldChanges: Record<string, { before: string; after: string }>, actorName: string, actorRole: ExecutionRole): ExecutionProject | undefined {
    return mutate(projectId, (p) => {
      const siteDiary = p.siteDiary.map((e) => {
        if (e.id !== entryId) return e;
        const amendment = {
          timestamp: new Date().toISOString(),
          amendedBy: actorName,
          role: actorRole,
          reason,
          fieldChanges,
        };
        return {
          ...e,
          status: "amended" as const,
          amendments: [...e.amendments, amendment],
        };
      });
      const act = logActivity(p, actorName, actorRole, "site_diary_amended", `Amended site diary entry (Reason: ${reason}).`, "site-diary");
      return {
        ...p,
        siteDiary,
        activity: [act, ...p.activity],
      };
    });
  },

  addComment(projectId: string, entryId: string, text: string, authorName: string, authorRole: ExecutionRole): ExecutionProject | undefined {
    return mutate(projectId, (p) => {
      const siteDiary = p.siteDiary.map((e) => {
        if (e.id !== entryId) return e;
        const c = { id: `sdc-${Date.now()}`, authorName, authorRole, timestamp: new Date().toISOString(), text };
        return { ...e, comments: [...e.comments, c] };
      });
      return { ...p, siteDiary };
    });
  },
};

export const InspectionService = {
  requestInspection(projectId: string, inspection: Omit<InspectionRecord, "id" | "outcome" | "reinspectionRequired" | "inspectorDeclarationConfirmed">, actorName: string, actorRole: ExecutionRole): ExecutionProject | undefined {
    return mutate(projectId, (p) => {
      const id = `insp-${Date.now()}`;
      const newInsp: InspectionRecord = {
        ...inspection,
        id,
        outcome: "scheduled",
        reinspectionRequired: false,
        inspectorDeclarationConfirmed: false,
      };
      const act = logActivity(p, actorName, actorRole, "inspection_requested", `Requested inspection: ${inspection.title}`, "inspections");
      return {
        ...p,
        inspections: [...p.inspections, newInsp],
        activity: [act, ...p.activity],
      };
    });
  },

  submitResult(projectId: string, inspectionId: string, outcome: InspectionRecord["outcome"], findings: string, checklist: InspectionRecord["checklist"], evidenceUrls: string[], declarationConfirmed: boolean, actorName: string, actorRole: ExecutionRole): ExecutionProject | undefined {
    return mutate(projectId, (p) => {
      const inspections = p.inspections.map((i) => {
        if (i.id !== inspectionId) return i;
        return {
          ...i,
          outcome,
          findings,
          checklist,
          evidencePhotoUrls: evidenceUrls.length > 0 ? evidenceUrls : i.evidencePhotoUrls,
          inspectorDeclarationConfirmed: declarationConfirmed,
          completedDate: new Date().toISOString().split("T")[0],
          reinspectionRequired: outcome === "corrective_work_required" || outcome === "failed" || outcome === "reinspection_required",
        };
      });
      const act = logActivity(p, actorName, actorRole, "inspection_completed", `Completed inspection: Outcome ${outcome}.`, "inspections");
      return {
        ...p,
        inspections,
        activity: [act, ...p.activity],
      };
    });
  },
};

export const ChangeOrderService = {
  addRequest(projectId: string, req: Omit<ChangeRequest, "id" | "changeReference" | "status" | "createdAt">, actorName: string, actorRole: ExecutionRole): ExecutionProject | undefined {
    return mutate(projectId, (p) => {
      const count = p.changeRequests.length + 1;
      const ref = `CO-0${count}`;
      const newReq: ChangeRequest = {
        ...req,
        id: `cr-${Date.now()}`,
        changeReference: ref,
        status: "submitted",
        createdAt: new Date().toISOString(),
      };
      const act = logActivity(p, actorName, actorRole, "change_request_submitted", `Raised change request ${ref}: ${req.title}`, "changes");
      return {
        ...p,
        changeRequests: [newReq, ...p.changeRequests],
        activity: [act, ...p.activity],
      };
    });
  },

  approveByCustomer(projectId: string, changeRequestId: string, customerName: string): ExecutionProject | undefined {
    return mutate(projectId, (p) => {
      const reqIndex = p.changeRequests.findIndex((c) => c.id === changeRequestId);
      if (reqIndex === -1) return p;

      const req = p.changeRequests[reqIndex];
      const updatedReqs = [...p.changeRequests];
      updatedReqs[reqIndex] = { ...req, status: "approved", approvedAt: new Date().toISOString() };

      const oldVal = p.contractValue;
      const newVal = oldVal + req.costImpact;

      const changeOrder: ChangeOrder = {
        id: `co-${Date.now()}`,
        changeRequestId: req.id,
        changeReference: req.changeReference,
        title: req.title,
        costDelta: req.costImpact,
        scheduleDeltaDays: req.scheduleImpactDays,
        approvedByCustomerName: customerName,
        approvedAt: new Date().toISOString(),
        baselineContractValueBefore: oldVal,
        baselineContractValueAfter: newVal,
        revisedCompletionDate: req.scheduleImpactDays > 0 ? "Revised Date" : p.targetCompletionDate,
      };

      const act = logActivity(p, customerName, "customer", "change_order_approved", `Approved Change Order ${req.changeReference}. Revised value: ${newVal.toLocaleString()} ${p.currency}.`, "changes");

      return {
        ...p,
        changeRequests: updatedReqs,
        changeOrders: [changeOrder, ...p.changeOrders],
        contractValue: newVal,
        activity: [act, ...p.activity],
      };
    });
  },
};

export const IssueService = {
  addIssue(projectId: string, issue: Omit<IssueRecord, "id" | "issueReference" | "status" | "createdAt">, actorName: string, actorRole: ExecutionRole): ExecutionProject | undefined {
    return mutate(projectId, (p) => {
      const count = p.issues.length + 1;
      const ref = `ISS-0${count}`;
      const newIssue: IssueRecord = {
        ...issue,
        id: `iss-${Date.now()}`,
        issueReference: ref,
        status: "open",
        createdAt: new Date().toISOString(),
      };
      const act = logActivity(p, actorName, actorRole, "issue_created", `Raised issue ${ref} (${issue.priority}): ${issue.title}`, "issues");
      return {
        ...p,
        issues: [newIssue, ...p.issues],
        activity: [act, ...p.activity],
      };
    });
  },

  addDefect(projectId: string, defect: Omit<DefectItem, "id" | "defectReference" | "status" | "createdAt">, actorName: string, actorRole: ExecutionRole): ExecutionProject | undefined {
    return mutate(projectId, (p) => {
      const count = p.defects.length + 1;
      const ref = `SNG-0${count}`;
      const newDefect: DefectItem = {
        ...defect,
        id: `def-${Date.now()}`,
        defectReference: ref,
        status: "open",
        createdAt: new Date().toISOString(),
      };
      const act = logActivity(p, actorName, actorRole, "defect_reported", `Reported snag defect ${ref}: ${defect.description}`, "handover");
      return {
        ...p,
        defects: [newDefect, ...p.defects],
        activity: [act, ...p.activity],
      };
    });
  },

  verifyDefect(projectId: string, defectId: string, verified: boolean, notes: string, actorName: string, actorRole: ExecutionRole): ExecutionProject | undefined {
    return mutate(projectId, (p) => {
      const defects = p.defects.map((d) => {
        if (d.id !== defectId) return d;
        return {
          ...d,
          status: verified ? ("corrected" as const) : ("rejected_after_verification" as const),
          verificationNotes: notes,
        };
      });
      const act = logActivity(p, actorName, actorRole, "defect_verified", `${verified ? "Verified and closed" : "Rejected correction for"} defect.`, "handover");
      return {
        ...p,
        defects,
        activity: [act, ...p.activity],
      };
    });
  },
};

export const HandoverService = {
  acceptHandover(projectId: string, customerName: string, notes?: string): ExecutionProject | undefined {
    return mutate(projectId, (p) => {
      const act = logActivity(p, customerName, "customer", "handover_accepted", `Handover accepted by customer. Project completed.`, "handover");
      return {
        ...p,
        status: "handed_over",
        handoverStatus: "completed",
        handoverAcceptedAt: new Date().toISOString(),
        actualCompletionDate: new Date().toISOString().split("T")[0],
        activity: [act, ...p.activity],
      };
    });
  },

  addWarrantyIssue(projectId: string, issue: Omit<WarrantyIssue, "id" | "reportedAt" | "status">, actorName: string): ExecutionProject | undefined {
    return mutate(projectId, (p) => {
      const newIssue: WarrantyIssue = {
        ...issue,
        id: `wi-${Date.now()}`,
        reportedAt: new Date().toISOString(),
        status: "submitted",
      };
      const act = logActivity(p, actorName, "customer", "warranty_issue_reported", `Reported warranty issue: ${issue.title}`, "handover");
      return {
        ...p,
        warrantyIssues: [...p.warrantyIssues, newIssue],
        activity: [act, ...p.activity],
      };
    });
  },
};
