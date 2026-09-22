"use client";

import { useState } from "react";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/finance/types";
import { formatMoney } from "@/lib/finance/money";
import { PLAN_LABELS, PLAN_PRICES, PER_POST_PRICE, type PlanTier } from "@/lib/postingPlans/types";
import { PostingPlanService } from "@/lib/postingPlans/postingPlanService";
import { Card, PrimaryButton, SecondaryButton, PrototypeBanner, fieldClass, labelClass } from "@/components/finance/ui";

type Mode = { kind: "subscribe"; tier: Exclude<PlanTier, "free"> } | { kind: "per_post" };
type Step = "method" | "result";

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "•••• ••••";
  return `•••• •• ${digits.slice(-3)}`;
}

/** A deliberately smaller sibling of finance/CheckoutFlow.tsx — that
 *  component is wired into the construction-contract Invoice/PaymentService
 *  machinery (milestone funding, escrow release), which a flat-fee posting
 *  plan purchase has no real relationship to. This reuses its UX pattern
 *  (method choice, masked phone, mock "simulate" step) and its formatting
 *  primitives without inventing a fake Invoice for something that isn't one. */
export default function PlanCheckout({ accountId, mode, onDone, onClose }: { accountId: string; mode: Mode; onDone: () => void; onClose: () => void }) {
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<PaymentMethod>("mobile_money");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const amount = mode.kind === "subscribe" ? PLAN_PRICES[mode.tier] : PER_POST_PRICE;
  const title = mode.kind === "subscribe" ? `Subscribe to ${PLAN_LABELS[mode.tier]}` : "Pay for one extra post";

  function handleSimulate() {
    setBusy(true);
    setTimeout(() => {
      if (mode.kind === "subscribe") PostingPlanService.subscribe(accountId, mode.tier);
      else PostingPlanService.buyExtraPost(accountId);
      setBusy(false);
      setStep("result");
    }, 500);
  }

  return (
    <Card className="border-2 border-slate-900/5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
        <button onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-slate-800" aria-label="Close checkout">
          {step === "result" ? "Done" : "Cancel"}
        </button>
      </div>

      {step === "method" && (
        <div className="space-y-4">
          <PrototypeBanner compact />
          <p className="text-2xl font-black text-slate-900">{formatMoney(amount)}</p>

          <fieldset>
            <legend className={labelClass}>Payment method</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {(["mobile_money", "card", "bank_transfer"] as PaymentMethod[]).map((m) => (
                <label key={m} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold ${method === m ? "border-[#2ec440] bg-[#2ec440]/5 text-[#219b31]" : "border-slate-200 text-slate-700"}`}>
                  <input type="radio" name="plan-method" value={m} checked={method === m} onChange={() => setMethod(m)} className="accent-[#2ec440]" />
                  {PAYMENT_METHOD_LABELS[m]}
                </label>
              ))}
            </div>
          </fieldset>

          {method === "mobile_money" && (
            <div>
              <label htmlFor="plan-phone" className={labelClass}>Mobile money phone number</label>
              <input id="plan-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 078 000 0000" className={fieldClass} />
              <p className="mt-1.5 text-xs text-slate-500">Masked as {maskPhone(phone)} — HuzaEstate never asks for your PIN or a one-time code.</p>
            </div>
          )}
          {method === "card" && <p className="text-sm text-slate-500">You would be redirected to a provider-hosted, secure card checkout.</p>}
          {method === "bank_transfer" && <p className="text-sm text-slate-500">You would receive a unique bank-transfer reference on the next step.</p>}

          <div className="flex justify-end gap-3">
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSimulate} disabled={busy || (method === "mobile_money" && phone.trim().length < 6)}>
              {busy ? "Processing…" : "Simulate Payment"}
            </PrimaryButton>
          </div>
        </div>
      )}

      {step === "result" && (
        <div className="space-y-4">
          <div role="status" aria-live="polite" className="rounded-2xl border border-[#2ec440]/30 bg-[#2ec440]/5 p-5 text-center">
            <p className="text-lg font-black text-[#219b31]">Payment successful</p>
            <p className="mt-1 text-sm text-slate-600">
              {formatMoney(amount)} · {PAYMENT_METHOD_LABELS[method]}
            </p>
          </div>
          <div className="flex justify-end">
            <PrimaryButton onClick={onDone}>Continue</PrimaryButton>
          </div>
        </div>
      )}
    </Card>
  );
}
