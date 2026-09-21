// Singleton store engine for rent schedules & payment history, mirroring
// src/lib/tenantApplications/store.ts.

import { RentPaymentsStorageService, type RentPaymentsState } from "./storage";
import type { RentSchedule, RentPaymentRecord, PaymentMethod } from "./types";
import { applyBasisPoints, subtractMoney } from "@/lib/finance/money";

type Listener = () => void;

let state: RentPaymentsState | null = null;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function ensureLoaded(): RentPaymentsState {
  if (state !== null) return state;
  state = RentPaymentsStorageService.load();
  return state;
}

function persist() {
  if (state) RentPaymentsStorageService.save(state);
}

function addOneMonth(isoDate: string): string {
  const d = new Date(isoDate);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 10);
}

function periodFor(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export const RentPaymentsStoreEngine = {
  getSchedules(): RentSchedule[] {
    return ensureLoaded().schedules;
  },

  getPayments(): RentPaymentRecord[] {
    return ensureLoaded().payments;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setAutopay(scheduleId: string, autopayEnabled: boolean): void {
    const current = ensureLoaded();
    state = { ...current, schedules: current.schedules.map((s) => (s.id === scheduleId ? { ...s, autopayEnabled } : s)) };
    persist();
    notifyListeners();
  },

  setMethod(scheduleId: string, method: PaymentMethod): void {
    const current = ensureLoaded();
    state = { ...current, schedules: current.schedules.map((s) => (s.id === scheduleId ? { ...s, method } : s)) };
    persist();
    notifyListeners();
  },

  /** Simulated payment capture — matches this prototype's finance module
   *  (mock provider only; see finance/types.ts header). Immediately settles
   *  as "successful" and advances the schedule's next due date by a month,
   *  rather than round-tripping through a real provider webhook. */
  payNow(scheduleId: string): RentPaymentRecord | undefined {
    const current = ensureLoaded();
    const schedule = current.schedules.find((s) => s.id === scheduleId);
    if (!schedule) return undefined;

    const platformFee = applyBasisPoints(schedule.amount, schedule.platformFeeBasisPoints);
    const landlordPayout = subtractMoney(schedule.amount, platformFee);
    const record: RentPaymentRecord = {
      id: `rent-pay-${scheduleId}-${periodFor(schedule.nextDueDate)}`,
      scheduleId,
      period: periodFor(schedule.nextDueDate),
      amount: schedule.amount,
      status: "successful",
      method: schedule.method,
      platformFee,
      landlordPayout,
      paidAt: new Date().toISOString(),
    };

    state = {
      schedules: current.schedules.map((s) => (s.id === scheduleId ? { ...s, nextDueDate: addOneMonth(s.nextDueDate) } : s)),
      payments: [record, ...current.payments],
    };
    persist();
    notifyListeners();
    return record;
  },

  /** Demo stand-in for a real payment-provider's due-date webhook: on load,
   *  silently settles any autopay-enabled schedule whose due date has
   *  already passed, so a returning visitor sees a believable up-to-date
   *  history instead of a growing pile of missed payments. Not a real
   *  scheduler — it only runs when something reads the store. */
  advanceDuePayments(): void {
    const current = ensureLoaded();
    const today = new Date().toISOString().slice(0, 10);
    const due = current.schedules.filter((s) => s.autopayEnabled && s.nextDueDate <= today);
    due.forEach((s) => this.payNow(s.id));
  },
};
