"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/language";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

/** After signing up with an email and password, or trying to sign in before confirming: the account opens from the link we emailed. */
export default function CheckYourEmail({ email, next, emailSent = true }: { email: string; next?: string; emailSent?: boolean }) {
  const { t } = useLanguage();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const resend = async () => {
    setState("sending");
    try {
      const res = await fetch(`${API_URL}/auth/confirm-email/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-huza-client": "web" },
        body: JSON.stringify({ email, ...(next ? { next } : {}) }),
      });
      setState(res.ok ? "sent" : "failed");
    } catch {
      setState("failed");
    }
  };

  return (
    <div role="status" className="rounded-xl border border-[#2ec440]/30 bg-[#2ec440]/10 px-4 py-4 text-sm text-slate-800">
      <p className="text-base font-bold text-slate-900">{t("Check your email")}</p>
      {emailSent ? (
        <p className="mt-1">{t("We sent a link to {email}. Open it to confirm your email and finish creating your account.", { email })}</p>
      ) : (
        <p className="mt-1">{t("Your account was created, but we could not send the email to {email} just now. Please send it again.", { email })}</p>
      )}
      <p className="mt-2 text-slate-600">{t("No email? Check your spam folder, or send it again.")}</p>
      <button type="button" onClick={resend} disabled={state === "sending"} className="mt-3 rounded-lg bg-slate-900 px-4 py-2 font-bold text-white transition-colors hover:bg-[#2ec440] disabled:opacity-60">
        {state === "sending" ? t("Sending…") : t("Send it again")}
      </button>
      {state === "sent" && <p className="mt-2 font-semibold text-slate-700">{t("Sent. Please check your inbox.")}</p>}
      {state === "failed" && <p role="alert" className="mt-2 font-semibold text-red-600">{t("Could not send it right now. Please try again in a few minutes.")}</p>}
    </div>
  );
}
