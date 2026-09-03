import type { FinanceStore } from "./types";

const STORE_KEY = "huzaestate_finance_v1";
const SEEDED_FLAG_KEY = "huzaestate_finance_seeded_v1";

/**
 * Defensive localStorage wrapper for the Finance module, matching the
 * Execution/Renovate/Professional/Admin storage.ts convention. This is
 * frontend prototype storage — not a production ledger.
 */
export const FinanceStorageService = {
  isAvailable(): boolean {
    try {
      const testKey = "__huzaestate_finance_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  loadStore(): FinanceStore | null {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as FinanceStore;
    } catch {
      return null;
    }
  },

  saveStore(store: FinanceStore): boolean {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
      return true;
    } catch {
      return false;
    }
  },

  hasSeeded(): boolean {
    try {
      return window.localStorage.getItem(SEEDED_FLAG_KEY) === "true";
    } catch {
      return true;
    }
  },

  markSeeded(): void {
    try {
      window.localStorage.setItem(SEEDED_FLAG_KEY, "true");
    } catch {
      // ignore
    }
  },
};
