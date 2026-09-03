"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { useAdminState, useHasPermission } from "@/lib/admin/hooks";
import { AdminService } from "@/lib/admin/service";
import type { DocumentReviewDecision } from "@/lib/admin/types";
import type { ProfessionalKind, ProfessionalProfileStatus } from "@/lib/professional/types";
import { useToast } from "@/lib/toast-context";
import ApproveProfessionalApplicationModal from "../ApproveProfessionalApplicationModal";
import ReasonFormModal from "../ReasonFormModal";
import { Card, EmptyState, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, StatusPill, fieldClass, formatDate, formatDateTime } from "../ui";

const KIND_LABELS: Record<ProfessionalKind, string> = {
  individual_professional: "Individual professional",
  professional_firm: "Professional firm",
  contractor_company: "Contractor company",
  individual_specialist_contractor: "Individual specialist contractor",
};
const STATUS_OPTIONS: ProfessionalProfileStatus[] = ["draft", "submitted", "under_review", "more_information_required", "approved", "rejected", "suspended"];
const REJECTION_CATEGORIES = ["Incomplete application", "Unverifiable credentials", "Document quality issue", "Outside supported professions", "Duplicate application", "Policy violation", "Other"];
const DOCUMENT_DECISIONS: DocumentReviewDecision[] = ["not_reviewed", "appears_valid", "more_information_required", "expired", "illegible", "mismatch", "requires_external_confirmation"];

function documentsFor(kind: ProfessionalKind): string[] {
  const base = ["Identity document", "Professional certificate", "Insurance document"];
  if (kind === "professional_firm" || kind === "contractor_company") return [...base, "Business registration document"];
  return base;
}

function useActor() {
  const { account } = useAuth();
  return { actorAccountId: account?.id ?? "system", actorName: account?.name ?? "System" };
}

function daysSince(iso?: string) {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

export function ProfessionalsListPage() {
  const { account } = useAuth();
  useAdminState();
  const canView = useHasPermission(account?.id, "professionals.view");
  const [status, setStatus] = useState<"all" | ProfessionalProfileStatus>("all");
  const [search, setSearch] = useState("");

  const applications = AdminService.listApplications();
  const filtered = useMemo(
    () =>
      applications.filter((profile) => {
        const q = search.trim().toLowerCase();
        const matchesSearch = !q || [profile.displayName, profile.primarySpecialisation, profile.city].some((field) => field.toLowerCase().includes(q));
        return matchesSearch && (status === "all" || profile.status === status);
      }),
    [applications, search, status]
  );

  return (
    <PageFrame title="Professionals" description="Review applications, verification documents and credentials for professionals and contractors.">
      <RequirePermission granted={canView}>
        <Card className="mb-5">
          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
            <label className="text-sm font-bold text-slate-700">
              Search
              <input className={`${fieldClass} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, profession or location" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Status
              <select className={`${fieldClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map((item) => (
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
            {filtered
              .slice()
              .sort((a, b) => (b.applicationSubmittedAt ?? "").localeCompare(a.applicationSubmittedAt ?? ""))
              .map((profile) => (
                <Link key={profile.id} href={`/admin/professionals/${profile.id}`}>
                  <Card className="p-4 transition-shadow hover:shadow-md">
                    <div className="grid gap-2 sm:grid-cols-[1.6fr_1fr_1fr_1fr_auto] sm:items-center">
                      <div>
                        <p className="font-black text-slate-900">{profile.displayName}</p>
                        <p className="text-xs text-slate-500">{KIND_LABELS[profile.kind]} · {profile.city}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-600">{profile.primarySpecialisation}</p>
                      <p className="text-xs text-slate-500">{profile.applicationSubmittedAt ? `Submitted ${formatDate(profile.applicationSubmittedAt)}` : "Not yet submitted"}</p>
                      <p className="text-xs text-slate-500">{profile.applicationSubmittedAt ? `${daysSince(profile.applicationSubmittedAt)} days old` : ""}</p>
                      <StatusPill status={profile.status} />
                    </div>
                  </Card>
                </Link>
              ))}
          </div>
        ) : (
          <EmptyState title="No applications found" description="Try a different search or filter." />
        )}
      </RequirePermission>
    </PageFrame>
  );
}

function RejectApplicationModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (values: { category: string; internalReason: string; applicantVisibleReason: string; reapplicationAllowed: boolean; earliestReapplicationDate: string }) => void }) {
  const [applicantVisibleReason, setApplicantVisibleReason] = useState("");
  const [reapplicationAllowed, setReapplicationAllowed] = useState(true);
  const [earliestReapplicationDate, setEarliestReapplicationDate] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setApplicantVisibleReason("");
      setReapplicationAllowed(true);
      setEarliestReapplicationDate("");
    }
  }

  return (
    <ReasonFormModal
      open={open}
      onClose={onClose}
      title="Reject application"
      description="The applicant sees the applicant-visible reason on their application status page."
      destructive
      submitLabel="Reject application"
      reasonOptions={REJECTION_CATEGORIES}
      reasonLabel="Rejection category"
      noteLabel="Internal reason (staff only)"
      noteRequired
      onSubmit={({ reason, note }) => onSubmit({ category: reason, internalReason: note, applicantVisibleReason: applicantVisibleReason.trim(), reapplicationAllowed, earliestReapplicationDate })}
    >
      <label className="mt-4 block text-sm font-bold text-slate-700">
        Applicant-visible reason
        <textarea required className={`${fieldClass} mt-2 min-h-20`} value={applicantVisibleReason} onChange={(e) => setApplicantVisibleReason(e.target.value)} placeholder="Shown to the applicant on their status page." />
      </label>
      <label className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-700">
        <input type="checkbox" className="h-4 w-4 accent-[#2ec440]" checked={reapplicationAllowed} onChange={(e) => setReapplicationAllowed(e.target.checked)} />
        Allow reapplication
      </label>
      {reapplicationAllowed && (
        <label className="mt-3 block text-sm font-bold text-slate-700">
          Earliest reapplication date (optional)
          <input type="date" className={`${fieldClass} mt-2`} value={earliestReapplicationDate} onChange={(e) => setEarliestReapplicationDate(e.target.value)} />
        </label>
      )}
    </ReasonFormModal>
  );
}

export function ProfessionalDetailPage({ applicationId }: { applicationId: string }) {
  const { account } = useAuth();
  const { actorAccountId, actorName } = useActor();
  useAdminState();
  const { showToast } = useToast();
  const canView = useHasPermission(account?.id, "professionals.view");
  const canVerify = useHasPermission(account?.id, "professionals.verify");
  const canSuspend = useHasPermission(account?.id, "professionals.suspend");

  const [infoOpen, setInfoOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  const profile = AdminService.getApplication(applicationId);
  const history = profile ? AdminService.getVerificationHistory(profile.id) : [];
  const assignedOfficerId = profile ? AdminService.getSnapshot().applicationAssignments[profile.id] : undefined;
  const assignedOfficerName = assignedOfficerId ? AdminService.getSnapshot().users[assignedOfficerId]?.name ?? assignedOfficerId : undefined;

  if (!canView) {
    return (
      <PageFrame title="Professionals" description="">
        <RequirePermission granted={false}>{null}</RequirePermission>
      </PageFrame>
    );
  }

  if (!profile) {
    return (
      <PageFrame title="Application not found" description="This application could not be found.">
        <EmptyState title="Application not found" description="The application may have been removed, or the link is incorrect." />
      </PageFrame>
    );
  }

  const documents = documentsFor(profile.kind);

  return (
    <PageFrame
      title={profile.displayName}
      description={`${KIND_LABELS[profile.kind]} · ${profile.primarySpecialisation} · ${profile.city}`}
      action={
        <Link href="/admin/professionals" className="text-sm font-bold text-slate-500 hover:text-[#219b31]">
          Back to Professionals
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-900">Applicant summary</h3>
              <StatusPill status={profile.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-slate-400">Legal name</dt><dd className="mt-1 font-semibold text-slate-700">{profile.legalName || "Not provided"}</dd></div>
              <div><dt className="text-xs text-slate-400">Business name</dt><dd className="mt-1 font-semibold text-slate-700">{profile.businessName || "Not applicable"}</dd></div>
              <div><dt className="text-xs text-slate-400">Email</dt><dd className="mt-1 font-semibold text-slate-700">{profile.email}</dd></div>
              <div><dt className="text-xs text-slate-400">Phone</dt><dd className="mt-1 font-semibold text-slate-700">{profile.phone || "Not provided"}</dd></div>
              <div><dt className="text-xs text-slate-400">Country / City</dt><dd className="mt-1 font-semibold text-slate-700">{profile.country} · {profile.city}</dd></div>
              <div><dt className="text-xs text-slate-400">Years of experience</dt><dd className="mt-1 font-semibold text-slate-700">{profile.yearsExperience}</dd></div>
              <div><dt className="text-xs text-slate-400">Languages</dt><dd className="mt-1 font-semibold text-slate-700">{profile.languages.join(", ") || "Not provided"}</dd></div>
              <div><dt className="text-xs text-slate-400">Submitted</dt><dd className="mt-1 font-semibold text-slate-700">{profile.applicationSubmittedAt ? formatDate(profile.applicationSubmittedAt) : "Not yet submitted"}</dd></div>
              <div><dt className="text-xs text-slate-400">Assigned officer</dt><dd className="mt-1 font-semibold text-slate-700">{assignedOfficerName ?? "Unassigned"}</dd></div>
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{profile.biography}</p>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Qualifications and registration</h3>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-slate-400">Registration number</dt><dd className="mt-1 font-semibold text-slate-700">{profile.registrationNumber || "Not provided"}</dd></div>
              <div><dt className="text-xs text-slate-400">Licensing body</dt><dd className="mt-1 font-semibold text-slate-700">{profile.licensingBody || "Not provided"}</dd></div>
              <div><dt className="text-xs text-slate-400">Licence expiry</dt><dd className="mt-1 font-semibold text-slate-700">{profile.licenceExpiry ? formatDate(profile.licenceExpiry) : "Not provided"}</dd></div>
              <div><dt className="text-xs text-slate-400">Secondary specialisations</dt><dd className="mt-1 font-semibold text-slate-700">{profile.secondarySpecialisations.join(", ") || "None"}</dd></div>
            </dl>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Verification documents</h3>
            <p className="mt-1 text-xs text-slate-500">Prototype document metadata only — no files were uploaded to an external service, and no document is automatically verified.</p>
            <div className="mt-4 divide-y divide-slate-100">
              {documents.map((label) => {
                const decision = AdminService.getLatestDocumentDecision(profile.id, label);
                return (
                  <div key={label} className="flex flex-col gap-2 py-3.5 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{label}</p>
                      <StatusPill status={decision} />
                    </div>
                    {canVerify && (
                      <select
                        className={`${fieldClass} sm:w-64`}
                        value={decision}
                        onChange={(e) => {
                          AdminService.reviewDocument(profile.id, label, e.target.value as DocumentReviewDecision, actorAccountId, actorName);
                          showToast(`${label} marked ${e.target.value.replace(/_/g, " ")}.`);
                        }}
                      >
                        {DOCUMENT_DECISIONS.map((item) => (
                          <option key={item} value={item}>
                            {item.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Services and availability</h3>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {profile.services.map((service) => (
                <li key={service.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {service.name}
                </li>
              ))}
            </ul>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-slate-400">Service areas</dt><dd className="mt-1 font-semibold text-slate-700">{profile.serviceAreas.join(", ") || "Not provided"}</dd></div>
              <div><dt className="text-xs text-slate-400">Pricing approach</dt><dd className="mt-1 font-semibold text-slate-700">{profile.pricingApproaches.join(", ") || "Not provided"}</dd></div>
              <div><dt className="text-xs text-slate-400">Availability</dt><dd className="mt-1 font-semibold text-slate-700">{profile.availability}</dd></div>
              <div><dt className="text-xs text-slate-400">Portfolio items</dt><dd className="mt-1 font-semibold text-slate-700">{profile.portfolio.length}</dd></div>
            </dl>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Application history</h3>
            <div className="mt-4 divide-y divide-slate-100">
              {history.length ? (
                history.map((entry) => (
                  <div key={entry.id} className="py-3 first:pt-0">
                    <p className="text-sm font-semibold text-slate-800">{entry.action.replace(/_/g, " ")}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{entry.detail}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{entry.actorName} · {formatDateTime(entry.at)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No history recorded yet.</p>
              )}
            </div>
            {canView && (
              <form
                className="mt-4 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!noteText.trim()) return;
                  AdminService.addApplicationNote(profile.id, actorAccountId, actorName, noteText.trim());
                  setNoteText("");
                  showToast("Note added.");
                }}
              >
                <input className={fieldClass} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add an internal note…" />
                <PrimaryButton type="submit">Add</PrimaryButton>
              </form>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {(canVerify || canSuspend) && (
            <Card>
              <h3 className="text-lg font-black text-slate-900">Verification actions</h3>
              <div className="mt-4 flex flex-col gap-2">
                {canVerify && !assignedOfficerId && (
                  <SecondaryButton
                    onClick={() => {
                      AdminService.assignApplication(profile.id, actorAccountId, actorAccountId);
                      showToast("Assigned to you.");
                    }}
                  >
                    Assign to me
                  </SecondaryButton>
                )}
                {canVerify && assignedOfficerId && assignedOfficerId !== actorAccountId && (
                  <SecondaryButton
                    onClick={() => {
                      AdminService.assignApplication(profile.id, actorAccountId, actorAccountId);
                      showToast("Reassigned to you.");
                    }}
                  >
                    Reassign to me
                  </SecondaryButton>
                )}
                {canVerify && ["submitted", "under_review", "more_information_required"].includes(profile.status) && (
                  <>
                    <SecondaryButton onClick={() => setInfoOpen(true)}>Request more information</SecondaryButton>
                    <PrimaryButton onClick={() => setApproveOpen(true)}>Approve</PrimaryButton>
                    <SecondaryButton onClick={() => setRejectOpen(true)} className="border-red-200 text-red-600 hover:border-red-300 hover:text-red-700">
                      Reject
                    </SecondaryButton>
                  </>
                )}
                {canSuspend && profile.status === "approved" && <SecondaryButton onClick={() => setSuspendOpen(true)}>Suspend verification</SecondaryButton>}
                {canSuspend && profile.status === "suspended" && <SecondaryButton onClick={() => setRestoreOpen(true)}>Restore verification</SecondaryButton>}
              </div>
            </Card>
          )}
        </div>
      </div>

      <ReasonFormModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Request more information"
        description="The applicant will see this request on their application status page."
        reasonLabel="What is missing or unclear?"
        submitLabel="Send request"
        onSubmit={({ reason, note }) => {
          AdminService.requestApplicationInformation(profile.id, actorAccountId, actorName, `${reason}${note ? ` — ${note}` : ""}`);
          setInfoOpen(false);
          showToast("Information requested from applicant.");
        }}
      />

      <ApproveProfessionalApplicationModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        profile={profile}
        onSubmit={({ note }) => {
          AdminService.approveApplication(profile.id, actorAccountId, actorName, note);
          setApproveOpen(false);
          showToast("Application approved.");
        }}
      />

      <RejectApplicationModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={(values) => {
          AdminService.rejectApplication(profile.id, actorAccountId, actorName, values.category, values.internalReason, values.applicantVisibleReason, values.reapplicationAllowed, values.earliestReapplicationDate || undefined);
          setRejectOpen(false);
          showToast("Application rejected.");
        }}
      />

      <ReasonFormModal
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        destructive
        title="Suspend verification"
        description="The professional loses workspace access to new requests until restored. Existing accepted work remains visible for handling."
        submitLabel="Suspend verification"
        onSubmit={({ reason, note }) => {
          AdminService.suspendVerification(profile.id, actorAccountId, actorName, `${reason}${note ? ` — ${note}` : ""}`);
          setSuspendOpen(false);
          showToast("Verification suspended.");
        }}
      />

      <ConfirmModal
        open={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        title="Restore verification?"
        description="The professional regains normal workspace access."
        confirmLabel="Restore verification"
        onConfirm={() => {
          AdminService.restoreVerification(profile.id, actorAccountId, actorName);
          setRestoreOpen(false);
          showToast("Verification restored.");
        }}
      />
    </PageFrame>
  );
}
