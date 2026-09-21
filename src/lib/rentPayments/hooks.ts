"use client";

import { useEffect, useSyncExternalStore } from "react";
import { RentPaymentsStoreEngine } from "./store";
import { SEED_STATE } from "./storage";
import type { RentSchedule, RentPaymentRecord } from "./types";

// getServerSnapshot pinned to the fixed seed arrays, matching the
// tenantApplications/landlordProfile hooks — SSR has no localStorage.
export function useRentSchedules(): RentSchedule[] {
  useEffect(() => {
    RentPaymentsStoreEngine.advanceDuePayments();
  }, []);
  return useSyncExternalStore(
    RentPaymentsStoreEngine.subscribe,
    () => RentPaymentsStoreEngine.getSchedules(),
    () => SEED_STATE.schedules
  );
}

export function useRentPayments(): RentPaymentRecord[] {
  return useSyncExternalStore(
    RentPaymentsStoreEngine.subscribe,
    () => RentPaymentsStoreEngine.getPayments(),
    () => SEED_STATE.payments
  );
}
