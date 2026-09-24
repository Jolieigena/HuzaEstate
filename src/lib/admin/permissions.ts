import type { AdminRole, Permission } from "./types";

// Was 8 roles; 6 of them (verification officer, listing moderator, support/dispute officer,
// content manager, auditor, platform analyst) had no matching authorization logic anywhere in
// access-service — a permission scheme this app never actually finished wiring up. Trimmed to
// the 2 that are real, with their permissions folded into operations_admin below so nothing
// that used to be reachable becomes permanently unreachable. Revisit if/when a real
// finer-grained staff permission system is built.
export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Administrator",
  operations_admin: "Operations Administrator",
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: "Manages administrative users, roles and platform-wide settings. Full access to every module.",
  operations_admin: "Handles day-to-day operations: users, professional verification, listing moderation, support cases and disputes, content, reports and audit.",
};

export const ALL_PERMISSIONS: Permission[] = [
  "users.view", "users.manage", "users.suspend",
  "roles.view", "roles.assign",
  "professionals.view", "professionals.verify", "professionals.suspend",
  "listings.view", "listings.moderate",
  "projects.view_metadata", "projects.view_private",
  "reviews.view", "quotations.view",
  "support.manage", "disputes.manage",
  "content.manage",
  "ai.view_usage", "ai.manage_configuration",
  "reports.view", "reports.export",
  "audit.view", "audit.export",
  "settings.manage", "feature_flags.manage",
  "finance.view", "finance.configure", "finance.refunds_review", "finance.reconciliation", "finance.export", "finance.disputes", "finance.privileged_access",
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "users.view": "View users", "users.manage": "Manage user accounts", "users.suspend": "Suspend or restore users",
  "roles.view": "View administrative roles", "roles.assign": "Assign administrative roles",
  "professionals.view": "View professional applications", "professionals.verify": "Approve or reject professional verification", "professionals.suspend": "Suspend professional verification",
  "listings.view": "View property listings", "listings.moderate": "Moderate property listings",
  "projects.view_metadata": "View project metadata", "projects.view_private": "View private project content",
  "reviews.view": "View review requests", "quotations.view": "View quotation requests",
  "support.manage": "Manage support cases", "disputes.manage": "Manage disputes",
  "content.manage": "Manage platform content",
  "ai.view_usage": "View AI usage and governance", "ai.manage_configuration": "Manage AI configuration",
  "reports.view": "View reports", "reports.export": "Export reports",
  "audit.view": "View audit logs", "audit.export": "Export audit data",
  "settings.manage": "Manage platform settings", "feature_flags.manage": "Manage feature flags",
  "finance.view": "View finance dashboard and records", "finance.configure": "Configure payment provider and fees", "finance.refunds_review": "Review and approve refund requests", "finance.reconciliation": "Manage financial reconciliation", "finance.export": "Export financial reports", "finance.disputes": "Manage payment disputes", "finance.privileged_access": "Second-approval for high-value live operations",
};

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  // Everything the 6 removed specialist roles used to cover (professional verification, listing
  // moderation, support/disputes, content, audit export, AI usage view) is folded in here — see
  // the trim note above ADMIN_ROLE_LABELS. Still excludes the most sensitive, platform-wide
  // actions (roles.assign, settings.manage, feature_flags.manage, ai.manage_configuration,
  // finance.privileged_access), which stay super_admin-only.
  operations_admin: [
    "users.view", "users.manage", "users.suspend",
    "professionals.view", "professionals.verify", "professionals.suspend",
    "listings.view", "listings.moderate",
    "projects.view_metadata", "projects.view_private", "reviews.view", "quotations.view",
    "support.manage", "disputes.manage",
    "content.manage",
    "ai.view_usage",
    "reports.view", "reports.export", "audit.view", "audit.export",
    "finance.view", "finance.configure", "finance.refunds_review", "finance.reconciliation", "finance.export", "finance.disputes",
  ],
};

export function hasPermission(role: AdminRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: AdminRole | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}
