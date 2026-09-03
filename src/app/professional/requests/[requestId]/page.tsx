import RequestDetail from "@/components/professional/RequestDetail";
export default async function Page({ params }: { params: Promise<{ requestId: string }> }) { const { requestId } = await params; return <RequestDetail requestId={requestId} />; }
