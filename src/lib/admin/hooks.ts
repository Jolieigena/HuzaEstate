"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useAuth } from "@/lib/auth-context";
import { hasPermission } from "./permissions";
import { AdminService } from "./service";
import type { AdminRole, Permission } from "./types";

export function useAdminState() {
  return useSyncExternalStore(AdminService.subscribe, AdminService.getSnapshot, AdminService.getServerSnapshot);
}

export function useAdminRole(accountId?: string): AdminRole | undefined {
  const { account } = useAuth();
  const state = useAdminState();
  return useMemo(() => {
    // The current session's admin role comes from the real backend (account.adminRole) —
    // only fall back to the local seed/mock role-assignment store when looking up a
    // DIFFERENT account (e.g. viewing someone else's row in the Users directory), which
    // still runs on prototype data until that directory is wired to the backend too.
    if (accountId && account?.id === accountId && account.adminRole) return account.adminRole as AdminRole;
    return state.roleAssignments.find((item) => item.accountId === accountId)?.role;
  }, [state, accountId, account]);
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
