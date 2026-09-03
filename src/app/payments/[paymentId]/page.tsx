"use client";

import { use, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePayment, useInvoice } from "@/lib/finance/hooks";
import { RefundService } from "@/lib/finance/refundService";
import { DisputeService } from "@/lib/finance/disputeService";
import { canRequestRefund, canOpenPaymentDispute } from "@/lib/finance/permissions";
import { getAccountName } from "@/lib/finance/accountLookup";
import { ExecutionProjectService } from "@/lib/execution/executionService";
import { useToast } from "@/lib/toast-context";
import ReceiptView from "@/components/finance/ReceiptView";
import RefundRequestModal from "@/components/finance/modals/RefundRequestModal";
import DisputeModal from "@/components/finance/modals/DisputeModal";
import { PageFrame, Card, EmptyState, SecondaryButton } from "@/components/finance/ui";

export default function PaymentDetailPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = use(params);
  const { account, isAuthReady } = useAuth();
  const payment = usePayment(paymentId);
  const invoice = useInvoice(payment?.invoiceId);
  const [refundOpen, setRefundOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const { showToast } = useToast();

  if (!isAuthReady || !account) return null;

  if (!payment || !invoice) {
    return (
      <PageFrame title="Payment" description="">
        <EmptyState title="Payment not found" description="This payment doesn't exist, or the link may be out of date." />
      </PageFrame>
    );
  }

  if (payment.payerId !== account.id && payment.recipientId !== account.id) {
    return (
      <PageFrame title="Payment" description="">
        <EmptyState title="Access denied" description="You don't have access to this payment." />
      </PageFrame>
    );
  }

  const project = payment.executionProjectId ? ExecutionProjectService.getById(payment.executionProjectId) : undefined;

  return (
    <PageFrame title={`Payment ${payment.providerReference ?? payment.id}`} description="Status, provider reference and receipt for this payment.">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <ReceiptView payment={payment} invoice={invoice} payerName={getAccountName(payment.payerId)} recipientName={getAccountName(payment.recipientId)} projectName={project?.name} />
        <div className="space-y-4 print:hidden">
          <Card>
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Actions</h3>
            <div className="flex flex-col gap-2">
              {canRequestRefund(account.id, payment) && (
                <SecondaryButton onClick={() => setRefundOpen(true)}>Request Refund</SecondaryButton>
              )}
              {canOpenPaymentDispute(account.id, payment) && (
                <SecondaryButton onClick={() => setDisputeOpen(true)}>Open Dispute</SecondaryButton>
              )}
              <SecondaryButton onClick={() => window.print()}>Print / Download Receipt</SecondaryButton>
            </div>
          </Card>
        </div>
      </div>

      <RefundRequestModal
        payment={payment}
        maxRefundable={RefundService.maxRefundable(payment)}
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        onConfirm={async (reason, amount, note) => {
          RefundService.request(payment, account.id, reason, amount, note);
          showToast("Refund requested — finance staff will review it.", "success");
        }}
      />
      <DisputeModal
        open={disputeOpen}
        contextLabel={`Payment for invoice ${invoice.reference}`}
        onClose={() => setDisputeOpen(false)}
        onConfirm={async (category, description) => {
          DisputeService.open({ openedBy: account.id, category, description, paymentId: payment.id, invoiceId: invoice.id });
          showToast("Dispute opened. The other party has been notified.", "info");
        }}
      />
    </PageFrame>
  );
}
