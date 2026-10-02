import type { OrgPermission } from "@/lib/orgPermissions";

export interface OrgAdminNavItem {
  key: string;
  label: string;
  href: string;
  iconPath: string;
  /** Absent for Overview — always shown, it's just read-only counts. Every other item is
   *  filtered out of the sidebar for a staff member who lacks it — see OrgAdminSidebar.tsx. */
  permission?: OrgPermission;
}

export const ORG_ADMIN_NAV_ITEMS: OrgAdminNavItem[] = [
  { key: "overview", label: "Overview", href: "/org-admin", iconPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { key: "properties", label: "Properties", href: "/org-admin/properties", iconPath: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", permission: "manage_properties" },
  { key: "inquiries", label: "Inquiries", href: "/org-admin/inquiries", iconPath: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", permission: "view_inquiries" },
  { key: "users", label: "Users", href: "/org-admin/users", iconPath: "M5.121 17.804A9 9 0 1118.879 6.196 9 9 0 015.12 17.804zM15 10a3 3 0 11-6 0 3 3 0 016 0z", permission: "manage_users" },
  { key: "professionals", label: "Professionals", href: "/org-admin/professionals", iconPath: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", permission: "manage_professionals" },
  { key: "staff", label: "Staff", href: "/org-admin/staff", iconPath: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3.13a4 4 0 10-4-4 4 4 0 004 4zm6 3a4 4 0 10-4-4", permission: "manage_staff" },
  { key: "organisation", label: "Organisation", href: "/org-admin/organisation", iconPath: "M20 7h-3V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2H4a1 1 0 00-1 1v11a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1zM9 5h6v2H9V5z", permission: "manage_organisation" },
  { key: "payments", label: "Payments", href: "/org-admin/payments", iconPath: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", permission: "view_payments" },
];
