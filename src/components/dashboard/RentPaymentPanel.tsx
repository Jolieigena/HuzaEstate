"use client";

import { useRentSchedules, useRentPayments } from "@/lib/rentPayments/hooks";
import { RentPaymentService } from "@/lib/rentPayments/rentPaymentService";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance/types";
import type { PaymentMethod } from "@/lib/finance/types";
import { formatMoney } from "@/lib/finance/money";
import { formatDate, formatDateTime, PROTOTYPE_TRANSACTION_LABEL } from "@/lib/finance/format";

// The prototype's one fixture tenant identity — matches myProperties.ts's
// default owner and every other dashboard tab, rather than the real logged
// in account id (see the comment in PropertiesTab.tsx for why).
const DEMO_TENANT_ID = "demo-user";

/** Rent schedule + autopay + payment history for a property the current
 *  account rents (ownershipStatus "rented" in myProperties.ts). Renders
 *  nothing if there's no schedule for this property/tenant pair — not every
 *  rented property in the demo data has one seeded. */
export default function RentPaymentPanel({ propertyId }: { propertyId: string }) {
  const schedules = useRentSchedules();
  const payments = useRentPayments();

  const schedule = schedules.find((s) => s.propertyId === propertyId && s.tenantAccountId === DEMO_TENANT_ID);
  if (!schedule) return null;

  const history = payments
    .filter((p) => p.scheduleId === schedule.id)
    .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 mt-4">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Next rent due</div>
          <div className="text-lg font-black text-slate-900">
            {formatMoney(schedule.amount)} <span className="text-sm font-semibold text-slate-500">· {formatDate(schedule.nextDueDate)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => RentPaymentService.payNow(DEMO_TENANT_ID, schedule.id)}
          className="bg-slate-900 hover:bg-[#2ec440] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap"
        >
          Pay now
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-t border-slate-100">
        <div>
          <div className="text-sm font-bold text-slate-900">Autopay</div>
          <div className="text-xs text-slate-500">Automatically pays on the due date each month.</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={schedule.autopayEnabled}
          onClick={() => RentPaymentService.toggleAutopay(DEMO_TENANT_ID, schedule.id)}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${schedule.autopayEnabled ? "bg-[#2ec440]" : "bg-slate-200"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              schedule.autopayEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="py-3 border-t border-slate-100">
        <label className="block text-sm font-bold text-slate-900 mb-2">Payment method</label>
        <select
          value={schedule.method}
          onChange={(e) => RentPaymentService.setMethod(DEMO_TENANT_ID, schedule.id, e.target.value as PaymentMethod)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440]"
        >
          {Object.entries(PAYMENT_METHOD_LABELS)
            .filter(([value]) => value !== "provider_wallet")
            .map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
        </select>
      </div>

      {history.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <div className="text-sm font-bold text-slate-900 mb-2">Payment history</div>
          <div className="flex flex-col gap-2">
            {history.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{formatDateTime(p.paidAt)}</span>
                <span className="font-semibold text-slate-900">{formatMoney(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">{PROTOTYPE_TRANSACTION_LABEL}</p>
    </div>
  );
}
