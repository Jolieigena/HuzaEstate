import type { FinanceStore } from "./types";
import { canUseBrowserStorage, readBrowserFlag, readBrowserJson, writeBrowserFlag, writeBrowserJson } from "@/lib/storage/browserStorage";

const STORE_KEY = "huzaestate_finance_v2";
const SEEDED_FLAG_KEY = "huzaestate_finance_seeded_v2";

/**
 * Defensive localStorage wrapper for the Finance module, matching the
 * Execution/Renovate/Professional/Admin storage.ts convention. This is
 * frontend prototype storage — not a production ledger.
 */
export const FinanceStorageService = {
  isAvailable(): boolean {
    return canUseBrowserStorage("__huzaestate_finance_test__");
  },

  loadStore(): FinanceStore | null {
    return readBrowserJson<FinanceStore | null>(STORE_KEY, null);
  },

  saveStore(store: FinanceStore): boolean {
    return writeBrowserJson(STORE_KEY, store);
  },

  hasSeeded(): boolean {
    return readBrowserFlag(SEEDED_FLAG_KEY, true);
  },

  markSeeded(): void {
    writeBrowserFlag(SEEDED_FLAG_KEY);
  },
};
