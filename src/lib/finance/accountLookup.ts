import { DEMO_ACCOUNTS, ADMIN_DEMO_ACCOUNTS } from "@/lib/auth-context";

const ALL_ACCOUNTS = [...DEMO_ACCOUNTS, ...ADMIN_DEMO_ACCOUNTS];

export function getAccountName(accountId: string | undefined): string {
  if (!accountId) return "—";
  if (accountId === "system") return "System";
  return ALL_ACCOUNTS.find((a) => a.id === accountId)?.name ?? accountId;
}
