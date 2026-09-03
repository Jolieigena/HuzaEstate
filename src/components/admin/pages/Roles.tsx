"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { useAdminState, useHasPermission } from "@/lib/admin/hooks";
import { ADMIN_ROLE_DESCRIPTIONS, ADMIN_ROLE_LABELS, PERMISSION_LABELS, ROLE_PERMISSIONS } from "@/lib/admin/permissions";
import { AdminService } from "@/lib/admin/service";
import type { AdminRole } from "@/lib/admin/types";
import { useToast } from "@/lib/toast-context";
import AssignRoleModal from "../AssignRoleModal";
import { Card, PageFrame, PrimaryButton, RequirePermission, formatDate } from "../ui";

const ROLE_ORDER = Object.keys(ADMIN_ROLE_LABELS) as AdminRole[];

export function RolesPage() {
  const { account } = useAuth();
  const state = useAdminState();
  const canView = useHasPermission(account?.id, "roles.view");
  const canAssign = useHasPermission(account?.id, "roles.assign");
  const { showToast } = useToast();
  const [assignOpen, setAssignOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const users = AdminService.listUsers();
  const usersById = useMemo(() => new Map(users.map((user) => [user.accountId, user])), [users]);

  return (
    <PageFrame
      title="Roles and permissions"
      description="Administrative roles and the staff currently assigned to each. System roles cannot be deleted."
      action={
        canAssign ? (
          <PrimaryButton onClick={() => setAssignOpen(true)}>Assign role</PrimaryButton>
        ) : undefined
      }
    >
      <RequirePermission granted={canView}>
        <div className="grid gap-5 xl:grid-cols-2">
          {ROLE_ORDER.map((role) => {
            const assignments = state.roleAssignments.filter((item) => item.role === role);
            return (
              <Card key={role}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{ADMIN_ROLE_LABELS[role]}</h3>
                    <p className="mt-1 text-sm text-slate-500">{ADMIN_ROLE_DESCRIPTIONS[role]}</p>
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">System role</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {ROLE_PERMISSIONS[role].map((permission) => (
                    <span key={permission} className="rounded-full bg-[#2ec440]/10 px-2.5 py-1 text-xs font-semibold text-[#219b31]">
                      {PERMISSION_LABELS[permission]}
                    </span>
                  ))}
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Assigned staff ({assignments.length})</p>
                  <div className="mt-2 divide-y divide-slate-100">
                    {assignments.length ? (
                      assignments.map((assignment) => (
                        <div key={assignment.accountId} className="flex items-center justify-between gap-3 py-2.5">
                          <div>
                            <Link href={`/admin/users/${assignment.accountId}`} className="text-sm font-bold text-slate-800 hover:text-[#219b31]">
                              {usersById.get(assignment.accountId)?.name ?? assignment.accountId}
                            </Link>
                            <p className="text-xs text-slate-400">Since {formatDate(assignment.assignedAt)}</p>
                          </div>
                          {canAssign && (
                            <button type="button" onClick={() => setRemoveTarget(assignment.accountId)} className="text-xs font-bold text-red-600 hover:underline">
                              Remove
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="py-2 text-sm text-slate-500">No staff assigned.</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <AssignRoleModal
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          users={users}
          onSubmit={(values) => {
            AdminService.assignRole(values.accountId, values.role, account?.id ?? "system", values.reason, values.expiresAt);
            setAssignOpen(false);
            showToast("Role assigned.");
          }}
        />

        <ConfirmModal
          open={Boolean(removeTarget)}
          onClose={() => setRemoveTarget(null)}
          destructive
          title="Remove administrative role?"
          description="This account will lose access to the Administration Portal."
          confirmLabel="Remove role"
          onConfirm={() => {
            if (!removeTarget) return;
            const result = AdminService.removeRoleAssignment(removeTarget, account?.id ?? "system", "Removed from Roles page.");
            setRemoveTarget(null);
            if (result.blocked) showToast(result.message ?? "This action is blocked.", "error");
            else showToast("Role removed.");
          }}
        />
      </RequirePermission>
    </PageFrame>
  );
}
