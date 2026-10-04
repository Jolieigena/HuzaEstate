"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const CURRENT_KEY = "huza:current-path";
const PREVIOUS_KEY = "huza:previous-path";

/** The in-app page the visitor was on before this one, or null if there isn't one (first page of
 *  the tab, or the tab was opened straight onto this page). See NavigationTracker. */
export function getPreviousAppPath(): string | null {
  try {
    return window.sessionStorage.getItem(PREVIOUS_KEY);
  } catch {
    return null;
  }
}

/** Remembers the previous in-app page on every route change. `document.referrer` can't answer
 *  "where did they come from?" here — it's only set when a whole document loads, and Next's
 *  client-side navigation never reloads one — so BackLink reads this instead. sessionStorage
 *  keeps it across a reload of the current page. Renders nothing. */
export default function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const current = window.sessionStorage.getItem(CURRENT_KEY);
      if (current && current !== pathname) window.sessionStorage.setItem(PREVIOUS_KEY, current);
      window.sessionStorage.setItem(CURRENT_KEY, pathname);
    } catch {
      // Storage blocked (private mode, etc.) — BackLink falls back to its default destination.
    }
  }, [pathname]);
  return null;
}
