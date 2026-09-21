import type { RentSchedule, RentPaymentRecord } from "./types";
import { SEED_RENT_SCHEDULES, SEED_RENT_PAYMENTS } from "./seed";

const STORE_KEY = "huzaestate_rent_payments_v1";

export interface RentPaymentsState {
  schedules: RentSchedule[];
  payments: RentPaymentRecord[];
}

export const SEED_STATE: RentPaymentsState = { schedules: SEED_RENT_SCHEDULES, payments: SEED_RENT_PAYMENTS };

/** Defensive localStorage wrapper, matching the TenantApplications/SellerListings
 *  storage.ts convention. Falls back to seed data (not empty) when nothing saved yet. */
export const RentPaymentsStorageService = {
  load(): RentPaymentsState {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return SEED_STATE;
      return JSON.parse(raw) as RentPaymentsState;
    } catch {
      return SEED_STATE;
    }
  },

  save(state: RentPaymentsState): boolean {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  },
};
