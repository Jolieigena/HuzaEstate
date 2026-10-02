import { OrganizationDetailPage } from "@/components/admin/pages/Organizations";

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  return <OrganizationDetailPage organizationId={decodeURIComponent(organizationId)} />;
}
