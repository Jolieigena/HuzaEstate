"use client";

import { useState } from "react";
import { useDiscountNeedsConfirmedEmail } from "@/lib/clientDiscounts/api";
import { useLanguage } from "@/lib/i18n/language";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

/** Shown where discounted prices appear when the client has a discount waiting but has not confirmed their email yet. */
export default function ConfirmEmailForDiscount({ token, className = "" }: { token: string | null; className?: string }) {
  const { t } = useLanguage();
  const needed = useDiscountNeedsConfirmedEmail(token);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  if (!needed || !token) return null;

  const send = async () => {
    setState("sending");
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/confirm-email/send`, {
        method: "POST",
        headers: { "x-huza-client": "web", Authorization: `Bearer ${token}` },
      });
      if (res.ok) return setState("sent");
      const data = await res.json().catch(() => null);
      setError(typeof data?.message === "string" ? data.message : t("Something went wrong. Please try again."));
    } catch {
      setError(t("Could not reach the server. Please try again."));
    }
    setState("idle");
  };

  return (
    <div role="status" className={`${className} rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-800`}>
      <p className="font-semibold">{t("You have a discount waiting.")}</p>
      {state === "sent" ? (
        <p className="mt-1">{t("We sent you an email. Open the link in it to confirm your email, then come back here to see your prices.")}</p>
      ) : (
        <>
          <p className="mt-1">{t("Confirm your email address to use it.")}</p>
          <button type="button" onClick={send} disabled={state === "sending"} className="mt-2 rounded-lg bg-slate-900 px-4 py-2 font-bold text-white transition-colors hover:bg-[#2ec440] disabled:opacity-60">
            {state === "sending" ? t("Sending…") : t("Send me the link")}
          </button>
          {error && <p role="alert" className="mt-2 font-semibold text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
}
