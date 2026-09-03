import { SupportDetailPage } from "@/components/admin/pages/SupportDisputes";

export default async function Page({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return <SupportDetailPage caseId={decodeURIComponent(caseId)} />;
}
