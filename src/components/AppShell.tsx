"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import AppHeader from "./AppHeader";
import Sidebar from "./Sidebar";
import MobileSidebarDrawer from "./MobileSidebarDrawer";
import { useAuth } from "@/lib/auth-context";

const COLLAPSE_STORAGE_KEY = "huzaestate_sidebar_collapsed";

/**
 * Route prefixes that make up the account-style app ("Saved Homes", Build
 * and Renovate studios, the Professional workspace). Everything else —
 * the public marketing site, the property marketplace, `/manager`, the
 * professional application's public explanation — keeps the original
 * Navbar untouched, logged in or not, per the "don't redesign existing
 * pages" restriction.
 */
const ACCOUNT_SHELL_ROUTES = [/^\/dashboard(\/|$)/, /^\/studio(\/|$)/, /^\/professional(\/|$)/, /^\/execution(\/|$)/, /^\/payments(\/|$)/, /^\/invoices(\/|$)/, /^\/contracts(\/|$)/];
const ADMIN_SHELL_ROUTE = /^\/admin(\/|$)/;

function isAccountShellRoute(pathname: string): boolean {
  return ACCOUNT_SHELL_ROUTES.some((pattern) => pattern.test(pathname));
}

function readStoredCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Within the account-style routes (Dashboard, Build/Renovate studios,
 * Professional workspace), a logged-in user gets the authenticated app
 * shell — the slim AppHeader plus a persistent, collapsible account
 * Sidebar — instead of the public marketing Navbar. Every other route,
 * and any route before the stored session has been checked (isAuthReady
 * false), keeps the public Navbar so the marketplace and marketing pages
 * never change based on login state.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const { isLoggedIn, isAuthReady } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      } catch {
        // ignore — collapse state just won't persist across visits
      }
      return next;
    });
  };

  // The Administration Portal supplies 100% of its own chrome (see
  // AdminShell) — no public Navbar, no dashboard AppHeader/Sidebar. This
  // check runs before the account-shell/Navbar branches below so `/admin`
  // never gets either, and every other route's branch is unaffected.
  if (ADMIN_SHELL_ROUTE.test(pathname)) {
    return <>{children}</>;
  }

  if (!(isAuthReady && isLoggedIn) || !isAccountShellRoute(pathname)) {
    return (
      <>
        <Navbar />
        <main className="flex-grow">{children}</main>
      </>
    );
  }

  return (
    <div className="flex-grow flex flex-col min-w-0">
      <AppHeader onOpenMobileSidebar={() => setMobileOpen(true)} />
      <div className="flex flex-grow min-w-0">
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
        <MobileSidebarDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="flex-grow min-w-0">{children}</main>
      </div>
    </div>
  );
}
