"use client";

import { useEffect } from "react";
import { reportLandingVisit } from "@/lib/analytics/api";

/** Counts a landing page visit once per browser session: a reload or coming back to the page in the same tab does not count again.
 *  Does nothing when the visitor has asked not to be tracked, or for automated browsers. Renders nothing. */
export default function LandingVisitTracker({ path }: { path: "/" | "/home" }) {
  useEffect(() => {
    try {
      if (navigator.doNotTrack === "1" || navigator.webdriver) return;
      const key = `huzaestate_visit_reported_${path}`;
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // storage blocked: report anyway, the server counts a repeat within half an hour only once
    }
    reportLandingVisit(path);
  }, [path]);
  return null;
}
