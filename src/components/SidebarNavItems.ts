export interface SidebarNavItem {
  key: string;
  label: string;
  href: string;
  iconPath: string;
  isActive: (pathname: string, tab: string | null) => boolean;
}

/**
 * Mirrors the account sections that used to live in the dashboard's own
 * page-local sidebar, plus Build Projects — now surfaced globally so they're
 * reachable from anywhere once logged in, not just from /dashboard itself.
 */
export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  {
    key: "saved",
    label: "Saved Homes",
    href: "/dashboard?tab=saved",
    iconPath: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    isActive: (pathname, tab) => pathname === "/dashboard" && (tab ?? "saved") === "saved",
  },
  {
    key: "properties",
    label: "My Properties",
    href: "/dashboard?tab=properties",
    iconPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    isActive: (pathname, tab) => pathname === "/dashboard" && tab === "properties",
  },
  {
    key: "build",
    label: "Build Projects",
    href: "/studio/build",
    iconPath: "M3 9.5L12 3l9 6.5M4.5 10.5V20a1 1 0 001 1h4.75v-6.5h3.5V21H19.5a1 1 0 001-1v-9.5",
    isActive: (pathname) => pathname.startsWith("/studio/build"),
  },
  {
    key: "renovate",
    label: "Renovation Projects",
    href: "/studio/renovate",
    iconPath: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z",
    isActive: (pathname) => pathname.startsWith("/studio/renovate"),
  },
  {
    key: "execution",
    label: "Execution Tracking",
    href: "/execution",
    iconPath: "M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l5.654-4.654M15.17 11.42L18.2 8.924a2.652 2.652 0 00-3.75-3.75l-2.496 3.03M15.17 11.42l-3.03 2.496",
    isActive: (pathname) => pathname.startsWith("/execution"),
  },
  {
    key: "professional",
    label: "Professional Workspace",
    href: "/professional",
    iconPath: "M9 12h6m-3-3v6m7-10H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2zm-4 0V3H9v2",
    isActive: (pathname) => pathname.startsWith("/professional"),
  },
  {
    key: "payments",
    label: "Payments",
    href: "/payments",
    iconPath: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    isActive: (pathname) => pathname.startsWith("/payments"),
  },
  {
    key: "invoices",
    label: "Invoices",
    href: "/invoices",
    iconPath: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M9 3H4.6c-.56 0-.84 0-1.054.109a1 1 0 00-.437.437C3 3.76 3 4.04 3 4.6v14.8c0 .56 0 .84.109 1.054a1 1 0 00.437.437C3.76 21 4.04 21 4.6 21h14.8c.56 0 .84 0 1.054-.109a1 1 0 00.437-.437C21 20.24 21 19.96 21 19.4V9l-6-6H9z",
    isActive: (pathname) => pathname.startsWith("/invoices"),
  },
  {
    key: "contracts",
    label: "Contracts",
    href: "/contracts",
    iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    isActive: (pathname) => pathname.startsWith("/contracts"),
  },
  {
    key: "tours",
    label: "My Tours",
    href: "/dashboard?tab=tours",
    iconPath: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    isActive: (pathname, tab) => pathname === "/dashboard" && tab === "tours",
  },
  {
    key: "applications",
    label: "Rental Applications",
    href: "/dashboard?tab=applications",
    iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    isActive: (pathname, tab) => pathname === "/dashboard" && tab === "applications",
  },
  {
    key: "coshopping",
    label: "Co-shopping",
    href: "/dashboard?tab=coshopping",
    iconPath: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    isActive: (pathname, tab) => pathname === "/dashboard" && tab === "coshopping",
  },
];
