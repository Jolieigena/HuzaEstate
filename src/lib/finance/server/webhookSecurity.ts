// Server-only. Never import this from a "use client" file — it uses
// node:crypto and a process-lifetime in-memory idempotency set that must
// not run in the browser.
//
// PROTOTYPE LIMITATION: the de-dupe set below is process-memory only and
// resets on server restart or across serverless instances. A production
// deployment needs a persistent idempotency store (e.g. a database table
// keyed by provider event ID) — there is no database in this codebase to
// back one. This is called out in the module's completion report.

import { createHmac, timingSafeEqual } from "node:crypto";

// Dev-only fallback so the prototype works without extra setup. A real
// deployment must set FINANCE_WEBHOOK_SECRET and never rely on this value.
const DEV_ONLY_FALLBACK_SECRET = "huzaestate-prototype-webhook-secret-do-not-use-in-production";

function getSecret(): string {
  return process.env.FINANCE_WEBHOOK_SECRET || DEV_ONLY_FALLBACK_SECRET;
}

export function signPayload(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function verifySignature(payload: string, signature: string): boolean {
  const expected = signPayload(payload);
  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

const MAX_EVENT_AGE_MS = 5 * 60 * 1000; // 5 minutes

export function isTimestampFresh(timestamp: number): boolean {
  return Math.abs(Date.now() - timestamp) <= MAX_EVENT_AGE_MS;
}

// Process-lifetime replay/duplicate protection. See PROTOTYPE LIMITATION above.
const processedEventIds = new Set<string>();

export function isDuplicateEvent(eventId: string): boolean {
  return processedEventIds.has(eventId);
}

export function markEventProcessed(eventId: string): void {
  processedEventIds.add(eventId);
  // Bound memory in long-running dev servers.
  if (processedEventIds.size > 5000) {
    const first = processedEventIds.values().next().value;
    if (first) processedEventIds.delete(first);
  }
}
