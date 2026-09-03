"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ProfessionalService } from "./service";

export function useProfessionalState() {
  return useSyncExternalStore(ProfessionalService.subscribe, ProfessionalService.getSnapshot, ProfessionalService.getServerSnapshot);
}

export function useProfessionalProfile(accountId?: string) {
  const state = useProfessionalState();
  return useMemo(() => state.profiles.find((profile) => profile.accountId === accountId), [state, accountId]);
}
