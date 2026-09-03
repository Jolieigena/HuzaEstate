import { ListingDetailPage } from "@/components/admin/pages/Listings";

export default async function Page({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  return <ListingDetailPage listingId={decodeURIComponent(listingId)} />;
}
