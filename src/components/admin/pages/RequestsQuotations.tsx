"use client";

import { useId, useMemo, useState } from "react";
import ConfirmModal from "@/components/shared/ConfirmModal";
import Dialog from "@/components/Dialog";
import { useAuth } from "@/lib/auth-context";
import { useAllBuildProjects, useAllRenovationProjects } from "@/lib/admin/crossModule";
import { useAdminState, useHasPermission } from "@/lib/admin/hooks";
import { AdminService } from "@/lib/admin/service";
import { BuildProjectService } from "@/lib/build/projectService";
import type { DemoProfessional as BuildDemoProfessional } from "@/lib/build/types";
import { useProfessionalState } from "@/lib/professional/hooks";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import type { DemoProfessional as RenovateDemoProfessional } from "@/lib/renovate/types";
import { useToast } from "@/lib/toast-context";
import { Card, EmptyState, PageFrame, RequirePermission, SecondaryButton, StatusPill, fieldClass, formatDate } from "../ui";

function useActor() {
  const { account } = useAuth();
  return { actorAccountId: account?.id ?? "system", actorName: account?.name ?? "System" };
}

interface RequestRow {
  key: string;
  requestId: string;
  projectId: string;
  module: "build" | "renovate";
  requestType: string;
  status: string;
  submittedAt: string;
  expectedResponseDate?: string;
  professionalName: string;
  professionalId?: string;
  projectName: string;
  ownerId: string;
  clarificationOutstanding: boolean;
}

function useRequestRows(): RequestRow[] {
  const buildProjects = useAllBuildProjects();
  const renovationProjects = useAllRenovationProjects();
  return useMemo(() => {
    const build: RequestRow[] = buildProjects.flatMap((project) =>
      project.reviewRequests.map((review) => ({
        key: `build-${review.id}`,
        requestId: review.id,
        projectId: project.id,
        module: "build" as const,
        requestType: review.type.replace(/_/g, " "),
        status: review.status,
        submittedAt: review.submittedAt,
        expectedResponseDate: review.expectedResponseDate,
        professionalName: review.professional?.name ?? "Unassigned",
        professionalId: review.professional?.id,
        projectName: project.name,
        ownerId: project.ownerId,
        clarificationOutstanding: review.status === "clarification_requested",
      }))
    );
    const renovate: RequestRow[] = renovationProjects.flatMap((project) =>
      project.reviewRequests.map((review) => ({
        key: `renovate-${review.id}`,
        requestId: review.id,
        projectId: project.id,
        module: "renovate" as const,
        requestType: review.type.replace(/_/g, " "),
        status: review.status,
        submittedAt: review.submittedAt,
        expectedResponseDate: review.expectedResponseDate,
        professionalName: review.professional?.name ?? "Unassigned",
        professionalId: review.professional?.id,
        projectName: project.name,
        ownerId: project.ownerId,
        clarificationOutstanding: review.status === "clarification_requested",
      }))
    );
    return [...build, ...renovate].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [buildProjects, renovationProjects]);
}

function ManageRequestModal({ open, onClose, request }: { open: boolean; onClose: () => void; request: RequestRow | null }) {
  const titleId = useId();
  const { actorAccountId, actorName } = useActor();
  const { showToast } = useToast();
  const professionalState = useProfessionalState();
  const [deadline, setDeadline] = useState("");
  const [reassignTo, setReassignTo] = useState("");
  const [note, setNote] = useState("");
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [prevRequestKey, setPrevRequestKey] = useState(request?.key);

  if (request?.key !== prevRequestKey) {
    setPrevRequestKey(request?.key);
    setDeadline(request?.expectedResponseDate?.slice(0, 10) ?? "");
    setReassignTo("");
    setNote("");
  }

  const approvedProfiles = professionalState.profiles.filter((p) => p.status === "approved");

  if (!request) return null;

  const setDeadlineOn = (iso: string, details: string) => {
    if (request.module === "build") BuildProjectService.updateReview(request.projectId, request.requestId, (review) => ({ ...review, expectedResponseDate: iso }), details);
    else RenovationProjectService.updateReview(request.projectId, request.requestId, (review) => ({ ...review, expectedResponseDate: iso }), details);
  };

  const applyReassignment = (profile: (typeof approvedProfiles)[number], details: string) => {
    if (request.module === "build") {
      const professional: BuildDemoProfessional = { id: profile.id, name: profile.displayName, profession: profile.primarySpecialisation, location: profile.city, verified: profile.demoVerified, rating: 4.8, completedReviews: 0, estimatedResponseTime: profile.responseTime };
      BuildProjectService.updateReview(request.projectId, request.requestId, (review) => ({ ...review, professional }), details);
    } else {
      const professional: RenovateDemoProfessional = { id: profile.id, name: profile.displayName, profession: profile.primarySpecialisation, location: profile.city, verified: profile.demoVerified, rating: 4.8, completedProjects: 0, estimatedResponseTime: profile.responseTime };
      RenovationProjectService.updateReview(request.projectId, request.requestId, (review) => ({ ...review, professional }), details);
    }
  };

  const addOperationalNote = (details: string) => {
    if (request.module === "build") BuildProjectService.updateReview(request.projectId, request.requestId, (review) => review, details);
    else RenovationProjectService.updateReview(request.projectId, request.requestId, (review) => review, details);
  };

  const closeRequest = (details: string) => {
    if (request.module === "build") BuildProjectService.updateReview(request.projectId, request.requestId, (review) => ({ ...review, status: "cancelled" }), details);
    else RenovationProjectService.updateReview(request.projectId, request.requestId, (review) => ({ ...review, status: "cancelled" }), details);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName="max-w-xl">
        <div className="p-6 sm:p-8">
          <h2 id={titleId} className="mb-1 text-xl font-black text-slate-900">
            Manage request
          </h2>
          <p className="mb-5 text-sm text-slate-500">
            {request.projectName} · {request.requestType}
          </p>

          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-bold text-slate-700">Extend response deadline</p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <input type="date" className={`${fieldClass} max-w-xs`} value={deadline} onChange={(e) => setDeadline(e.target.value)} aria-label="New response deadline" />
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    if (!deadline) return;
                    const iso = new Date(deadline).toISOString();
                    setDeadlineOn(iso, `Deadline extended to ${formatDate(iso)} by ${actorName}.`);
                    AdminService.logOversightAction("review_request", request.requestId, actorAccountId, actorName, "deadline_extended", formatDate(iso));
                    showToast("Deadline extended.");
                  }}
                >
                  Save deadline
                </SecondaryButton>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-bold text-slate-700">Reassign professional</p>
              <p className="mt-0.5 text-xs text-slate-500">Currently: {request.professionalName}</p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <select className={`${fieldClass} max-w-xs`} value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>
                  <option value="">Select an approved professional…</option>
                  {approvedProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.displayName} · {profile.primarySpecialisation}
                    </option>
                  ))}
                </select>
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    const profile = approvedProfiles.find((p) => p.id === reassignTo);
                    if (!profile) return;
                    applyReassignment(profile, `Reassigned to ${profile.displayName} by ${actorName}.`);
                    AdminService.logOversightAction("review_request", request.requestId, actorAccountId, actorName, "request_reassigned", profile.displayName);
                    setReassignTo("");
                    showToast("Request reassigned.");
                  }}
                >
                  Reassign
                </SecondaryButton>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-bold text-slate-700">Operational note</p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <input className={fieldClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for other staff…" />
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    if (!note.trim()) return;
                    addOperationalNote(`Operational note: ${note.trim()} — ${actorName}.`);
                    AdminService.logOversightAction("review_request", request.requestId, actorAccountId, actorName, "operational_note_added", note.trim());
                    setNote("");
                    showToast("Note added to project activity.");
                  }}
                >
                  Add note
                </SecondaryButton>
              </div>
            </div>

            {!["completed", "declined", "cancelled"].includes(request.status) && (
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                <p className="text-sm font-bold text-red-700">Close abandoned request</p>
                <p className="mt-0.5 text-xs text-red-700/80">Marks the request cancelled. Use for requests no longer being progressed by either party.</p>
                <SecondaryButton type="button" className="mt-2 border-red-200 text-red-600 hover:border-red-300 hover:text-red-700" onClick={() => setCloseConfirmOpen(true)}>
                  Close request
                </SecondaryButton>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50">
              Done
            </button>
          </div>
        </div>
      </Dialog>

      <ConfirmModal
        open={closeConfirmOpen}
        onClose={() => setCloseConfirmOpen(false)}
        destructive
        title="Close this request?"
        description="The request is marked cancelled for both the customer and the professional."
        confirmLabel="Close request"
        onConfirm={() => {
          closeRequest(`Request closed as abandoned by ${actorName}.`);
          AdminService.logOversightAction("review_request", request.requestId, actorAccountId, actorName, "request_closed_abandoned");
          setCloseConfirmOpen(false);
          onClose();
          showToast("Request closed.");
        }}
      />
    </>
  );
}

export function RequestsPage() {
  const { account } = useAuth();
  useAdminState();
  const canView = useHasPermission(account?.id, "reviews.view");
  const [module, setModule] = useState<"all" | "build" | "renovate">("all");
  const [status, setStatus] = useState("all");
  const rows = useRequestRows();
  const [managing, setManaging] = useState<RequestRow | null>(null);

  const filtered = rows.filter((row) => (module === "all" || row.module === module) && (status === "all" || row.status === status));
  const statusOptions = Array.from(new Set(rows.map((r) => r.status)));

  return (
    <PageFrame title="Requests" description="Professional review requests across Build and Renovate projects.">
      <RequirePermission granted={canView}>
        <Card className="mb-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">
              Type
              <select className={`${fieldClass} mt-1`} value={module} onChange={(e) => setModule(e.target.value as typeof module)}>
                <option value="all">Build and Renovate</option>
                <option value="build">Build</option>
                <option value="renovate">Renovate</option>
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              Status
              <select className={`${fieldClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All statuses</option>
                {statusOptions.map((item) => (
                  <option key={item} value={item}>
                    {item.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        {filtered.length ? (
          <div className="grid gap-3">
            {filtered.map((row) => (
              <Card key={row.key} className="p-4">
                <div className="grid gap-2 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] sm:items-center">
                  <div>
                    <p className="font-black text-slate-900">{row.projectName}</p>
                    <p className="text-xs text-slate-500">{row.requestType} · {row.module}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-600">{row.professionalName}</p>
                  <p className="text-xs text-slate-500">Submitted {formatDate(row.submittedAt)}</p>
                  <p className="text-xs text-slate-500">{row.expectedResponseDate ? `Due ${formatDate(row.expectedResponseDate)}` : "No deadline set"}</p>
                  <div className="flex items-center gap-2">
                    {row.clarificationOutstanding && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Clarification</span>}
                    <StatusPill status={row.status} />
                    <SecondaryButton onClick={() => setManaging(row)}>Manage</SecondaryButton>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No requests found" description="Try a different filter." />
        )}

        <ManageRequestModal open={Boolean(managing)} onClose={() => setManaging(null)} request={managing} />
      </RequirePermission>
    </PageFrame>
  );
}

function useQuotationRows() {
  const renovationProjects = useAllRenovationProjects();
  return useMemo(
    () =>
      renovationProjects
        .flatMap((project) =>
          project.quotations.map((quotation) => ({
            quotation,
            project,
          }))
        )
        .sort((a, b) => b.quotation.quotationDate.localeCompare(a.quotation.quotationDate)),
    [renovationProjects]
  );
}

export function QuotationsPage() {
  const { account } = useAuth();
  const { actorAccountId, actorName } = useActor();
  useAdminState();
  const professionalState = useProfessionalState();
  const { showToast } = useToast();
  const canView = useHasPermission(account?.id, "quotations.view");
  const [status, setStatus] = useState("all");
  const [noteTarget, setNoteTarget] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<{ projectId: string; quotationId: string } | null>(null);

  const rows = useQuotationRows();
  const filtered = rows.filter(({ quotation }) => status === "all" || quotation.status === status);
  const statusOptions = Array.from(new Set(rows.map((r) => r.quotation.status)));

  return (
    <PageFrame title="Quotations" description="Contractor quotation metadata across Renovate projects. Administrators cannot change contractor prices or accept on a customer's behalf.">
      <RequirePermission granted={canView}>
        <Card className="mb-5 max-w-xs">
          <label className="text-sm font-bold text-slate-700">
            Status
            <select className={`${fieldClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {item.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
        </Card>

        {filtered.length ? (
          <div className="grid gap-3">
            {filtered.map(({ quotation, project }) => {
              const draft = professionalState.quotationDrafts.find((d) => d.quotationId === quotation.id);
              return (
                <Card key={quotation.id} className="p-4">
                  <div className="grid gap-2 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] sm:items-center">
                    <div>
                      <p className="font-black text-slate-900">{project.name}</p>
                      <p className="text-xs text-slate-500">{quotation.contractor.companyName} · {project.property.location || project.property.address}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-600">${quotation.total.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Valid until {formatDate(quotation.validUntil)}</p>
                    <p className="text-xs text-slate-500">{draft?.versions.length ?? 1} version{(draft?.versions.length ?? 1) === 1 ? "" : "s"}</p>
                    <div className="flex items-center gap-2">
                      <StatusPill status={quotation.status} />
                      <SecondaryButton onClick={() => setNoteTarget(quotation.id)}>Note</SecondaryButton>
                      {quotation.status !== "withdrawn" && quotation.status !== "accepted" && (
                        <SecondaryButton className="border-red-200 text-red-600 hover:border-red-300 hover:text-red-700" onClick={() => setSuspendTarget({ projectId: project.id, quotationId: quotation.id })}>
                          Suspend
                        </SecondaryButton>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No quotations found" description="Try a different filter." />
        )}

        <Dialog open={Boolean(noteTarget)} onClose={() => setNoteTarget(null)} labelledBy="quotation-note-title" panelClassName="max-w-md">
          <form
            className="p-6 sm:p-8"
            onSubmit={(e) => {
              e.preventDefault();
              if (!noteTarget || !noteText.trim()) return;
              AdminService.logOversightAction("quotation", noteTarget, actorAccountId, actorName, "operational_note_added", noteText.trim());
              setNoteTarget(null);
              setNoteText("");
              showToast("Note recorded.");
            }}
          >
            <h2 id="quotation-note-title" className="mb-2 text-xl font-black text-slate-900">
              Add operational note
            </h2>
            <textarea className={`${fieldClass} min-h-24`} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Visible to staff in the audit log." />
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setNoteTarget(null)} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-lg hover:bg-[#2ec440]">
                Add note
              </button>
            </div>
          </form>
        </Dialog>

        <ConfirmModal
          open={Boolean(suspendTarget)}
          onClose={() => setSuspendTarget(null)}
          destructive
          title="Suspend this quotation from acceptance?"
          description="The quotation is withdrawn and can no longer be accepted by the customer. The contractor may submit a revised quotation."
          confirmLabel="Suspend quotation"
          onConfirm={() => {
            if (!suspendTarget) return;
            RenovationProjectService.updateQuotation(suspendTarget.projectId, suspendTarget.quotationId, (q) => ({ ...q, status: "withdrawn" }), `Suspended from acceptance by ${actorName} pending review.`);
            AdminService.logOversightAction("quotation", suspendTarget.quotationId, actorAccountId, actorName, "quotation_suspended");
            setSuspendTarget(null);
            showToast("Quotation suspended from acceptance.");
          }}
        />
      </RequirePermission>
    </PageFrame>
  );
}
