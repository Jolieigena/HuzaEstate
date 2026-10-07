/** Shared route display policy. Segment boundaries keep /professional and
 * /professionals distinct, and shell selection still depends on auth in UI. */
const ACCOUNT_PREFIXES = [
  "/dashboard", "/studio", "/execution",
  "/payments", "/invoices", "/contracts",
];
const FOOTER_HIDDEN_EXACT = ["/login", "/signup", "/become-a-seller"];

function isWithin(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getRouteDisplay(pathname: string): {
  shell: "public" | "account" | "admin" | "manager" | "org-admin" | "professional" | "supplier";
  showFooter: boolean;
} {
  const isAdmin = isWithin(pathname, "/admin");
  const isManager = isWithin(pathname, "/manager");
  const isOrgAdmin = isWithin(pathname, "/org-admin");
  // /professional (singular) supplies its own header+sidebar shell, same as the other
  // portals below — distinct from /professionals (plural), the public directory.
  const isProfessional = isWithin(pathname, "/professional");
  // /supplier is the furniture supplier portal, with its own shell too.
  const isSupplier = isWithin(pathname, "/supplier");
  const isAccount = ACCOUNT_PREFIXES.some((prefix) => isWithin(pathname, prefix));
  return {
    shell: isAdmin ? "admin" : isManager ? "manager" : isOrgAdmin ? "org-admin" : isProfessional ? "professional" : isSupplier ? "supplier" : isAccount ? "account" : "public",
    showFooter: !(
      isAdmin || isAccount || isManager || isOrgAdmin || isProfessional || isSupplier ||
      isWithin(pathname, "/dev") || FOOTER_HIDDEN_EXACT.includes(pathname)
    ),
  };
}
