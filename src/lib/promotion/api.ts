// Real payment-service client for promotion checkout — mirrors lib/postingPlans/api.ts's own
// createSubscribeCheckout/createPerPostCheckout pattern exactly, same PAYMENT_API_URL and error
// handling, just a distinct endpoint (POST /checkout/promote).

const PAYMENT_API_URL = process.env.NEXT_PUBLIC_PAYMENT_API_URL || "http://localhost:8081/api/payment-service";

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.message || data?.error || "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

export type PromoteCheckoutResult = { ok: true; url: string } | { ok: true; demo: true } | { ok: false; error: string };

export async function createPromoteCheckout(token: string, propertyId: string, days: number, successUrl: string, cancelUrl: string): Promise<PromoteCheckoutResult> {
  try {
    const res = await fetch(`${PAYMENT_API_URL}/checkout/promote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ propertyId, days, successUrl, cancelUrl }),
    });
    if (!res.ok) return { ok: false, error: await parseErrorMessage(res) };
    const data = await res.json();
    if (data.demo) return { ok: true, demo: true };
    return { ok: true, url: data.url as string };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}
