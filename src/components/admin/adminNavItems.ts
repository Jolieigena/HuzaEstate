import type { Permission } from "@/lib/admin/types";

export interface AdminNavItem {
  key: string;
  label: string;
  href: string;
  iconPath: string;
  permission?: Permission;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { key: "overview", label: "Overview", href: "/admin", iconPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { key: "users", label: "Users", href: "/admin/users", iconPath: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3.13a4 4 0 10-4-4 4 4 0 004 4zm6 3a4 4 0 10-4-4", permission: "users.view" },
  { key: "roles", label: "Roles and Permissions", href: "/admin/roles", iconPath: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", permission: "roles.view" },
  { key: "professionals", label: "Professionals", href: "/admin/professionals", iconPath: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", permission: "professionals.view" },
  { key: "listings", label: "Property Listings", href: "/admin/listings", iconPath: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6", permission: "listings.view" },
  { key: "projects", label: "Projects", href: "/admin/projects", iconPath: "M9 3v2m6-2v2M5 7h14M5 7a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2M5 7h14", permission: "projects.view_metadata" },
  { key: "requests", label: "Requests", href: "/admin/requests", iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", permission: "reviews.view" },
  { key: "quotations", label: "Quotations", href: "/admin/quotations", iconPath: "M9 14l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", permission: "quotations.view" },
  { key: "finance", label: "Finance", href: "/admin/finance", iconPath: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", permission: "finance.view" },
  { key: "support", label: "Support", href: "/admin/support", iconPath: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M5.636 5.636l3.172 3.172m0 5.656l-3.172 3.172M12 15a3 3 0 100-6 3 3 0 000 6z", permission: "support.manage" },
  { key: "disputes", label: "Disputes", href: "/admin/disputes", iconPath: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z", permission: "disputes.manage" },
  { key: "ai", label: "AI Operations", href: "/admin/ai", iconPath: "M13 10V3L4 14h7v7l9-11h-7z", permission: "ai.view_usage" },
  { key: "content", label: "Content", href: "/admin/content", iconPath: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v10a2 2 0 01-2 2z", permission: "content.manage" },
  { key: "reports", label: "Reports", href: "/admin/reports", iconPath: "M9 19V6l7 7h-7zm-6 1h18V3H3v17z", permission: "reports.view" },
  { key: "audit", label: "Audit Logs", href: "/admin/audit", iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", permission: "audit.view" },
  { key: "settings", label: "Settings", href: "/admin/settings", iconPath: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z", permission: "settings.manage" },
];
