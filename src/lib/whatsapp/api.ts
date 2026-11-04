// access-service client for WhatsApp codes: sending a sign-in code to a verified number, and adding a number to the signed-in account.
// Signing in with the code itself is `loginWithWhatsapp` in auth-context, which also stores the session.

const ACCESS_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(path: string, body: unknown, token?: string | null): Promise<Result<T>> {
  try {
    const res = await fetch(`${ACCESS_API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-huza-client": "web", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message = typeof data?.message === "string" ? data.message : Array.isArray(data?.message) ? data.message.join(" ") : "Something went wrong. Please try again.";
      return { ok: false, error: message };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}

export const WhatsappApi = {
  /** Sends a sign-in code to a number that has an account. It answers the same for any number, so it never says who is registered. */
  requestCode: (phone: string) => call<{ ok: boolean }>("/auth/whatsapp/code", { phone }),
  /** Signed in: sends a code to a number the account wants to add. */
  startLink: (token: string, phone: string) => call<{ ok: boolean }>("/auth/whatsapp/link/start", { phone }, token),
  /** Signed in: proves the number with the code and saves it on the account. */
  confirmLink: (token: string, phone: string, code: string) => call<{ whatsappPhone: string }>("/auth/whatsapp/link/confirm", { phone, code }, token),
  unlink: (token: string) => call<{ whatsappPhone: null }>("/auth/whatsapp/unlink", {}, token),
};
