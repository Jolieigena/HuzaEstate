"use client";

import { useSyncExternalStore } from "react";
import { CompareStoreEngine } from "./store";

const EMPTY: string[] = [];

// Server snapshot pinned to [] so the page hydrates the same on the server and in the browser.
export function useCompareIds(): string[] {
  return useSyncExternalStore(CompareStoreEngine.subscribe, () => CompareStoreEngine.getAll(), () => EMPTY);
}
