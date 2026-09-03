"use client";

import { useAuth } from "@/lib/auth-context";
import { useHasPermission } from "@/lib/admin/hooks";
import { useInvoices } from "@/lib/finance/hooks";
import { getAccountName } from "@/lib/finance/accountLookup";
import { formatMoney } from "@/lib/finance/money";
import { formatDate } from "@/lib/finance/format";
import { FinancePill } from "@/components/finance/ui";
import { PageFrame, Card, RequirePermission, EmptyState } from "@/components/admin/ui";

export default function AdminInvoicesPage() {
  const { account } = useAuth();
  const canView = useHasPermission(account?.id, "finance.view");
  const invoices = useInvoices().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <PageFrame title="Invoices" description="Every invoice issued across the platform.">
      <RequirePermission granted={canView}>
        <Card className="overflow-x-auto">
          {invoices.length === 0 ? (
            <EmptyState title="No invoices" description="Invoices issued by contractors and professionals will appear here." />
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-3">Reference</th>
                  <th className="pb-2 pr-3">Issuer</th>
                  <th className="pb-2 pr-3">Recipient</th>
                  <th className="pb-2 pr-3">Total</th>
                  <th className="pb-2 pr-3">Outstanding</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2.5 pr-3 font-semibold text-slate-800">{inv.reference}</td>
                    <td className="py-2.5 pr-3">{getAccountName(inv.issuerId)}</td>
                    <td className="py-2.5 pr-3">{getAccountName(inv.recipientId)}</td>
                    <td className="py-2.5 pr-3 font-semibold text-slate-900">{formatMoney(inv.total)}</td>
                    <td className="py-2.5 pr-3">{formatMoney(inv.amountOutstanding)}</td>
                    <td className="py-2.5 pr-3"><FinancePill status={inv.status} /></td>
                    <td className="py-2.5 text-xs text-slate-500">{formatDate(inv.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </RequirePermission>
    </PageFrame>
  );
}
