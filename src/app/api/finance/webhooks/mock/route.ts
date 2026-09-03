import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { isDuplicateEvent, isTimestampFresh, markEventProcessed, signPayload, verifySignature } from "@/lib/finance/server/webhookSecurity";

// Real server-side webhook verification for the Mock provider (Phase 24 /
// Journey F). Two modes:
//
//  - "simulate": used by the demo checkout UI ("Simulate Success/Failure")
//    and the admin Security Test panel. The server itself generates and
//    signs the event, so the happy path always succeeds — this exercises
//    the genuine sign → verify → de-dupe round trip even though no real
//    payment provider exists yet.
//  - "external": used only by the admin Security Test panel to send a
//    provider-style event with a caller-supplied signature, so an invalid
//    signature or a replayed event ID can be demonstrated being rejected.
//
// Never trusts a browser success callback, query-string status, or
// client-provided amount as the source of truth on its own — the signature
// and de-dupe checks below are the actual gate.

type MockOutcome = "success" | "failure" | "expired" | "cancelled";

interface EventPayload {
  eventId: string;
  paymentId: string;
  outcome: MockOutcome;
  amountMinor: number;
  currency: string;
  timestamp: number;
}

function canonicalPayload(event: EventPayload): string {
  return JSON.stringify({
    eventId: event.eventId,
    paymentId: event.paymentId,
    outcome: event.outcome,
    amountMinor: event.amountMinor,
    currency: event.currency,
    timestamp: event.timestamp,
  });
}

function safeError(message: string, status: number) {
  // Never echo back secrets, signatures, or internal detail.
  return NextResponse.json({ verified: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return safeError("Invalid request body.", 400);
  }

  const mode = body.mode;
  if (mode !== "simulate" && mode !== "external") {
    return safeError("Unsupported webhook mode.", 400);
  }

  const paymentId = body.paymentId;
  const outcome = body.outcome;
  const amountMinor = body.amountMinor;
  const currency = body.currency;
  if (typeof paymentId !== "string" || typeof outcome !== "string" || typeof amountMinor !== "number" || typeof currency !== "string") {
    return safeError("Missing required event fields.", 400);
  }
  if (!["success", "failure", "expired", "cancelled"].includes(outcome)) {
    return safeError("Unsupported outcome.", 400);
  }

  if (mode === "simulate") {
    const eventId = typeof body.eventId === "string" && body.eventId.length > 0 ? body.eventId : randomUUID();
    const timestamp = Date.now();
    const event: EventPayload = { eventId, paymentId, outcome: outcome as MockOutcome, amountMinor, currency, timestamp };

    if (isDuplicateEvent(eventId)) {
      return safeError("Duplicate event rejected: this event ID has already been processed.", 409);
    }

    const signature = signPayload(canonicalPayload(event));
    // Sanity round-trip: verify our own signature before accepting.
    if (!verifySignature(canonicalPayload(event), signature)) {
      return safeError("Internal signature verification failed.", 500);
    }

    markEventProcessed(eventId);
    return NextResponse.json({ verified: true, event });
  }

  // mode === "external"
  const eventId = body.eventId;
  const timestamp = body.timestamp;
  const signature = body.signature;
  if (typeof eventId !== "string" || typeof timestamp !== "number" || typeof signature !== "string") {
    return safeError("Missing required signed-event fields.", 400);
  }

  const event: EventPayload = { eventId, paymentId, outcome: outcome as MockOutcome, amountMinor, currency, timestamp };

  if (!isTimestampFresh(timestamp)) {
    return safeError("Event timestamp is outside the acceptable window.", 400);
  }
  if (!verifySignature(canonicalPayload(event), signature)) {
    return safeError("Invalid webhook signature.", 401);
  }
  if (isDuplicateEvent(eventId)) {
    return safeError("Duplicate event rejected: this event ID has already been processed.", 409);
  }

  markEventProcessed(eventId);
  return NextResponse.json({ verified: true, event });
}
