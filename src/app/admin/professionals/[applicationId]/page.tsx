import { ProfessionalDetailPage } from "@/components/admin/pages/Professionals";

export default async function Page({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  return <ProfessionalDetailPage applicationId={decodeURIComponent(applicationId)} />;
}
