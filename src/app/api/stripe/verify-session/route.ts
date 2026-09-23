import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/server";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "session_id is required." }, { status: 400 });

  const stripe = getStripeClient();
  if (!stripe) return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({
      paid: session.payment_status === "paid",
      tier: session.metadata?.tier ?? null,
      name: session.metadata?.name ?? null,
      email: session.customer_details?.email ?? session.customer_email ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not verify session." }, { status: 500 });
  }
}
