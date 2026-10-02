import OrgAdminShell from "@/components/org-admin/OrgAdminShell";

export default function OrgAdminLayout({ children }: { children: React.ReactNode }) {
  return <OrgAdminShell>{children}</OrgAdminShell>;
}
