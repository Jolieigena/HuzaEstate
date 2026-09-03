import type { AdminRole, Permission } from "./types";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Administrator",
  operations_admin: "Operations Administrator",
  verification_officer: "Professional Verification Officer",
  listing_moderator: "Listing Moderator",
  support_dispute_officer: "Support and Dispute Officer",
  content_manager: "Content Manager",
  auditor: "Auditor",
  platform_analyst: "Platform Analyst",
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: "Manages administrative users, roles and platform-wide settings. Full access to every module.",
  operations_admin: "Monitors users, projects and requests, and manages support cases and operational reports.",
  verification_officer: "Reviews professional applications and verification documents, and approves, rejects or suspends verification.",
  listing_moderator: "Reviews submitted property listings, handles reported listings, and approves or rejects them.",
  support_dispute_officer: "Manages support tickets and customer-professional disputes, and recommends account restrictions.",
  content_manager: "Manages public FAQs, examples, demo-video metadata and announcements. No private project access by default.",
  auditor: "Views audit logs, status histories and reports. Cannot modify operational data.",
  platform_analyst: "Views aggregated dashboards, reports and anonymised AI usage. No unnecessary private data access.",
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
  operations_admin: [
    "users.view", "users.manage", "users.suspend",
    "professionals.view", "listings.view",
    "projects.view_metadata", "reviews.view", "quotations.view",
    "support.manage", "disputes.manage",
    "reports.view", "reports.export", "audit.view",
    "finance.view", "finance.configure", "finance.refunds_review", "finance.reconciliation", "finance.export",
  ],
  verification_officer: ["professionals.view", "professionals.verify", "professionals.suspend", "users.view", "audit.view"],
  listing_moderator: ["listings.view", "listings.moderate", "users.view", "audit.view"],
  support_dispute_officer: ["support.manage", "disputes.manage", "users.view", "projects.view_metadata", "projects.view_private", "reviews.view", "quotations.view", "audit.view", "finance.view", "finance.disputes"],
  content_manager: ["content.manage", "reports.view"],
  auditor: ["audit.view", "audit.export", "reports.view", "users.view", "professionals.view", "listings.view", "projects.view_metadata", "finance.view", "finance.export"],
  platform_analyst: ["reports.view", "reports.export", "ai.view_usage"],
};

export function hasPermission(role: AdminRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: AdminRole | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}
