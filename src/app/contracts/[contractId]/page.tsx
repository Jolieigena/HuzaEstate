"use client";

import { use } from "react";
import ContractDetailView from "@/components/finance/ContractDetailView";

export default function ContractDetailPage({ params }: { params: Promise<{ contractId: string }> }) {
  const { contractId } = use(params);
  return <ContractDetailView contractId={contractId} />;
}
