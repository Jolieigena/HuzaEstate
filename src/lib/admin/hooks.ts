"use client";

import { useAuth } from "@/lib/auth-context";

/** There is a single Administrator role: anyone holding it can use every admin page. */
export function useIsAdministrator(): boolean {
  const { account } = useAuth();
  return account?.roles.includes("administrator") ?? false;
}
