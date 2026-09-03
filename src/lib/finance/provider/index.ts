import type { PaymentConfiguration } from "../types";
import { mockProvider } from "./mockProvider";
import { ProviderUnavailableError, type PaymentProvider } from "./types";

/**
 * Resolves the active provider from admin configuration. Only Mock mode
 * returns a working adapter — Sandbox has no real sandbox account
 * configured, and Live is permanently blocked until the full readiness
 * checklist (Phase 27) is met by a real deployment. This function is the
 * single place that decision is made, so no UI component hardcodes one
 * provider.
 */
export function getActiveProvider(config: PaymentConfiguration): PaymentProvider {
  if (!config.paymentsEnabled) throw new ProviderUnavailableError("Payments are currently disabled by an administrator.");
  if (config.providerMode === "mock") return mockProvider;
  if (config.providerMode === "sandbox") throw new ProviderUnavailableError("Sandbox provider is not configured — no sandbox account exists for this deployment yet.");
  throw new ProviderUnavailableError("Live mode is disabled until provider configuration, security review and compliance approval are complete.");
}

export * from "./types";
export { mockProvider } from "./mockProvider";
export { simulateProviderOutcome, sendExternalWebhookEvent } from "./mockWebhookClient";
export type { MockOutcome, VerifiedWebhookEvent, WebhookRouteResult } from "./mockWebhookClient";
