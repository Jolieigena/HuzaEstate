"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { reportPageView } from "@/lib/analytics/api";
import { isTrackedPath } from "@/lib/analytics/paths";

/** Reports each public page a visitor opens, whether or not they are signed in: the page, and (when signed in) the sign-in, so the
 *  server can tell members from guests. Waits until the sign-in has been checked so a member is not counted as a guest. Does nothing
 *  on portals and account pages, when the visitor asked not to be tracked, or for automated browsers. Renders nothing. */
export default function VisitTracker() {
  const pathname = usePathname();
  const { token, isAuthReady } = useAuth();
  const last = useRef("");

  useEffect(() => {
    if (!isAuthReady || !pathname || !isTrackedPath(pathname)) return;
    try {
      if (navigator.doNotTrack === "1" || navigator.webdriver) return;
    } catch {
      // carry on: the server also drops visits sent with Do Not Track
    }
    // The same page as the same kind of visitor is reported once per mount; the server also counts a repeat within half an hour once.
    const key = `${token ? "member" : "guest"}|${pathname}`;
    if (last.current === key) return;
    last.current = key;
    reportPageView(pathname, token);
  }, [pathname, token, isAuthReady]);

  return null;
}
