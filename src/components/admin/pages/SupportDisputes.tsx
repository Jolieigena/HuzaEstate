"use client";

import { useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { useAdminState, useHasPermission } from "@/lib/admin/hooks";
import { AdminService } from "@/lib/admin/service";
import type { DisputeStatus, SupportPriority, SupportStatus } from "@/lib/admin/types";
import { useToast } from "@/lib/toast-context";
import ReasonFormModal from "../ReasonFormModal";
import { Card, EmptyState, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, StatusPill, fieldClass, formatDateTime } from "../ui";

function useActor() {
  const { account } = useAuth();
  return { actorAccountId: account?.id ?? "system", actorName: account?.name ?? "System" };
}

const SUPPORT_STATUS_OPTIONS: SupportStatus[] = ["new", "assigned", "waiting_customer", "waiting_professional", "in_progress", "escalated", "resolved", "closed", "reopened"];
const PRIORITY_OPTIONS: SupportPriority[] = ["low", "normal", "high", "urgent"];

export function SupportListPage() {
  const { account } = useAuth();
  const state = useAdminState();
  const canView = useHasPermission(account?.id, "support.manage");
  const [status, setStatus] = useState<"all" | SupportStatus>("all");
  const [priority, setPriority] = useState<"all" | SupportPriority>("all");

  const cases = AdminService.listSupportCases().filter((item) => (status === "all" || item.status === status) && (priority === "all" || item.priority === priority));

  return (
    <PageFrame title="Support" description="Support tickets from customers, sellers and professionals.">
      <RequirePermission granted={canView}>
        <Card className="mb-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">
              Status
              <select className={`${fieldClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="all">All statuses</option>
                {SUPPORT_STATUS_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item.replace(/_/g, " ")}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              Priority
              <select className={`${fieldClass} mt-1`} value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
                <option value="all">All priorities</option>
                {PRIORITY_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        {cases.length ? (
          <div className="grid gap-3">
            {cases.map((item) => (
              <Link key={item.id} href={`/admin/support/${item.id}`}>
                <Card className="p-4 transition-shadow hover:shadow-md">
                  <div className="grid gap-2 sm:grid-cols-[1.7fr_1fr_1fr_auto] sm:items-center">
                    <div>
                      <p className="font-black text-slate-900">{item.subject}</p>
                      <p className="text-xs text-slate-500">{item.reference} · {item.requesterName} · {item.category.replace(/_/g, " ")}</p>
                    </div>
                    <p className="text-xs text-slate-500">{item.assignedTo ? `Assigned: ${state.users[item.assignedTo]?.name ?? item.assignedTo}` : "Unassigned"}</p>
                    <p className="text-xs text-slate-500">Updated {formatDateTime(item.updatedAt)}</p>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.priority === "urgent" ? "bg-red-50 text-red-700" : item.priority === "high" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{item.priority}</span>
                      <StatusPill status={item.status} />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No support cases" description="Try a different filter." />
        )}
      </RequirePermission>
    </PageFrame>
  );
}

export function SupportDetailPage({ caseId }: { caseId: string }) {
  const { account } = useAuth();
  const { actorAccountId, actorName } = useActor();
  useAdminState();
  const { showToast } = useToast();
  const canView = useHasPermission(account?.id, "support.manage");
  const [messageText, setMessageText] = useState("");
  const [visibility, setVisibility] = useState<"customer" | "internal">("customer");
  const [resolveOpen, setResolveOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const item = AdminService.getSupportCase(caseId);

  if (!canView) {
    return <PageFrame title="Support" description=""><RequirePermission granted={false}>{null}</RequirePermission></PageFrame>;
  }
  if (!item) {
    return <PageFrame title="Case not found" description=""><EmptyState title="Case not found" description="This support case may have been removed, or the link is incorrect." /></PageFrame>;
  }

  return (
    <PageFrame title={item.subject} description={`${item.reference} · ${item.requesterName} · ${item.category.replace(/_/g, " ")}`} action={<Link href="/admin/support" className="text-sm font-bold text-slate-500 hover:text-[#219b31]">Back to Support</Link>}>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-900">Description</h3>
              <StatusPill status={item.status} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Conversation</h3>
            <div className="mt-4 space-y-3">
              {item.messages.map((message) => (
                <div key={message.id} className={`rounded-2xl px-4 py-3 text-sm ${message.visibility === "internal" ? "bg-amber-50 text-amber-900" : "bg-slate-50 text-slate-800"}`}>
                  <p>{message.text}</p>
                  <p className="mt-1 text-[11px] opacity-70">{message.authorName} · {message.visibility === "internal" ? "Internal note" : "Customer-visible"} · {formatDateTime(message.createdAt)}</p>
                </div>
              ))}
              {!item.messages.length && <p className="text-sm text-slate-500">No messages yet.</p>}
            </div>
            <form
              className="mt-4 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!messageText.trim()) return;
                AdminService.addSupportMessage(item.id, messageText.trim(), visibility, actorAccountId, actorName);
                setMessageText("");
                showToast(visibility === "customer" ? "Response sent." : "Internal note added.");
              }}
            >
              <textarea className={`${fieldClass} min-h-20`} value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Write a message…" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <select className={fieldClass} value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)}>
                    <option value="customer">Customer-visible response</option>
                    <option value="internal">Internal note (staff only)</option>
                  </select>
                </label>
                <PrimaryButton type="submit">Send</PrimaryButton>
              </div>
            </form>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Status history</h3>
            <div className="mt-4 divide-y divide-slate-100">
              {item.statusHistory.map((entry, index) => (
                <div key={index} className="py-3 first:pt-0">
                  <p className="text-sm font-semibold text-slate-800">{entry.status.replace(/_/g, " ")}</p>
                  {entry.note && <p className="mt-0.5 text-xs text-slate-500">{entry.note}</p>}
                  <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(entry.at)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-black text-slate-900">Actions</h3>
            <div className="mt-4 flex flex-col gap-2">
              <SecondaryButton onClick={() => { AdminService.assignSupportCase(item.id, actorAccountId, actorAccountId, actorName); showToast("Assigned to you."); }}>Assign to me</SecondaryButton>
              <label className="text-xs font-bold text-slate-500">
                Priority
                <select className={`${fieldClass} mt-1`} value={item.priority} onChange={(e) => { AdminService.setSupportCasePriority(item.id, e.target.value as SupportPriority, actorAccountId, actorName); showToast("Priority updated."); }}>
                  {PRIORITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              {!["escalated"].includes(item.status) && <SecondaryButton onClick={() => { AdminService.updateSupportCaseStatus(item.id, "escalated", actorAccountId, actorName, "Escalated for senior review."); showToast("Case escalated."); }}>Escalate</SecondaryButton>}
              {!["resolved", "closed"].includes(item.status) && <PrimaryButton onClick={() => setResolveOpen(true)}>Resolve</PrimaryButton>}
              {item.status === "resolved" && <SecondaryButton onClick={() => setCloseOpen(true)}>Close</SecondaryButton>}
              {item.status === "closed" && <SecondaryButton onClick={() => { AdminService.updateSupportCaseStatus(item.id, "reopened", actorAccountId, actorName, "Reopened by staff."); showToast("Case reopened."); }}>Reopen</SecondaryButton>}
            </div>
          </Card>
        </div>
      </div>

      <ReasonFormModal
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        title="Resolve this case"
        description="Summarize the resolution — this becomes visible to the requester."
        reasonLabel="Resolution summary"
        submitLabel="Resolve case"
        onSubmit={({ reason }) => {
          AdminService.resolveSupportCase(item.id, reason, actorAccountId, actorName);
          setResolveOpen(false);
          showToast("Case resolved.");
        }}
      />

      <ConfirmModal
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        title="Close this case?"
        description="The case is archived as closed. It can be reopened later if needed."
        confirmLabel="Close case"
        onConfirm={() => {
          AdminService.updateSupportCaseStatus(item.id, "closed", actorAccountId, actorName, "Closed by staff.");
          setCloseOpen(false);
          showToast("Case closed.");
        }}
      />
    </PageFrame>
  );
}

const DISPUTE_STATUS_OPTIONS: DisputeStatus[] = ["submitted", "screening", "information_required", "under_review", "response_requested", "resolution_proposed", "resolved", "closed", "appealed"];

export function DisputesListPage() {
  const { account } = useAuth();
  useAdminState();
  const canView = useHasPermission(account?.id, "disputes.manage");
  const [status, setStatus] = useState<"all" | DisputeStatus>("all");
  const disputes = AdminService.listDisputes().filter((item) => status === "all" || item.status === status);

  return (
    <PageFrame title="Disputes" description="Customer-professional and quotation disputes.">
      <RequirePermission granted={canView}>
        <Card className="mb-5 max-w-xs">
          <label className="text-sm font-bold text-slate-700">
            Status
            <select className={`${fieldClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="all">All statuses</option>
              {DISPUTE_STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item.replace(/_/g, " ")}</option>)}
            </select>
          </label>
        </Card>

        {disputes.length ? (
          <div className="grid gap-3">
            {disputes.map((item) => (
              <Link key={item.id} href={`/admin/disputes/${item.id}`}>
                <Card className="p-4 transition-shadow hover:shadow-md">
                  <div className="grid gap-2 sm:grid-cols-[1.7fr_1fr_1fr_auto] sm:items-center">
                    <div>
                      <p className="font-black text-slate-900">{item.complainantName} vs {item.respondentName ?? "Unknown"}</p>
                      <p className="text-xs text-slate-500">{item.reference} · {item.category.replace(/_/g, " ")}</p>
                    </div>
                    <p className="text-xs text-slate-500">{item.safetyConcern ? "Safety concern flagged" : "No safety concern"}</p>
                    <p className="text-xs text-slate-500">Updated {formatDateTime(item.updatedAt)}</p>
                    <StatusPill status={item.status} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No disputes" description="Try a different filter." />
        )}
      </RequirePermission>
    </PageFrame>
  );
}

export function DisputeDetailPage({ disputeId }: { disputeId: string }) {
  const { account } = useAuth();
  const { actorAccountId, actorName } = useActor();
  useAdminState();
  const { showToast } = useToast();
  const canView = useHasPermission(account?.id, "disputes.manage");
  const [responseOpen, setResponseOpen] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  const item = AdminService.getDispute(disputeId);

  if (!canView) {
    return <PageFrame title="Disputes" description=""><RequirePermission granted={false}>{null}</RequirePermission></PageFrame>;
  }
  if (!item) {
    return <PageFrame title="Dispute not found" description=""><EmptyState title="Dispute not found" description="This dispute may have been removed, or the link is incorrect." /></PageFrame>;
  }

  return (
    <PageFrame title={`${item.complainantName} vs ${item.respondentName ?? "Unknown"}`} description={`${item.reference} · ${item.category.replace(/_/g, " ")}`} action={<Link href="/admin/disputes" className="text-sm font-bold text-slate-500 hover:text-[#219b31]">Back to Disputes</Link>}>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-900">Dispute details</h3>
              <StatusPill status={item.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-slate-400">Complainant</dt><dd className="mt-1 font-semibold text-slate-700">{item.complainantName}</dd></div>
              <div><dt className="text-xs text-slate-400">Respondent</dt><dd className="mt-1 font-semibold text-slate-700">{item.respondentName ?? "Not identified"}</dd></div>
              <div><dt className="text-xs text-slate-400">Urgency</dt><dd className="mt-1 font-semibold text-slate-700">{item.urgency}</dd></div>
              <div><dt className="text-xs text-slate-400">Safety concern</dt><dd className="mt-1 font-semibold text-slate-700">{item.safetyConcern ? "Yes" : "No"}</dd></div>
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{item.description}</p>
            <p className="mt-3 text-sm font-semibold text-slate-700">Desired resolution: <span className="font-normal text-slate-600">{item.desiredResolution}</span></p>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Evidence</h3>
            <div className="mt-4 divide-y divide-slate-100">
              {item.evidence.map((e) => (
                <div key={e.id} className="py-3 first:pt-0">
                  <p className="text-sm font-semibold text-slate-800">{e.label}</p>
                  <p className="mt-0.5 text-xs text-slate-400">Submitted by {e.submittedByName} · {formatDateTime(e.submittedAt)}</p>
                </div>
              ))}
              {!item.evidence.length && <p className="text-sm text-slate-500">No evidence submitted.</p>}
            </div>
          </Card>

          {item.respondentResponse && (
            <Card>
              <h3 className="text-lg font-black text-slate-900">Respondent response</h3>
              <p className="mt-3 text-sm text-slate-600">{item.respondentResponse}</p>
            </Card>
          )}

          {item.proposedResolution && (
            <Card>
              <h3 className="text-lg font-black text-slate-900">Proposed resolution</h3>
              <p className="mt-3 text-sm text-slate-600">{item.proposedResolution}</p>
            </Card>
          )}

          {item.finalOutcome && (
            <Card>
              <h3 className="text-lg font-black text-slate-900">Final outcome</h3>
              <p className="mt-3 text-sm text-slate-600">{item.finalOutcome}</p>
            </Card>
          )}

          <Card>
            <h3 className="text-lg font-black text-slate-900">Internal notes</h3>
            <p className="mt-1 text-xs text-slate-500">Never shown to either party.</p>
            <div className="mt-4 divide-y divide-slate-100">
              {item.internalNotes.map((note) => (
                <div key={note.id} className="py-3 first:pt-0">
                  <p className="text-sm text-slate-800">{note.text}</p>
                  <p className="mt-1 text-xs text-slate-400">{note.authorName} · {formatDateTime(note.createdAt)}</p>
                </div>
              ))}
              {!item.internalNotes.length && <p className="text-sm text-slate-500">No internal notes yet.</p>}
            </div>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!noteText.trim()) return;
                AdminService.addDisputeNote(item.id, actorAccountId, actorName, noteText.trim());
                setNoteText("");
                showToast("Internal note added.");
              }}
            >
              <input className={fieldClass} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add an internal note…" />
              <PrimaryButton type="submit">Add</PrimaryButton>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-black text-slate-900">Actions</h3>
            <div className="mt-4 flex flex-col gap-2">
              {!["resolved", "closed"].includes(item.status) && <SecondaryButton onClick={() => setResponseOpen(true)}>Request / record response</SecondaryButton>}
              {!["resolved", "closed"].includes(item.status) && <SecondaryButton onClick={() => setProposeOpen(true)}>Propose resolution</SecondaryButton>}
              {!["closed"].includes(item.status) && <PrimaryButton onClick={() => setCloseOpen(true)}>Close dispute</PrimaryButton>}
            </div>
          </Card>
        </div>
      </div>

      <ReasonFormModal
        open={responseOpen}
        onClose={() => setResponseOpen(false)}
        title="Record respondent response"
        description="Record what the respondent said, or request one if not yet provided."
        reasonLabel="Response"
        submitLabel="Record response"
        onSubmit={({ reason }) => {
          AdminService.recordRespondentResponse(item.id, reason, actorAccountId, actorName);
          setResponseOpen(false);
          showToast("Response recorded.");
        }}
      />

      <ReasonFormModal
        open={proposeOpen}
        onClose={() => setProposeOpen(false)}
        title="Propose a resolution"
        description="This becomes visible to both parties once shared."
        reasonLabel="Proposed resolution"
        submitLabel="Propose resolution"
        onSubmit={({ reason }) => {
          AdminService.proposeDisputeResolution(item.id, reason, actorAccountId, actorName);
          setProposeOpen(false);
          showToast("Resolution proposed.");
        }}
      />

      <ReasonFormModal
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        title="Close this dispute"
        description="A closing reason is required and becomes the customer-visible outcome."
        reasonLabel="Final outcome"
        submitLabel="Close dispute"
        onSubmit={({ reason }) => {
          AdminService.closeDispute(item.id, reason, actorAccountId, actorName);
          setCloseOpen(false);
          showToast("Dispute closed.");
        }}
      />
    </PageFrame>
  );
}
