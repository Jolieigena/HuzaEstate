import type { RentSchedule, RentPaymentRecord } from "./types";
import { money, applyBasisPoints, subtractMoney } from "@/lib/finance/money";

const PLATFORM_FEE_BPS = 500; // 5%

function payoutFor(amount: ReturnType<typeof money>) {
  const platformFee = applyBasisPoints(amount, PLATFORM_FEE_BPS);
  return { platformFee, landlordPayout: subtractMoney(amount, platformFee) };
}

export const SEED_RENT_SCHEDULES: RentSchedule[] = [
  {
    id: "rent-schedule-downtown-penthouse",
    propertyId: "myprop-downtown-penthouse",
    tenantAccountId: "demo-user",
    landlordAccountId: "seller-user",
    amount: money(1200, "USD"),
    dueDayOfMonth: 1,
    method: "mobile_money",
    autopayEnabled: true,
    nextDueDate: "2026-10-01",
    platformFeeBasisPoints: PLATFORM_FEE_BPS,
  },
];

const HISTORY: { id: string; period: string; paidAt: string }[] = [
  { id: "rent-pay-2026-06", period: "2026-06", paidAt: "2026-06-01T08:12:00.000Z" },
  { id: "rent-pay-2026-07", period: "2026-07", paidAt: "2026-07-01T08:05:00.000Z" },
  { id: "rent-pay-2026-08", period: "2026-08", paidAt: "2026-08-01T08:09:00.000Z" },
  { id: "rent-pay-2026-09", period: "2026-09", paidAt: "2026-09-01T08:07:00.000Z" },
];

export const SEED_RENT_PAYMENTS: RentPaymentRecord[] = HISTORY.map(({ id, period, paidAt }) => {
  const amount = money(1200, "USD");
  const { platformFee, landlordPayout } = payoutFor(amount);
  return {
    id,
    scheduleId: "rent-schedule-downtown-penthouse",
    period,
    amount,
    status: "successful",
    method: "mobile_money",
    platformFee,
    landlordPayout,
    paidAt,
  };
});
