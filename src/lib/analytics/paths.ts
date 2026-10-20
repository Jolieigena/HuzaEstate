// Which pages a visit is reported for. The server decides again for itself (modules/analytics/service.ts, normalizePath), so this only
// saves the browser from sending reports the server would throw away. Keep the two lists the same.

const PRIVATE_SEGMENTS = new Set(["admin", "org-admin", "manager", "supplier", "professional", "dashboard", "studio", "execution", "dev", "api", "change-password", "payments", "invoices", "contracts", "post-property", "design-requests"]);

/** True for a public page: not a portal, a dashboard or an account page. */
export function isTrackedPath(pathname: string): boolean {
  const segments = pathname.split("?")[0].split("/").filter(Boolean);
  const first = (segments[0] ?? "").toLowerCase();
  if (PRIVATE_SEGMENTS.has(first)) return false;
  if (first === "shop" && (segments[1] ?? "").toLowerCase() === "orders") return false;
  return true;
}
