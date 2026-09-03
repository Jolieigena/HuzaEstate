"use client";

// Client-side helpers that round-trip through the real server-side webhook
// verification endpoint (src/app/api/finance/webhooks/mock/route.ts). Used
// by (1) the demo checkout's "Simulate Success/Failure" actions, and (2)
// the admin Security Test panel that deliberately sends a bad signature or
// a replayed event ID to demonstrate rejection (Journey F).

export type MockOutcome = "success" | "failure" | "expired" | "cancelled";

export interface VerifiedWebhookEvent {
  eventId: string;
  paymentId: string;
  outcome: MockOutcome;
  amountMinor: number;
  currency: string;
  timestamp: number;
}

export interface WebhookRouteResult {
  verified: boolean;
  event?: VerifiedWebhookEvent;
  error?: string;
}

async function callWebhookRoute(body: Record<string, unknown>): Promise<WebhookRouteResult> {
  try {
    const res = await fetch("/api/finance/webhooks/mock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return data as WebhookRouteResult;
  } catch {
    return { verified: false, error: "Could not reach the webhook endpoint." };
  }
}

/** Server generates and signs the event, then verifies it — the genuine happy-path round trip for Mock mode. */
export function simulateProviderOutcome(paymentId: string, outcome: MockOutcome, amountMinor: number, currency: string, eventIdOverride?: string): Promise<WebhookRouteResult> {
  return callWebhookRoute({ mode: "simulate", paymentId, outcome, amountMinor, currency, eventId: eventIdOverride });
}

/** Caller supplies eventId/timestamp/signature directly — used only by the admin Security Test panel to demonstrate invalid-signature and duplicate-event rejection. */
export function sendExternalWebhookEvent(payload: { eventId: string; paymentId: string; outcome: MockOutcome; amountMinor: number; currency: string; timestamp: number; signature: string }): Promise<WebhookRouteResult> {
  return callWebhookRoute({ mode: "external", ...payload });
}
