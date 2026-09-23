import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/server";
import { PLAN_LABELS, PLAN_PRICES, type PlanTier } from "@/lib/postingPlans/types";

const PAID_TIERS = new Set<PlanTier>(["silver", "gold", "diamond"]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const tier = body?.tier as PlanTier | undefined;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (!tier || !PAID_TIERS.has(tier)) {
    return NextResponse.json({ error: "A valid paid tier is required." }, { status: 400 });
  }
  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    // No STRIPE_SECRET_KEY configured — tell the client to fall back to the
    // existing simulated checkout (PlanCheckout.tsx) instead of erroring.
    return NextResponse.json({ demo: true });
  }

  const origin = request.headers.get("origin") || new URL(request.url).origin;
  const price = PLAN_PRICES[tier as Exclude<PlanTier, "free">];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: price.currency.toLowerCase(),
            product_data: { name: `HuzaEstate ${PLAN_LABELS[tier]} Plan` },
            unit_amount: price.amountMinor,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: { tier, name, phone },
      success_url: `${origin}/sell/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/sell?canceled=true`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not start checkout." }, { status: 500 });
  }
}
