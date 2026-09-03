"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useContracts, useInvoices } from "@/lib/finance/hooks";
import { InvoiceService } from "@/lib/finance/invoiceService";
import { canIssueInvoice } from "@/lib/finance/permissions";
import { formatMoney } from "@/lib/finance/money";
import { formatDate } from "@/lib/finance/format";
import { getAccountName } from "@/lib/finance/accountLookup";
import type { PartyRole } from "@/lib/finance/types";
import { useToast } from "@/lib/toast-context";
import CreateInvoiceModal, { type InvoiceTargetOption } from "@/components/finance/modals/CreateInvoiceModal";
import { PageFrame, Card, FinancePill, EmptyState, PrimaryButton, AccessDeniedNote, fieldClass } from "@/components/finance/ui";

export default function ProfessionalInvoicesPage() {
  const { account, isAuthReady } = useAuth();
  const router = useRouter();
  const invoices = useInvoices(account?.id);
  const contracts = useContracts(account?.id);
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const { showToast } = useToast();

  const issuedInvoices = invoices.filter((i) => i.issuerId === account?.id).filter((i) => statusFilter === "all" || i.status === statusFilter).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const targetOptions: InvoiceTargetOption[] = useMemo(() => {
    if (!account) return [];
    const options: InvoiceTargetOption[] = [];
    contracts.forEach((c) => {
      c.milestones.forEach((m) => {
        options.push({ key: `${c.id}:${m.milestoneId}`, label: `${c.projectName} — ${m.title}`, recipientId: c.customerId, currency: c.agreedAmount.currency, executionProjectId: c.executionProjectId, contractId: c.id, milestoneId: m.milestoneId });
      });
    });
    return options;
  }, [contracts, account]);

  if (!isAuthReady || !account) return null;
  if (!canIssueInvoice(account.id, account.roles)) {
    return (
      <PageFrame title="Invoices" description="">
        <AccessDeniedNote>Only professional or contractor accounts can issue invoices.</AccessDeniedNote>
      </PageFrame>
    );
  }

  const role: PartyRole = account.roles.includes("contractor") ? "contractor" : "professional";

  return (
    <PageFrame title="Invoices" description="Create and track invoices for milestones, professional services and change orders." action={<PrimaryButton onClick={() => setCreateOpen(true)}>Create Invoice</PrimaryButton>}>
      <Card className="mb-6">
        <label className="sr-only" htmlFor="pro-invoice-status">Filter by status</label>
        <select id="pro-invoice-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${fieldClass} w-auto`}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
          <option value="viewed">Viewed</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </Card>

      {issuedInvoices.length === 0 ? (
        <EmptyState title="No invoices yet" description="Create your first invoice for a milestone or a professional service." />
      ) : (
        <div className="space-y-3">
          {issuedInvoices.map((inv) => (
            <Link key={inv.id} href={`/professional/invoices/${inv.id}`} className="block">
              <Card className="transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{inv.reference}</p>
                    <p className="text-xs text-slate-500">
                      To {getAccountName(inv.recipientId)} · Due {formatDate(inv.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <FinancePill status={inv.status} />
                    <span className="font-black text-slate-900">{formatMoney(inv.total)}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateInvoiceModal
        open={createOpen}
        currency="RWF"
        contextLabel="Draft invoices are private until you issue them."
        targetOptions={targetOptions}
        onClose={() => setCreateOpen(false)}
        onCreate={async ({ invoiceType, dueDate, notes, lineItems, target }) => {
          const currency = target?.currency ?? "RWF";
          const created = InvoiceService.createDraft({
            issuerId: account.id,
            issuerRole: role,
            recipientId: target?.recipientId ?? account.id,
            executionProjectId: target?.executionProjectId,
            contractId: target?.contractId,
            milestoneId: target?.milestoneId,
            invoiceType,
            dueDate,
            currency,
            notes,
            lineItems: lineItems.map((l) => ({ description: l.description, quantity: l.quantity, unit: l.unit, unitPrice: { amountMinor: l.unitPriceMajor * (currency === "USD" ? 100 : 1), currency } })),
          });
          setCreateOpen(false);
          showToast("Draft invoice created — issue it from the invoice page when ready.", "success");
          router.push(`/professional/invoices/${created.id}`);
        }}
      />
    </PageFrame>
  );
}
