import { formatMoney } from "@/lib/finance/money";
import type { PaymentFeeBreakdown } from "@/lib/finance/types";

/** Phase 19 disclosure block — every fee shown before confirmation, never hidden inside a single total. */
export default function FeeBreakdown({ fees, expectedRecipientLabel = "Recipient receives" }: { fees: PaymentFeeBreakdown; expectedRecipientLabel?: string }) {
  return (
    <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
      <Row label="Service amount" value={formatMoney(fees.serviceAmount)} />
      <Row label="Platform fee" value={formatMoney(fees.platformFee)} />
      <Row label="Provider fee (estimated)" value={formatMoney(fees.providerFee)} hint="Actual provider fee is confirmed once a licensed provider is configured." />
      <Row label="Taxes" value={formatMoney(fees.taxes)} />
      <Row label="Total customer charge" value={formatMoney(fees.totalCharge)} bold />
      <Row label={expectedRecipientLabel} value={formatMoney(fees.expectedRecipientAmount)} hint="Estimated — subject to final provider and settlement fees." />
    </dl>
  );
}

function Row({ label, value, hint, bold }: { label: string; value: string; hint?: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0">
      <div>
        <dt className={`text-slate-500 ${bold ? "font-bold text-slate-700" : ""}`}>{label}</dt>
        {hint && <p className="mt-0.5 max-w-xs text-xs text-slate-400">{hint}</p>}
      </div>
      <dd className={`whitespace-nowrap text-right ${bold ? "text-base font-black text-slate-900" : "font-semibold text-slate-800"}`}>{value}</dd>
    </div>
  );
}
