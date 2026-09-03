import { UserDetailPage } from "@/components/admin/pages/Users";

export default async function Page({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <UserDetailPage userId={decodeURIComponent(userId)} />;
}
