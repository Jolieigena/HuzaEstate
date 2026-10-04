"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AdminApi } from "@/lib/admin/api";
import { hasOrgPermission } from "@/lib/orgPermissions";
import { PropertyApi } from "@/lib/properties/api";

export type NavBadges = Partial<Record<string, number>>;

const POLL_INTERVAL_MS = 45_000;

/** Counts of things waiting on a person, keyed by nav item key, for the red pills in the admin and
 *  org-admin sidebars: listings under review, open organisation requests, new inquiries. Refetched
 *  on an interval (same polling approach as NotificationBell — there's no push channel) and on
 *  every route change, so a count drops as soon as you've dealt with something and navigate on.
 *  A section the account can't open is never fetched, and a failed fetch just leaves its old count. */
export function useNavBadges(portal: "admin" | "org-admin"): NavBadges {
  const { token, account, isAuthReady } = useAuth();
  const pathname = usePathname();
  const [badges, setBadges] = useState<NavBadges>({});
  const permissions = account?.permissions;

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    const set = (key: string, count: number) => !cancelled && setBadges((prev) => (prev[key] === count ? prev : { ...prev, [key]: count }));

    function load() {
      if (portal === "admin") {
        PropertyApi.all(token as string).then((r) => r.ok && set("properties", r.data.filter((p) => p.status === "under_review").length));
        AdminApi.listOrgRequests(token as string, { status: "open" }).then((r) => r.ok && set("requests", r.data.length));
        PropertyApi.allInquiries(token as string).then((r) => r.ok && set("inquiries", r.data.filter((i) => i.status === "new").length));
      } else {
        if (hasOrgPermission(permissions, "manage_properties")) PropertyApi.all(token as string).then((r) => r.ok && set("properties", r.data.filter((p) => p.status === "under_review").length));
        if (hasOrgPermission(permissions, "view_inquiries")) PropertyApi.orgInquiries(token as string).then((r) => r.ok && set("inquiries", r.data.filter((i) => i.status === "new").length));
      }
    }
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthReady, token, portal, permissions, pathname]);

  return badges;
}
