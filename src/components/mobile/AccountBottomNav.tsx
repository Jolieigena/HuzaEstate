"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { canAccessPath } from "@/lib/navigation";
import { SIDEBAR_NAV_ITEMS } from "@/components/SidebarNavItems";
import BottomNav, { type BottomNavItem } from "./BottomNav";

// The account sections used every day sit on the bar; the rest, and settings, are under More.
const ON_THE_BAR = ["saved", "build", "renovate", "payments"];
const SHORT_LABELS: Record<string, string> = { saved: "Saved", build: "Build", renovate: "Renovate", payments: "Payments" };
const SETTINGS_ICON =
  "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z";

/** The bottom bar for a signed-in buyer in the mobile app, built from the same sections as the account sidebar (and showing only
 *  the ones this account can open), instead of the side menu that is hidden behind a button on a phone. */
export default function AccountBottomNav() {
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  const { account } = useAuth();

  const sections = SIDEBAR_NAV_ITEMS.filter((item) => canAccessPath(account, item.href));
  const toItem = (item: (typeof SIDEBAR_NAV_ITEMS)[number]): BottomNavItem => ({
    key: item.key,
    label: SHORT_LABELS[item.key] ?? item.label,
    iconPath: item.iconPath,
    href: item.href,
    active: item.isActive(pathname, tab),
  });

  const items = sections.filter((item) => ON_THE_BAR.includes(item.key)).map(toItem);
  const more = sections.filter((item) => !ON_THE_BAR.includes(item.key)).map((item) => ({ ...toItem(item), label: item.label }));
  if (canAccessPath(account, "/dashboard")) {
    more.push({ key: "settings", label: "Settings", iconPath: SETTINGS_ICON, href: "/dashboard/settings", active: pathname.startsWith("/dashboard/settings") });
  }

  return <BottomNav label="Account navigation" items={items} more={more} />;
}
