"use client";

import { useMemo, useSyncExternalStore } from "react";
import { hasPermission } from "./permissions";
import { AdminService } from "./service";
import type { AdminRole, Permission } from "./types";

export function useAdminState() {
  return useSyncExternalStore(AdminService.subscribe, AdminService.getSnapshot, AdminService.getServerSnapshot);
}

export function useAdminRole(accountId?: string): AdminRole | undefined {
  const state = useAdminState();
  return useMemo(() => state.roleAssignments.find((item) => item.accountId === accountId)?.role, [state, accountId]);
}

export function useHasPermission(accountId: string | undefined, permission: Permission) {
  const role = useAdminRole(accountId);
  return hasPermission(role, permission);
}

export function useAdminNotifications(accountId?: string) {
  const state = useAdminState();
  return useMemo(
    () =>
      state.notifications
        .filter((item) => !item.recipientAccountId || item.recipientAccountId === accountId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state, accountId]
  );
}
