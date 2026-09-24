export function getAccountName(accountId: string | undefined): string {
  if (!accountId) return "—";
  if (accountId === "system") return "System";
  return accountId;
}
