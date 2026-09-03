"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useExecutionProjects } from "@/lib/execution/hooks";
import { useContracts } from "@/lib/finance/hooks";
import { ContractService } from "@/lib/finance/contractService";
import { formatMoney } from "@/lib/finance/money";
import { getAccountName } from "@/lib/finance/accountLookup";
import { PageFrame, Card, FinancePill, EmptyState, PrototypeBanner } from "@/components/finance/ui";

export default function ProfessionalContractsPage() {
  const { account, isAuthReady } = useAuth();
  const { projects } = useExecutionProjects();
  const contracts = useContracts(account?.id);

  const myProjects = useMemo(() => (account ? projects.filter((p) => p.contractorId === account.id) : []), [projects, account]);

  useEffect(() => {
    myProjects.forEach((p) => ContractService.getOrCreateForExecutionProject(p));
  }, [myProjects]);

  if (!isAuthReady || !account) return null;

  return (
    <PageFrame title="Contracts" description="Contracts generated from accepted quotations for your projects — review and acknowledge each version.">
      <div className="mb-6">
        <PrototypeBanner />
      </div>

      {contracts.length === 0 ? (
        <EmptyState title="No contracts yet" description="Once a quotation is accepted for one of your projects, its contract summary appears here." />
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <Link key={c.id} href={`/professional/contracts/${c.id}`} className="block">
              <Card className="transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{c.projectName}</p>
                    <p className="text-xs text-slate-500">With {getAccountName(c.customerId)} · v{c.version}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <FinancePill status={c.status} />
                    <span className="font-black text-slate-900">{formatMoney(c.agreedAmount)}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageFrame>
  );
}
