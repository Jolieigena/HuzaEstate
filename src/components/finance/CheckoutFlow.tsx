"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentService, PaymentNotAllowedError } from "@/lib/finance/paymentService";
import { usePayment, useFinanceConfig } from "@/lib/finance/hooks";
import { formatMoney } from "@/lib/finance/money";
import { PAYMENT_METHOD_LABELS, type Invoice, type PaymentFeeBreakdown, type PaymentMethod } from "@/lib/finance/types";
import { ProviderUnavailableError } from "@/lib/finance/provider";
import { useToast } from "@/lib/toast-context";
import FeeBreakdown from "./FeeBreakdown";
import { Card, PrimaryButton, SecondaryButton, PrototypeBanner, fieldClass, labelClass } from "./ui";

type Step = "review" | "method" | "handoff" | "result";

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "•••• ••••";
  return `•••• •• ${digits.slice(-3)}`;
}

export default function CheckoutFlow({ invoice, payerId, onClose }: { invoice: Invoice; payerId: string; onClose: () => void }) {
  const { showToast } = useToast();
  const router = useRouter();
  const config = useFinanceConfig();
  const [step, setStep] = useState<Step>("review");
  const [fees, setFees] = useState<PaymentFeeBreakdown | null>(null);
  const [loadingFees, setLoadingFees] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>("mobile_money");
  const [phone, setPhone] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const payment = usePayment(paymentId ?? undefined);

  // Effect only reacts to the invoice id changing (not every store update
  // that produces a new invoice object reference), and never sets state
  // synchronously in the body — loadingFees starts true and only flips via
  // the async callbacks below.
  useEffect(() => {
    let cancelled = false;
    PaymentService.calculateFees(invoice)
      .then((res) => {
        if (!cancelled) setFees(res.breakdown);
      })
      .catch(() => {
        if (!cancelled) setError("Could not verify the payment amount with the server. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoadingFees(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice.id]);

  const isTerminal = payment ? (["successful", "failed", "expired", "cancelled"] as string[]).includes(payment.status) : false;
  const effectiveStep: Step = isTerminal ? "result" : step;
  const availableMethods = config.supportedMethods;

  async function handleStartPayment() {
    setBusy(true);
    setError(null);
    try {
      const created = await PaymentService.startPayment(invoice, payerId, method, method === "mobile_money" ? maskPhone(phone) : undefined);
      setPaymentId(created.id);
      setStep("handoff");
    } catch (e) {
      if (e instanceof ProviderUnavailableError) setError(e.message);
      else if (e instanceof PaymentNotAllowedError) setError(e.message);
      else setError("Something went wrong starting this payment. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSimulate(outcome: "success" | "failure" | "expired" | "cancelled") {
    if (!paymentId) return;
    setBusy(true);
    try {
      await PaymentService.simulateOutcome(paymentId, outcome);
      showToast(outcome === "success" ? "Demonstration payment successful." : `Demonstration payment ${outcome}.`, outcome === "success" ? "success" : "info");
    } catch {
      showToast("Could not process the simulated provider event.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelPending() {
    if (!paymentId) return;
    setBusy(true);
    PaymentService.cancelPending(paymentId, payerId);
    setBusy(false);
  }

  return (
    <Card className="border-2 border-slate-900/5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900">Pay invoice {invoice.reference}</h3>
        <button onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-slate-800" aria-label="Close checkout">
          Cancel
        </button>
      </div>

      <ol className="mb-5 flex flex-wrap gap-2 text-xs font-bold text-slate-400" aria-label="Checkout steps">
        {(["review", "method", "handoff", "result"] as Step[]).map((s, i) => (
          <li key={s} className={`rounded-full px-3 py-1 ${effectiveStep === s ? "bg-slate-900 text-white" : "bg-slate-100"}`}>
            {i + 1}. {s === "review" ? "Review" : s === "method" ? "Method" : s === "handoff" ? "Provider" : "Result"}
          </li>
        ))}
      </ol>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {effectiveStep === "review" && (
        <div className="space-y-4">
          <PrototypeBanner compact />
          {loadingFees ? (
            <p className="text-sm text-slate-500">Calculating fees…</p>
          ) : fees ? (
            <>
              <FeeBreakdown fees={fees} expectedRecipientLabel="Contractor/professional receives" />
              <p className="text-xs text-slate-500">Refunds are reviewed by finance staff and are never marked complete until the provider confirms them. Funded milestones follow the release process before payout.</p>
              <div className="flex justify-end gap-3">
                <SecondaryButton onClick={onClose}>Leave checkout</SecondaryButton>
                <PrimaryButton onClick={() => setStep("method")}>Continue</PrimaryButton>
              </div>
            </>
          ) : null}
        </div>
      )}

      {effectiveStep === "method" && (
        <div className="space-y-4">
          <fieldset>
            <legend className={labelClass}>Payment method</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {availableMethods.map((m) => (
                <label key={m} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold ${method === m ? "border-[#2ec440] bg-[#2ec440]/5 text-[#219b31]" : "border-slate-200 text-slate-700"}`}>
                  <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="accent-[#2ec440]" />
                  {PAYMENT_METHOD_LABELS[m]}
                </label>
              ))}
            </div>
          </fieldset>

          {method === "mobile_money" && (
            <div>
              <label htmlFor="momo-phone" className={labelClass}>
                Mobile money phone number
              </label>
              <input id="momo-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 078 000 0000" className={fieldClass} />
              <p className="mt-1.5 text-xs text-slate-500">You will approve this payment in your mobile money app. HuzaEstate never asks for your PIN or a one-time code.</p>
            </div>
          )}
          {method === "card" && <p className="text-sm text-slate-500">You will be redirected to a provider-hosted, secure card checkout. HuzaEstate never receives or stores your full card number, expiry or CVV.</p>}
          {method === "bank_transfer" && <p className="text-sm text-slate-500">You will receive a unique bank-transfer reference and provider beneficiary details on the next step.</p>}

          <div className="flex justify-end gap-3">
            <SecondaryButton onClick={() => setStep("review")}>Back</SecondaryButton>
            <PrimaryButton onClick={handleStartPayment} disabled={busy || (method === "mobile_money" && phone.trim().length < 6)}>
              {busy ? "Starting…" : "Start Payment"}
            </PrimaryButton>
          </div>
        </div>
      )}

      {effectiveStep === "handoff" && payment && (
        <div className="space-y-4">
          <PrototypeBanner compact />
          <div role="status" aria-live="polite" className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">Demonstration Payment — {PAYMENT_METHOD_LABELS[payment.method]}</p>
            {payment.method === "mobile_money" && <p className="mt-1 text-sm text-slate-600">Approve the request sent to {payment.maskedPayerDetail} in your mobile money app.</p>}
            {payment.method === "bank_transfer" && <p className="mt-1 text-sm text-slate-600">Reference: {payment.maskedPayerDetail}. Transfer {formatMoney(payment.amount)} and it will reconcile automatically once confirmed.</p>}
            {payment.method === "card" && <p className="mt-1 text-sm text-slate-600">Provider-hosted checkout session created. Complete payment in the secure provider window.</p>}
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Status: <span className="text-slate-700">{payment.status.replace(/_/g, " ")}</span>
            </p>
          </div>

          {config.providerMode === "mock" && (
            <div className="rounded-xl border border-dashed border-slate-300 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Mock mode — simulate the provider response</p>
              <div className="flex flex-wrap gap-2">
                <SecondaryButton onClick={() => handleSimulate("success")} disabled={busy}>
                  Simulate Success
                </SecondaryButton>
                <SecondaryButton onClick={() => handleSimulate("failure")} disabled={busy}>
                  Simulate Failure
                </SecondaryButton>
                <SecondaryButton onClick={() => handleSimulate("expired")} disabled={busy}>
                  Simulate Expiry
                </SecondaryButton>
                <SecondaryButton onClick={handleCancelPending} disabled={busy}>
                  Cancel Payment
                </SecondaryButton>
              </div>
            </div>
          )}
        </div>
      )}

      {effectiveStep === "result" && payment && (
        <div className="space-y-4">
          <div role="status" aria-live="polite" className={`rounded-2xl border p-5 text-center ${payment.status === "successful" ? "border-[#2ec440]/30 bg-[#2ec440]/5" : "border-red-200 bg-red-50"}`}>
            <p className={`text-lg font-black ${payment.status === "successful" ? "text-[#219b31]" : "text-red-700"}`}>
              {payment.status === "successful" ? "Payment successful" : payment.status === "failed" ? "Payment failed" : payment.status === "expired" ? "Payment expired" : "Payment cancelled"}
            </p>
            <p className="mt-1 text-sm text-slate-600">{formatMoney(payment.amount)} · {PAYMENT_METHOD_LABELS[payment.method]}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            {payment.status !== "successful" && (
              <SecondaryButton
                onClick={async () => {
                  setBusy(true);
                  const retried = await PaymentService.retry(paymentId!);
                  setBusy(false);
                  if (retried) setStep("handoff");
                }}
                disabled={busy}
              >
                Retry Payment
              </SecondaryButton>
            )}
            <PrimaryButton onClick={() => router.push(`/payments/${paymentId}`)}>View Receipt</PrimaryButton>
            <SecondaryButton onClick={onClose}>Done</SecondaryButton>
          </div>
        </div>
      )}
    </Card>
  );
}
