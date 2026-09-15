/** Shared route display policy. Segment boundaries keep /professional and
 * /professionals distinct, and shell selection still depends on auth in UI. */
const ACCOUNT_PREFIXES = [
  "/dashboard", "/studio", "/professional", "/execution",
  "/payments", "/invoices", "/contracts",
];
const FOOTER_HIDDEN_EXACT = ["/login", "/signup", "/become-a-seller"];

function isWithin(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getRouteDisplay(pathname: string): {
  shell: "public" | "account" | "admin" | "manager";
  showFooter: boolean;
} {
  const isAdmin = isWithin(pathname, "/admin");
  const isManager = isWithin(pathname, "/manager");
  const isAccount = ACCOUNT_PREFIXES.some((prefix) => isWithin(pathname, prefix));
  return {
    shell: isAdmin ? "admin" : isManager ? "manager" : isAccount ? "account" : "public",
    showFooter: !(
      isAdmin || isAccount || isManager ||
      isWithin(pathname, "/dev") || FOOTER_HIDDEN_EXACT.includes(pathname)
    ),
  };
}
