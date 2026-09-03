import QuotationWorkspace from "@/components/professional/QuotationWorkspace";
export default async function Page({ params }: { params: Promise<{ quotationId: string }> }) { const { quotationId } = await params; return <QuotationWorkspace quotationId={quotationId} />; }
