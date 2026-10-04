"use client";

import { useRouter } from "next/navigation";
import { getPreviousAppPath } from "./NavigationTracker";

// Pages that make no sense to land back on once you've moved past them.
const SKIP_PREFIXES = ["/login", "/signup", "/change-password"];

/** Returns to wherever the visitor came from (an admin queue, search results, a seller's list)
 *  rather than always landing on the public search. Falls back to `fallbackHref` when there's no
 *  in-app page behind this one — a pasted link, a new tab, or you arrived from the sign-in page. */
export default function BackLink({ fallbackHref = "/properties", className = "", children = "Back" }: { fallbackHref?: string; className?: string; children?: React.ReactNode }) {
  const router = useRouter();
  const goBack = () => {
    const previous = getPreviousAppPath();
    const cameFromApp = window.history.length > 1 && !!previous && !SKIP_PREFIXES.some((prefix) => previous.startsWith(prefix));
    if (cameFromApp) router.back();
    else router.push(fallbackHref);
  };
  return (
    <button type="button" onClick={goBack} className={`inline-flex items-center gap-2 font-bold text-slate-600 transition-colors hover:text-slate-900 ${className}`}>
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
      </svg>
      {children}
    </button>
  );
}
