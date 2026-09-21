import { RentPaymentsStoreEngine } from "./store";
import { canManageSchedule, canViewPayout } from "./permissions";
import type { RentSchedule, RentPaymentRecord, PaymentMethod } from "./types";

export const RentPaymentService = {
  getScheduleForTenant(accountId: string | undefined): RentSchedule | undefined {
    return RentPaymentsStoreEngine.getSchedules().find((s) => s.tenantAccountId === accountId);
  },

  getPaymentsForSchedule(scheduleId: string): RentPaymentRecord[] {
    return RentPaymentsStoreEngine.getPayments()
      .filter((p) => p.scheduleId === scheduleId)
      .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""));
  },

  /** Every schedule the given landlord owns, plus their settled payouts —
   *  the basis for the Manager Portal's Payments tab totals. */
  getPayoutsForLandlord(accountId: string | undefined): { schedules: RentSchedule[]; payments: RentPaymentRecord[] } {
    const schedules = RentPaymentsStoreEngine.getSchedules().filter((s) => canViewPayout(accountId, s));
    const scheduleIds = new Set(schedules.map((s) => s.id));
    const payments = RentPaymentsStoreEngine.getPayments().filter((p) => scheduleIds.has(p.scheduleId));
    return { schedules, payments };
  },

  payNow(accountId: string | undefined, scheduleId: string): RentPaymentRecord | undefined {
    const schedule = RentPaymentsStoreEngine.getSchedules().find((s) => s.id === scheduleId);
    if (!schedule || !canManageSchedule(accountId, schedule)) return undefined;
    return RentPaymentsStoreEngine.payNow(scheduleId);
  },

  toggleAutopay(accountId: string | undefined, scheduleId: string): void {
    const schedule = RentPaymentsStoreEngine.getSchedules().find((s) => s.id === scheduleId);
    if (!schedule || !canManageSchedule(accountId, schedule)) return;
    RentPaymentsStoreEngine.setAutopay(scheduleId, !schedule.autopayEnabled);
  },

  setMethod(accountId: string | undefined, scheduleId: string, method: PaymentMethod): void {
    const schedule = RentPaymentsStoreEngine.getSchedules().find((s) => s.id === scheduleId);
    if (!schedule || !canManageSchedule(accountId, schedule)) return;
    RentPaymentsStoreEngine.setMethod(scheduleId, method);
  },
};
