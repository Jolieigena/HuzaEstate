// Mirrors access-service's model.ts orgPermissions exactly — one per org-admin-portal section
// (Overview has no permission, it's always visible). An organization_admin with an
// empty/absent `permissions` array has full access; see hasOrgPermission below and
// access-service's own copy of this rule (auth/service.ts).
export type OrgPermission = "manage_properties" | "manage_professionals" | "manage_staff" | "manage_organisation" | "manage_users" | "view_inquiries" | "view_payments";

export const ORG_PERMISSIONS: { value: OrgPermission; label: string }[] = [
  { value: "manage_properties", label: "Properties" },
  { value: "manage_professionals", label: "Professionals" },
  { value: "manage_staff", label: "Staff" },
  { value: "manage_organisation", label: "Organisation" },
  { value: "manage_users", label: "Users" },
  { value: "view_inquiries", label: "Inquiries" },
  { value: "view_payments", label: "Payments" },
];

export function hasOrgPermission(permissions: string[] | undefined, permission: OrgPermission): boolean {
  return !permissions?.length || permissions.includes(permission);
}
