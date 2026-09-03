"use client";

import { useAuth } from "@/lib/auth-context";
import { useHasPermission } from "@/lib/admin/hooks";
import { usePayments, useFundingForAccount, useSettlements, useRefunds, useDisputes, useReconciliation, useFinanceConfig } from "@/lib/finance/hooks";
import { PageFrame, Card, RequirePermission, PrimaryLink } from "@/components/admin/ui";

export default function AdminFinanceOverviewPage() {
  const { account } = useAuth();
  const canView = useHasPermission(account?.id, "finance.view");
  const payments = usePayments();
  const funding = useFundingForAccount();
  const settlements = useSettlements();
  const refunds = useRefunds();
  const disputes = useDisputes();
  const reconciliation = useReconciliation();
  const config = useFinanceConfig();

  const byStatus = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <PageFrame title="Finance" description="Payment volume, funding, settlements, refunds, disputes and reconciliation across HuzaEstate.">
      <RequirePermission granted={canView}>
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Provider mode: <strong>{config.providerMode.toUpperCase()}</strong> · Payments {config.paymentsEnabled ? "enabled" : "disabled"} · Webhook health: {config.webhookHealth}. All data below is demonstration data.
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Successful payments" value={byStatus.successful ?? 0} href="/admin/finance/transactions" />
          <Tile label="Failed payments" value={byStatus.failed ?? 0} href="/admin/finance/transactions" />
          <Tile label="Pending payments" value={(byStatus.pending_provider ?? 0) + (byStatus.processing ?? 0)} href="/admin/finance/transactions" />
          <Tile label="Funded milestones" value={funding.filter((f) => ["provider_confirmed", "protected_by_provider"].includes(f.status)).length} href="/admin/finance/transactions" />
          <Tile label="Releases awaiting action" value={funding.filter((f) => f.status === "release_requested").length} href="/admin/finance/transactions" />
          <Tile label="Refund requests" value={refunds.filter((r) => ["requested", "under_review"].includes(r.status)).length} href="/admin/finance/refunds" />
          <Tile label="Open disputes" value={disputes.filter((d) => ["open", "evidence_pending", "under_review"].includes(d.status)).length} href="/admin/finance/refunds" />
          <Tile label="Failed settlements" value={settlements.filter((s) => s.status === "failed").length} href="/admin/finance/settlements" />
          <Tile label="Unreconciled records" value={reconciliation.filter((r) => r.status !== "matched" && r.status !== "resolved").length} href="/admin/finance/reconciliation" />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <PrimaryLink href="/admin/finance/transactions">Transactions</PrimaryLink>
          <PrimaryLink href="/admin/finance/invoices">Invoices</PrimaryLink>
          <PrimaryLink href="/admin/finance/settlements">Settlements</PrimaryLink>
          <PrimaryLink href="/admin/finance/refunds">Refunds & Disputes</PrimaryLink>
          <PrimaryLink href="/admin/finance/reconciliation">Reconciliation</PrimaryLink>
          <PrimaryLink href="/admin/finance/configuration">Configuration</PrimaryLink>
        </div>
      </RequirePermission>
    </PageFrame>
  );
}

function Tile({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <a href={href}>
      <Card className="transition-shadow hover:shadow-md">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
      </Card>
    </a>
  );
}
