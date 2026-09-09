"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

const HIDDEN_EXACT = ["/login", "/signup", "/become-a-seller"];

// Same account-style/dashboard routes AppShell treats as "internal app"
// (see ACCOUNT_SHELL_ROUTES/ADMIN_SHELL_ROUTE in AppShell.tsx), plus
// /manager and /dev, which are dashboard-style pages too even though they
// still use the public Navbar. `(\/|$)` boundary keeps e.g. /professional
// from also matching /professionals (the public apply page, which should
// keep its footer).
const HIDDEN_PREFIXES = [
  /^\/dashboard(\/|$)/,
  /^\/studio(\/|$)/,
  /^\/professional(\/|$)/,
  /^\/execution(\/|$)/,
  /^\/payments(\/|$)/,
  /^\/invoices(\/|$)/,
  /^\/contracts(\/|$)/,
  /^\/admin(\/|$)/,
  /^\/manager(\/|$)/,
  /^\/dev(\/|$)/,
];

function isInternalPage(pathname: string): boolean {
  return HIDDEN_EXACT.includes(pathname) || HIDDEN_PREFIXES.some((pattern) => pattern.test(pathname));
}

export default function ConditionalFooter() {
  const pathname = usePathname();

  if (isInternalPage(pathname)) {
    return null;
  }

  return <Footer />;
}
