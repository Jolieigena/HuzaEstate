"use client";

import { useDisplayCurrency } from "@/lib/currency/display";
import { allowsFullPayment, describePlan, installmentsOf, paymentSchedule } from "@/lib/properties/paymentOptions";
import { totalPriceOf } from "@/lib/properties/price";
import type { Property } from "@/lib/properties/types";

/** On a listing for sale: how the seller lets the buyer pay, with the amounts of each installment in the buyer's currency. */
export default function PaymentOptionsInfo({ property }: { property: Property }) {
  const money = useDisplayCurrency();
  if (property.type !== "sale" || !property.paymentOptions) return null;
  const plan = installmentsOf(property);
  const full = allowsFullPayment(property);
  if (!plan && !full) return null;
  const schedule = plan ? paymentSchedule(totalPriceOf(property), plan) : [];

  return (
    <section className="mb-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <h2 className="mb-4 text-xl font-bold text-slate-900">Payment options</h2>
      <div className="space-y-4">
        {full && (
          <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3">
            <span className="font-bold text-slate-900">Buy in full</span>
            <span className="font-semibold text-slate-700">{money.format(totalPriceOf(property), property.currency)}</span>
          </div>
        )}
        {plan && (
          <div className="rounded-xl bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="font-bold text-slate-900">Buy in installments</span>
              <span className="text-sm font-semibold text-slate-500">{describePlan(plan)}</span>
            </div>
            <ul className="mt-3 divide-y divide-slate-100">
              {schedule.map((payment, index) => (
                <li key={index} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="font-medium text-slate-600">{payment.when}{index === 0 ? ` (${plan.firstPercent}%)` : ""}</span>
                  <span className="font-bold text-slate-900">{money.format(payment.amount, property.currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
