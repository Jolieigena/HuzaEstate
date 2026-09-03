"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { useAdminState, useHasPermission } from "@/lib/admin/hooks";
import { ADMIN_ROLE_LABELS } from "@/lib/admin/permissions";
import { AdminService } from "@/lib/admin/service";
import type { AccountDirectoryType, AccountRestrictionKind, AccountStatus } from "@/lib/admin/types";
import { useToast } from "@/lib/toast-context";
import AssignRoleModal from "../AssignRoleModal";
import ReasonFormModal from "../ReasonFormModal";
import { Card, EmptyState, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, StatusPill, fieldClass, formatDate, formatDateTime } from "../ui";

const ACCOUNT_TYPE_LABELS: Record<AccountDirectoryType, string> = { customer: "Customer", seller_manager: "Seller / Manager", professional: "Professional", contractor: "Contractor", administrator: "Administrator" };
const RESTRICTION_LABELS: Record<AccountRestrictionKind, string> = {
  cannot_publish_listings: "Cannot publish listings",
  cannot_submit_professional_application: "Cannot submit professional application",
  cannot_accept_professional_work: "Cannot accept professional work",
  cannot_submit_quotations: "Cannot submit quotations",
  cannot_create_ai_generations: "Cannot create AI generations",
  cannot_upload_documents: "Cannot upload documents",
  read_only: "Read-only access",
};
const STATUS_OPTIONS: AccountStatus[] = ["active", "pending", "restricted", "suspended", "closed"];

function useActor() {
  const { account } = useAuth();
  return { actorAccountId: account?.id ?? "system", actorName: account?.name ?? "System" };
}

export function UsersListPage() {
  const { account } = useAuth();
  useAdminState();
  const canView = useHasPermission(account?.id, "users.view");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | AccountDirectoryType>("all");
  const [status, setStatus] = useState<"all" | AccountStatus>("all");

  const users = AdminService.listUsers();
  const filtered = useMemo(
    () =>
      users.filter((user) => {
        const q = search.trim().toLowerCase();
        const matchesSearch = !q || [user.name, user.email, user.accountId].some((field) => field.toLowerCase().includes(q));
        return matchesSearch && (type === "all" || user.accountType === type) && (status === "all" || user.status === status);
      }),
    [users, search, type, status]
  );

  return (
    <PageFrame title="Users" description="Manage customer, seller, professional, contractor and administrator accounts across the platform.">
      <RequirePermission granted={canView}>
        <Card className="mb-5">
          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
            <label className="text-sm font-bold text-slate-700">
              Search
              <input className={`${fieldClass} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email or account ID" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Account type
              <select className={`${fieldClass} mt-1`} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                <option value="all">All account types</option>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              Status
              <select className={`${fieldClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <p className="mb-3 text-xs font-semibold text-slate-400">{filtered.length} of {users.length} accounts</p>

        {filtered.length ? (
          <div className="grid gap-3">
            {filtered.map((user) => {
              const activeRestrictions = user.restrictions.filter((r) => r.active).length;
              return (
                <Link key={user.accountId} href={`/admin/users/${user.accountId}`}>
                  <Card className="p-4 transition-shadow hover:shadow-md">
                    <div className="grid gap-2 sm:grid-cols-[1.6fr_1fr_1fr_1fr_auto] sm:items-center">
                      <div>
                        <p className="font-black text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-600">{ACCOUNT_TYPE_LABELS[user.accountType]}</p>
                      <p className="text-xs text-slate-500">Registered {formatDate(user.registeredAt)}</p>
                      <p className="text-xs text-slate-500">{activeRestrictions ? `${activeRestrictions} active restriction${activeRestrictions === 1 ? "" : "s"}` : "No restrictions"}</p>
                      <StatusPill status={user.status} />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No users found" description="Try a different search or filter." />
        )}
      </RequirePermission>
    </PageFrame>
  );
}

function RestrictUserModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (values: { kind: AccountRestrictionKind; reason: string; internalNote: string; customerVisibleExplanation: string; expiryDate: string }) => void }) {
  const [kind, setKind] = useState<AccountRestrictionKind>("cannot_publish_listings");
  const [customerVisibleExplanation, setCustomerVisibleExplanation] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setKind("cannot_publish_listings");
      setCustomerVisibleExplanation("");
      setExpiryDate("");
    }
  }

  return (
    <ReasonFormModal
      open={open}
      onClose={onClose}
      title="Restrict account"
      description="Restrictions limit specific capabilities without suspending the whole account."
      reasonLabel="Internal reason"
      noteLabel="Internal note (optional)"
      submitLabel="Add restriction"
      onSubmit={({ reason, note }) => onSubmit({ kind, reason, internalNote: note, customerVisibleExplanation: customerVisibleExplanation.trim(), expiryDate })}
    >
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold text-slate-700">
          Restriction
          <select className={`${fieldClass} mt-2`} value={kind} onChange={(e) => setKind(e.target.value as AccountRestrictionKind)}>
            {Object.entries(RESTRICTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-bold text-slate-700">
          Optional expiry
          <input type="date" className={`${fieldClass} mt-2`} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </label>
      </div>
      <label className="mt-4 block text-sm font-bold text-slate-700">
        Customer-visible explanation
        <textarea required className={`${fieldClass} mt-2 min-h-20`} value={customerVisibleExplanation} onChange={(e) => setCustomerVisibleExplanation(e.target.value)} placeholder="Shown to the account holder." />
      </label>
    </ReasonFormModal>
  );
}

export function UserDetailPage({ userId }: { userId: string }) {
  const { account } = useAuth();
  const { actorAccountId, actorName } = useActor();
  const state = useAdminState();
  const { showToast } = useToast();
  const canView = useHasPermission(account?.id, "users.view");
  const canManage = useHasPermission(account?.id, "users.manage");
  const canSuspend = useHasPermission(account?.id, "users.suspend");
  const canAssignRoles = useHasPermission(account?.id, "roles.assign");

  const [noteText, setNoteText] = useState("");
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [restrictOpen, setRestrictOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [assignRoleOpen, setAssignRoleOpen] = useState(false);
  const [removeRoleOpen, setRemoveRoleOpen] = useState(false);

  const user = state.users[userId];
  const roleAssignment = state.roleAssignments.find((item) => item.accountId === userId);

  if (!canView) {
    return (
      <PageFrame title="Users" description="">
        <RequirePermission granted={false}>{null}</RequirePermission>
      </PageFrame>
    );
  }

  if (!user) {
    return (
      <PageFrame title="User not found" description="This account could not be found.">
        <EmptyState title="User not found" description="The account may have been removed, or the link is incorrect." />
      </PageFrame>
    );
  }

  return (
    <PageFrame
      title={user.name}
      description={`${ACCOUNT_TYPE_LABELS[user.accountType]} · ${user.email}`}
      action={
        <Link href="/admin/users" className="text-sm font-bold text-slate-500 hover:text-[#219b31]">
          Back to Users
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-900">Account summary</h3>
              <StatusPill status={user.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-400">Account ID</dt>
                <dd className="mt-1 font-semibold text-slate-700">{user.accountId}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Phone</dt>
                <dd className="mt-1 font-semibold text-slate-700">{user.phone ?? "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Verification</dt>
                <dd className="mt-1 font-semibold text-slate-700">{user.verification.replace(/_/g, " ")}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Registered</dt>
                <dd className="mt-1 font-semibold text-slate-700">{formatDate(user.registeredAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Last activity</dt>
                <dd className="mt-1 font-semibold text-slate-700">{formatDate(user.lastActivityAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Data source</dt>
                <dd className="mt-1 font-semibold text-slate-700">{user.synthetic ? "Seeded prototype record" : "Demo login account"}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Restrictions</h3>
            <div className="mt-4 divide-y divide-slate-100">
              {user.restrictions.length ? (
                user.restrictions.map((restriction) => (
                  <div key={restriction.id} className="flex items-start justify-between gap-4 py-3.5 first:pt-0">
                    <div>
                      <p className="font-bold text-slate-800">
                        {RESTRICTION_LABELS[restriction.kind]}
                        {!restriction.active && <span className="ml-2 text-xs font-semibold text-slate-400">(lifted)</span>}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{restriction.customerVisibleExplanation}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Effective {formatDate(restriction.effectiveDate)}
                        {restriction.expiryDate ? ` · Expires ${formatDate(restriction.expiryDate)}` : ""}
                      </p>
                    </div>
                    {restriction.active && canSuspend && (
                      <SecondaryButton
                        onClick={() => {
                          AdminService.removeRestriction(user.accountId, restriction.id, actorAccountId);
                          showToast("Restriction lifted.");
                        }}
                      >
                        Lift
                      </SecondaryButton>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No restrictions on this account.</p>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Status history</h3>
            <div className="mt-4 divide-y divide-slate-100">
              {user.statusHistory.length ? (
                user.statusHistory.map((change) => (
                  <div key={change.id} className="py-3 first:pt-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {change.from} → {change.to}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{change.reason}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(change.at)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No status changes recorded.</p>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Administrative notes</h3>
            <div className="mt-4 divide-y divide-slate-100">
              {user.notes.length ? (
                user.notes.map((note) => (
                  <div key={note.id} className="py-3 first:pt-0">
                    <p className="text-sm text-slate-800">{note.text}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {note.authorName} · {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No internal notes yet.</p>
              )}
            </div>
            {canManage && (
              <form
                className="mt-4 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!noteText.trim()) return;
                  AdminService.addUserNote(user.accountId, actorAccountId, actorName, noteText.trim());
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
          <Card>
            <h3 className="text-lg font-black text-slate-900">Administrative role</h3>
            {roleAssignment ? (
              <div className="mt-4">
                <StatusPill status={ADMIN_ROLE_LABELS[roleAssignment.role]} />
                <p className="mt-2 text-xs text-slate-500">
                  Assigned {formatDate(roleAssignment.assignedAt)}
                  {roleAssignment.expiresAt ? ` · Expires ${formatDate(roleAssignment.expiresAt)}` : ""}
                </p>
                {canAssignRoles && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <SecondaryButton onClick={() => setAssignRoleOpen(true)}>Change role</SecondaryButton>
                    <SecondaryButton onClick={() => setRemoveRoleOpen(true)}>Remove role</SecondaryButton>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-slate-500">No administrative role assigned.</p>
                {canAssignRoles && (
                  <PrimaryButton className="mt-3" onClick={() => setAssignRoleOpen(true)}>
                    Assign role
                  </PrimaryButton>
                )}
              </div>
            )}
          </Card>

          {(canManage || canSuspend) && (
            <Card>
              <h3 className="text-lg font-black text-slate-900">Actions</h3>
              <div className="mt-4 flex flex-col gap-2">
                {canSuspend && user.status !== "suspended" && <SecondaryButton onClick={() => setSuspendOpen(true)}>Suspend account</SecondaryButton>}
                {canSuspend && (user.status === "suspended" || user.status === "restricted") && <SecondaryButton onClick={() => setRestoreOpen(true)}>Restore account</SecondaryButton>}
                {canManage && <SecondaryButton onClick={() => setRestrictOpen(true)}>Add restriction</SecondaryButton>}
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmModal
        open={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        onConfirm={() => {
          AdminService.updateUserStatus(user.accountId, "active", actorAccountId, "Account restored by administrator.");
          setRestoreOpen(false);
          showToast("Account restored.");
        }}
        title="Restore this account?"
        description="The account regains normal access. This action is recorded in the audit log."
        confirmLabel="Restore account"
      />

      <ReasonFormModal
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        title="Suspend account"
        description="The account loses access until restored. The explanation should be clear and specific — it may be shown to the account holder."
        destructive
        submitLabel="Suspend account"
        reasonLabel="Internal reason"
        noteLabel="Customer-visible explanation"
        noteRequired
        onSubmit={({ reason, note }) => {
          AdminService.updateUserStatus(user.accountId, "suspended", actorAccountId, `${reason}${note ? ` — ${note}` : ""}`);
          setSuspendOpen(false);
          showToast("Account suspended.");
        }}
      />

      <RestrictUserModal
        open={restrictOpen}
        onClose={() => setRestrictOpen(false)}
        onSubmit={(values) => {
          AdminService.addRestriction(user.accountId, values.kind, actorAccountId, values.reason, values.customerVisibleExplanation, values.expiryDate || undefined, values.internalNote || undefined);
          setRestrictOpen(false);
          showToast("Restriction added.");
        }}
      />

      <AssignRoleModal
        open={assignRoleOpen}
        onClose={() => setAssignRoleOpen(false)}
        users={[user]}
        presetAccountId={user.accountId}
        onSubmit={(values) => {
          AdminService.assignRole(values.accountId, values.role, actorAccountId, values.reason, values.expiresAt);
          setAssignRoleOpen(false);
          showToast("Role assigned.");
        }}
      />

      <ConfirmModal
        open={removeRoleOpen}
        onClose={() => setRemoveRoleOpen(false)}
        destructive
        title="Remove administrative role?"
        description="This account will lose access to the Administration Portal."
        confirmLabel="Remove role"
        onConfirm={() => {
          const result = AdminService.removeRoleAssignment(user.accountId, actorAccountId, "Removed from user detail page.");
          setRemoveRoleOpen(false);
          if (result.blocked) showToast(result.message ?? "This action is blocked.", "error");
          else showToast("Role removed.");
        }}
      />
    </PageFrame>
  );
}
