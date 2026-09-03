import { DisputeDetailPage } from "@/components/admin/pages/SupportDisputes";

export default async function Page({ params }: { params: Promise<{ disputeId: string }> }) {
  const { disputeId } = await params;
  return <DisputeDetailPage disputeId={decodeURIComponent(disputeId)} />;
}
