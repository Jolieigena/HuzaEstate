import Stripe from "stripe";

let client: Stripe | null = null;

/** Server-only — never import this from a "use client" file. Returns null
 *  when STRIPE_SECRET_KEY isn't set, matching this app's existing pattern
 *  for optional external services (see .env.example's WORLD_LABS_API_KEY /
 *  GEMINI_API_KEY: unset means "run the feature in demo mode," not a crash).
 *  The API routes that call this fall back to the existing simulated
 *  PlanCheckout flow when it returns null. */
export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) client = new Stripe(key);
  return client;
}
