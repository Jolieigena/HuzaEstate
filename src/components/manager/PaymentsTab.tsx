"use client";

import { useState } from "react";
import { useRentSchedules, useRentPayments } from "@/lib/rentPayments/hooks";
import { RentPaymentService } from "@/lib/rentPayments/rentPaymentService";
import { formatMoney, sumMoney, zeroMoney } from "@/lib/finance/money";
import { formatDate, formatDateTime, PROTOTYPE_TRANSACTION_LABEL } from "@/lib/finance/format";
import BarBreakdown from "@/components/charts/BarBreakdown";
import { SERIES_COLOR } from "@/components/charts/styles";

// Same fixture landlord identity as LandlordProfileTab.tsx — Manager Portal
// has no per-seller ownership model, so there's one landlord, not the real
// logged-in account id.
const DEMO_LANDLORD_ID = "seller-user";

/** Real rent-collection ledger for the current landlord — replaces the
 *  previous hardcoded $4,700/$1,200 figures with src/lib/rentPayments data,
 *  the same store the customer Dashboard's rent panel writes to. */
export default function PaymentsTab() {
  useRentSchedules();
  useRentPayments();
  const [reminded, setReminded] = useState<Set<string>>(new Set());

  const { schedules, payments } = RentPaymentService.getPayoutsForLandlord(DEMO_LANDLORD_ID);
  const currency = schedules[0]?.amount.currency ?? "USD";

  const successfulPayments = payments.filter((p) => p.status === "successful");
  const collected = sumMoney(successfulPayments.map((p) => p.landlordPayout), currency);

  const today = new Date().toISOString().slice(0, 10);
  const overdueSchedules = schedules.filter((s) => s.nextDueDate < today);
  const outstanding = sumMoney(overdueSchedules.map((s) => s.amount), currency);
  const upcomingSchedules = schedules
    .filter((s) => s.nextDueDate >= today)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  const nextDue = upcomingSchedules[0];
  const nextPayoutAmount = nextDue ? sumMoney(upcomingSchedules.filter((s) => s.nextDueDate === nextDue.nextDueDate).map((s) => s.amount), currency) : zeroMoney(currency);

  const recent = [...payments].sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? "")).slice(0, 5);

  if (schedules.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm text-center">
        <p className="text-slate-500">No rent schedules on your listings yet — collections will show up here once a tenant is leased and paying through HuzaEstate.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="text-sm font-semibold text-slate-500 mb-1">Total Collected</div>
          <div className="text-2xl font-black text-slate-900">{formatMoney(collected)}</div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="text-sm font-semibold text-slate-500 mb-1">Outstanding</div>
          <div className={`text-2xl font-black ${overdueSchedules.length ? "text-red-500" : "text-slate-900"}`}>{formatMoney(outstanding)}</div>
          <div className={`text-xs font-bold mt-2 ${overdueSchedules.length ? "text-red-500" : "text-slate-400"}`}>
            {overdueSchedules.length ? `${overdueSchedules.length} tenant${overdueSchedules.length > 1 ? "s" : ""} late` : "All caught up"}
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-slate-500">Next Payout</div>
            {nextDue && <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded">{formatDate(nextDue.nextDueDate)}</span>}
          </div>
          <div className="text-2xl font-black text-slate-900">{nextDue ? formatMoney(nextPayoutAmount) : "—"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Recent Transactions</h3>
          </div>

          <div className="flex flex-col gap-4">
            {recent.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">✓</div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Rent — {p.period}</div>
                    <div className="text-xs text-slate-500">{formatDateTime(p.paidAt)}</div>
                  </div>
                </div>
                <div className="font-black text-slate-900">+{formatMoney(p.landlordPayout)}</div>
              </div>
            ))}

            {overdueSchedules.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 border border-red-100 bg-red-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">!</div>
                  <div>
                    <div className="font-bold text-red-900 text-sm">Overdue Rent</div>
                    <div className="text-xs text-red-600">Due {formatDate(s.nextDueDate)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    disabled={reminded.has(s.id)}
                    onClick={() => setReminded((prev) => new Set(prev).add(s.id))}
                    className="text-xs font-bold text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reminded.has(s.id) ? "Reminder sent" : "Send Reminder"}
                  </button>
                  <div className="font-black text-red-600">-{formatMoney(s.amount)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg mb-1">Collections Breakdown</h3>
          <p className="text-sm text-slate-500 mb-6">All time</p>
          <BarBreakdown
            format={(v) => formatMoney({ amountMinor: v, currency })}
            items={[
              { label: "Collected", value: collected.amountMinor, color: "#0ca30c" },
              { label: "Upcoming", value: nextPayoutAmount.amountMinor, color: SERIES_COLOR },
              { label: "Outstanding", value: outstanding.amountMinor, color: "#d03b3b" },
            ]}
          />
        </div>
      </div>

      <p className="text-xs text-slate-400">{PROTOTYPE_TRANSACTION_LABEL}</p>
    </div>
  );
}
