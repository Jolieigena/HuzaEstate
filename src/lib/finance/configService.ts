import { FinanceStoreEngine } from "./store";
import { newId } from "./ids";
import type { FeeConfiguration, LiveModeChecklist, PaymentConfiguration } from "./types";

export const ConfigService = {
  getConfig(): PaymentConfiguration {
    return FinanceStoreEngine.getStore().paymentConfiguration;
  },
  getFeeConfigVersions(): FeeConfiguration[] {
    return FinanceStoreEngine.getStore().feeConfigVersions;
  },
  getActiveFeeConfig(): FeeConfiguration {
    const s = FinanceStoreEngine.getStore();
    return s.feeConfigVersions.find((f) => f.version === s.paymentConfiguration.activeFeeConfigVersion) ?? s.feeConfigVersions[s.feeConfigVersions.length - 1];
  },

  update(patch: Partial<PaymentConfiguration>, actorId: string, reason: string): PaymentConfiguration {
    const updated = FinanceStoreEngine.mutate((s) => {
      s.paymentConfiguration = { ...s.paymentConfiguration, ...patch, updatedAt: new Date().toISOString(), updatedBy: actorId };
      return s.paymentConfiguration;
    });
    FinanceStoreEngine.appendAudit("configuration_changed", actorId, "configuration", "payment-configuration", reason || "Payment configuration updated.", reason);
    return updated;
  },

  updateLiveModeChecklist(patch: Partial<LiveModeChecklist>, actorId: string): PaymentConfiguration {
    return ConfigService.update({ liveModeChecklist: { ...ConfigService.getConfig().liveModeChecklist, ...patch } }, actorId, "Live-mode readiness checklist updated.");
  },

  /** Live mode can only be enabled once every checklist item is true — and even then, no real provider adapter exists in this build, so getActiveProvider() will still refuse to return a working provider. */
  setLiveModeEnabled(enable: boolean, actorId: string, reason: string): { ok: boolean; config: PaymentConfiguration; blockedReasons: string[] } {
    const config = ConfigService.getConfig();
    if (!enable) {
      const updated = ConfigService.update({ providerMode: "sandbox" }, actorId, reason || "Live mode disabled.");
      FinanceStoreEngine.appendAudit("live_mode_toggled", actorId, "configuration", "payment-configuration", "Live mode disabled.", reason);
      return { ok: true, config: updated, blockedReasons: [] };
    }
    const checklist = config.liveModeChecklist;
    const blockedReasons = Object.entries(checklist)
      .filter(([, done]) => !done)
      .map(([key]) => key);
    if (blockedReasons.length > 0) return { ok: false, config, blockedReasons };

    const updated = ConfigService.update({ providerMode: "live" }, actorId, reason || "Live mode enabled after readiness checklist completed.");
    FinanceStoreEngine.appendAudit("live_mode_toggled", actorId, "configuration", "payment-configuration", "Live mode enabled.", reason);
    return { ok: true, config: updated, blockedReasons: [] };
  },

  createFeeConfigVersion(input: Omit<FeeConfiguration, "id" | "version" | "createdAt">, actorId: string): FeeConfiguration {
    const created = FinanceStoreEngine.mutate((s) => {
      const nextVersion = Math.max(0, ...s.feeConfigVersions.map((f) => f.version)) + 1;
      const feeConfig: FeeConfiguration = { ...input, id: newId("feeconfig"), version: nextVersion, createdAt: new Date().toISOString() };
      s.feeConfigVersions = [...s.feeConfigVersions, feeConfig];
      s.paymentConfiguration = { ...s.paymentConfiguration, activeFeeConfigVersion: nextVersion, updatedAt: new Date().toISOString(), updatedBy: actorId };
      return feeConfig;
    });
    FinanceStoreEngine.appendAudit("configuration_changed", actorId, "configuration", "fee-configuration", `Fee configuration version ${created.version} created and activated.`);
    return created;
  },
};
